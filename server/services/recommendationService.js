import mongoose from "mongoose";
import Product from "../models/Product.js";
import Order from "../models/Order.js";
import Wishlist from "../models/Wishlist.js";
import Cart from "../models/Cart.js";
import redis from "../config/redis.js";

const REC_CACHE_TTL = 600; // 10 minutes cache

/**
 * Helper to safely read from Redis cache
 */
async function getCachedRecs(cacheKey) {
  try {
    const cached = await redis.get(cacheKey);
    if (cached) return JSON.parse(cached);
  } catch {
    // Ignore redis error in dev
  }
  return null;
}

/**
 * Helper to safely write to Redis cache
 */
async function setCachedRecs(cacheKey, data) {
  try {
    await redis.setex(cacheKey, REC_CACHE_TTL, JSON.stringify(data));
  } catch {
    // Ignore redis error in dev
  }
}

/**
 * 1. FREQUENTLY BOUGHT TOGETHER
 * Mines real multi-item orders containing productId.
 * Falls back to room-complementary pairings (e.g. Sofa -> Coffee table + Accent chair; Bed -> Bedside table).
 */
export async function getFrequentlyBoughtTogether(productId, limit = 2) {
  const cacheKey = `rec:fbt:${productId}:${limit}`;
  const cached = await getCachedRecs(cacheKey);
  if (cached) return cached;

  if (!mongoose.Types.ObjectId.isValid(productId)) return [];

  const targetId = new mongoose.Types.ObjectId(productId);
  const targetProduct = await Product.findById(targetId).lean();
  if (!targetProduct) return [];

  // Step 1: Real order co-occurrence analysis
  const coOrders = await Order.aggregate([
    { $match: { "items.product": targetId, status: { $ne: "Cancelled" } } },
    { $unwind: "$items" },
    { $match: { "items.product": { $ne: targetId } } },
    {
      $group: {
        _id: "$items.product",
        frequency: { $sum: 1 },
      },
    },
    { $sort: { frequency: -1 } },
    { $limit: limit },
  ]);

  let foundProductIds = coOrders.map((o) => o._id);

  // Step 2: Fallback / complement with complementary furniture categories
  if (foundProductIds.length < limit) {
    const needed = limit - foundProductIds.length;
    let complementaryCategoryFilter = {};

    const cat = targetProduct.category;
    if (cat === "Sofas & Seating") {
      complementaryCategoryFilter = {
        category: { $in: ["Tables & Desks", "Living Room", "Storage & Cabinets"] },
      };
    } else if (cat === "Beds & Bedroom") {
      complementaryCategoryFilter = {
        category: { $in: ["Storage & Cabinets", "Tables & Desks", "Living Room"] },
      };
    } else if (cat === "Dining Furniture") {
      complementaryCategoryFilter = {
        category: { $in: ["Dining Furniture", "Storage & Cabinets", "Tables & Desks"] },
      };
    } else {
      complementaryCategoryFilter = {
        category: { $ne: cat },
      };
    }

    const fallbackProducts = await Product.find({
      _id: { $nin: [targetId, ...foundProductIds] },
      stock: { $gt: 0 },
      ...complementaryCategoryFilter,
    })
      .sort({ rating: -1, reviews: -1 })
      .limit(needed)
      .select("-__v")
      .lean();

    const fallbackIds = fallbackProducts.map((p) => p._id);
    foundProductIds = [...foundProductIds, ...fallbackIds];
  }

  // Hydrate full products
  const products = await Product.find({
    _id: { $in: foundProductIds },
    stock: { $gt: 0 },
  })
    .select("-__v")
    .lean();

  const result = {
    targetProduct,
    recommendations: products,
  };

  await setCachedRecs(cacheKey, result);
  return result;
}

/**
 * 2. CUSTOMERS ALSO BOUGHT
 * Returns top products bought in sessions/orders containing target product, or high-rated products in the same room.
 */
export async function getCustomersAlsoBought(productId, limit = 4) {
  const cacheKey = `rec:also_bought:${productId}:${limit}`;
  const cached = await getCachedRecs(cacheKey);
  if (cached) return cached;

  if (!mongoose.Types.ObjectId.isValid(productId)) return [];

  const targetId = new mongoose.Types.ObjectId(productId);
  const targetProduct = await Product.findById(targetId).lean();
  if (!targetProduct) return [];

  // 1. Check co-purchased orders
  const coOrders = await Order.aggregate([
    { $match: { "items.product": targetId, status: { $ne: "Cancelled" } } },
    { $unwind: "$items" },
    { $match: { "items.product": { $ne: targetId } } },
    {
      $group: {
        _id: "$items.product",
        count: { $sum: 1 },
      },
    },
    { $sort: { count: -1 } },
    { $limit: limit },
  ]);

  let productIds = coOrders.map((o) => o._id);

  // 2. Supplement with popular items in the same room/category
  if (productIds.length < limit) {
    const needed = limit - productIds.length;
    const roomType = targetProduct.specs?.roomType;

    const query = {
      _id: { $nin: [targetId, ...productIds] },
      stock: { $gt: 0 },
    };

    if (roomType) {
      query["specs.roomType"] = roomType;
    } else {
      query.category = targetProduct.category;
    }

    const supplementary = await Product.find(query)
      .sort({ rating: -1, reviews: -1, isBestseller: -1 })
      .limit(needed)
      .lean();

    productIds = [...productIds, ...supplementary.map((p) => p._id)];
  }

  const products = await Product.find({
    _id: { $in: productIds },
    stock: { $gt: 0 },
  })
    .select("-__v")
    .lean();

  await setCachedRecs(cacheKey, products);
  return products;
}

/**
 * 3. SIMILAR PRODUCTS
 * Content/attribute-based similarity: matching category, material, style, woodType and price range (+/- 35%).
 */
export async function getSimilarProducts(productId, limit = 4) {
  const cacheKey = `rec:similar:${productId}:${limit}`;
  const cached = await getCachedRecs(cacheKey);
  if (cached) return cached;

  if (!mongoose.Types.ObjectId.isValid(productId)) return [];

  const targetId = new mongoose.Types.ObjectId(productId);
  const target = await Product.findById(targetId).lean();
  if (!target) return [];

  const minPrice = Math.max(0, target.price * 0.65);
  const maxPrice = target.price * 1.35;

  const filter = {
    _id: { $ne: targetId },
    category: target.category,
    stock: { $gt: 0 },
  };

  // Try tight filter with price band and matching style/wood
  let candidates = await Product.find({
    ...filter,
    price: { $gte: minPrice, $lte: maxPrice },
    $or: [
      { "specs.style": target.specs?.style },
      { "specs.woodType": target.specs?.woodType },
      { "specs.material": target.specs?.material },
    ],
  })
    .sort({ rating: -1, reviews: -1 })
    .limit(limit)
    .lean();

  // If fewer than limit, relax price and spec constraint within same category
  if (candidates.length < limit) {
    const existingIds = candidates.map((c) => c._id);
    const needed = limit - candidates.length;

    const fallback = await Product.find({
      _id: { $nin: [targetId, ...existingIds] },
      category: target.category,
      stock: { $gt: 0 },
    })
      .sort({ rating: -1, reviews: -1 })
      .limit(needed)
      .lean();

    candidates = [...candidates, ...fallback];
  }

  await setCachedRecs(cacheKey, candidates);
  return candidates;
}

/**
 * 4. RECOMMENDED FOR YOU (PERSONALIZED)
 * Utilizes user's order history, wishlist, cart, and recently viewed IDs.
 * Extracts preferred categories & price preferences.
 */
export async function getPersonalizedRecommendations({
  userId,
  recentIds = [],
  wishlistIds = [],
  cartIds = [],
  limit = 4,
}) {
  const interactedProductIds = new Set([
    ...recentIds.filter(Boolean),
    ...wishlistIds.filter(Boolean),
    ...cartIds.filter(Boolean),
  ]);

  // If user is logged in, pull their past orders and remote wishlist
  if (userId && mongoose.Types.ObjectId.isValid(userId)) {
    try {
      const [pastOrders, userWishlist, userCart] = await Promise.all([
        Order.find({ user: userId }).select("items.product").lean(),
        Wishlist.findOne({ user: userId }).select("products").lean(),
        Cart.findOne({ user: userId }).select("items.product").lean(),
      ]);

      (pastOrders || []).forEach((order) => {
        (order.items || []).forEach((item) => {
          if (item.product) interactedProductIds.add(item.product.toString());
        });
      });

      (userWishlist?.products || []).forEach((pId) => {
        if (pId) interactedProductIds.add(pId.toString());
      });

      (userCart?.items || []).forEach((item) => {
        if (item.product) interactedProductIds.add(item.product.toString());
      });
    } catch (e) {
      console.error("Error aggregating user behavior for recommendations:", e.message);
    }
  }

  const idArray = Array.from(interactedProductIds)
    .filter((id) => mongoose.Types.ObjectId.isValid(id))
    .map((id) => new mongoose.Types.ObjectId(id));

  let preferredCategories = [];

  if (idArray.length > 0) {
    const interactedProducts = await Product.find({ _id: { $in: idArray } })
      .select("category specs.roomType price")
      .lean();

    const catCounts = {};
    interactedProducts.forEach((p) => {
      if (p.category) {
        catCounts[p.category] = (catCounts[p.category] || 0) + 1;
      }
    });

    preferredCategories = Object.entries(catCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([cat]) => cat);
  }

  const excludeIds = idArray;
  let recommendations = [];

  // If we found preferred categories from user behavior:
  if (preferredCategories.length > 0) {
    recommendations = await Product.find({
      _id: { $nin: excludeIds },
      category: { $in: preferredCategories },
      stock: { $gt: 0 },
    })
      .sort({ rating: -1, reviews: -1, isBestseller: -1 })
      .limit(limit)
      .lean();
  }

  // If still fewer than limit (cold start or new user): top bestsellers & new arrivals
  if (recommendations.length < limit) {
    const currentIds = recommendations.map((r) => r._id);
    const needed = limit - recommendations.length;

    const generalTop = await Product.find({
      _id: { $nin: [...excludeIds, ...currentIds] },
      stock: { $gt: 0 },
    })
      .sort({ isBestseller: -1, isNewProduct: -1, rating: -1, reviews: -1 })
      .limit(needed)
      .lean();

    recommendations = [...recommendations, ...generalTop];
  }

  return recommendations;
}

/**
 * 5. YOU MAY ALSO LIKE
 * Cross-category discovery matching design aesthetic and style across different rooms.
 */
export async function getYouMayAlsoLike(productId, limit = 4) {
  const cacheKey = `rec:you_may_like:${productId}:${limit}`;
  const cached = await getCachedRecs(cacheKey);
  if (cached) return cached;

  let filter = { stock: { $gt: 0 } };
  let targetId = null;

  if (productId && mongoose.Types.ObjectId.isValid(productId)) {
    targetId = new mongoose.Types.ObjectId(productId);
    const target = await Product.findById(targetId).lean();
    if (target) {
      filter = {
        _id: { $ne: targetId },
        category: { $ne: target.category }, // cross-category
        stock: { $gt: 0 },
        $or: [
          { "specs.style": target.specs?.style },
          { "specs.woodType": target.specs?.woodType },
          { isBestseller: true },
        ],
      };
    }
  }

  let products = await Product.find(filter)
    .sort({ rating: -1, reviews: -1 })
    .limit(limit)
    .lean();

  if (products.length < limit) {
    const existing = products.map((p) => p._id);
    const needed = limit - products.length;
    const fallback = await Product.find({
      _id: targetId ? { $nin: [targetId, ...existing] } : { $nin: existing },
      stock: { $gt: 0 },
    })
      .sort({ isBestseller: -1, rating: -1 })
      .limit(needed)
      .lean();

    products = [...products, ...fallback];
  }

  if (productId) {
    await setCachedRecs(cacheKey, products);
  }

  return products;
}
