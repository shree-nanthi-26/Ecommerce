import Product from "../models/Product.js";
import redis from "../config/redis.js";
import cloudinary from "../config/cloudinary.js";
import { logAudit } from "../services/auditService.js";
import { checkDeliveryAvailability } from "../services/deliveryService.js";

const PRODUCT_CACHE_TTL = 300; // 5 minutes

export async function getAllProducts(req, res, next) {
  try {
    const {
      category, minPrice, maxPrice, sort,
      brand, material, color, roomType, seatingCapacity, style, woodType,
      tvSizeCompatibility,
      minRating, badge, q,
    } = req.query;
    const filter = {};

    if (category) {
      filter.category = category;
    }

    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    // Furniture spec filters
    if (brand) filter.brand = brand;
    if (material) filter["specs.material"] = material;
    if (color) filter["specs.color"] = color;
    if (roomType) filter["specs.roomType"] = roomType;
    if (seatingCapacity) filter["specs.seatingCapacity"] = seatingCapacity;
    if (style) filter["specs.style"] = style;
    if (woodType) filter["specs.woodType"] = woodType;
    if (tvSizeCompatibility) filter["specs.tvSizeCompatibility"] = tvSizeCompatibility;
    if (minRating) filter.rating = { $gte: Number(minRating) };
    if (badge) filter.badge = badge;

    // Text search — matches name, category, brand, attributes, and description
    if (q && q.trim()) {
      const cleanQ = q.trim();
      const regex = new RegExp(cleanQ, "i");
      filter.$or = [
        { name: regex },
        { category: regex },
        { brand: regex },
        { description: regex },
        { "specs.material": regex },
        { "specs.color": regex },
        { "specs.roomType": regex },
        { "specs.style": regex },
        { "specs.woodType": regex },
      ];
    }

    // Pagination
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit, 10) || 12));
    const skip = (page - 1) * limit;

    let sortOption = {};
    if (sort) {
      switch (sort) {
        case "price_asc":
          sortOption = { price: 1 };
          break;
        case "price_desc":
          sortOption = { price: -1 };
          break;
        case "rating":
          sortOption = { rating: -1 };
          break;
        case "newest":
          sortOption = { createdAt: -1 };
          break;
        default:
          break;
      }
    }

    const [products, total] = await Promise.all([
      Product.find(filter).sort(sortOption).skip(skip).limit(limit),
      Product.countDocuments(filter),
    ]);

    // If zero results for search query, fetch top-rated product recommendations
    let recommendations = [];
    if (total === 0 && q) {
      recommendations = await Product.find({})
        .select("name price oldPrice category brand images rating stock badge")
        .sort({ rating: -1, reviews: -1 })
        .limit(4)
        .lean();
    }

    const totalPages = Math.ceil(total / limit);
    res.json({ products, page, limit, total, totalPages, recommendations });
  } catch (error) {
    next(error);
  }
}

export async function getProductById(req, res, next) {
  try {
    const productId = req.params.id;
    const cacheKey = `product:${productId}`;

    // Try Redis cache first
    const cached = await redis.get(cacheKey);
    if (cached) {
      res.set("X-Cache", "HIT");
      return res.json(JSON.parse(cached));
    }

    // Cache miss — fetch from MongoDB
    const product = await Product.findById(productId);

    if (!product) {
      const err = new Error("Product not found");
      err.statusCode = 404;
      throw err;
    }

    // Store in Redis with TTL
    await redis.setex(cacheKey, PRODUCT_CACHE_TTL, JSON.stringify(product));

    res.set("X-Cache", "MISS");
    res.json(product);
  } catch (error) {
    next(error);
  }
}

export async function createProduct(req, res, next) {
  try {
    const newProduct = new Product(req.body);
    const createdProduct = await newProduct.save();

    await logAudit(req, {
      action: "CREATE_PRODUCT",
      target: { type: "Product", id: createdProduct._id.toString() },
      oldValue: null,
      newValue: createdProduct
    });

    res.status(201).json(createdProduct);
  } catch (error) {
    next(error);
  }
}

export async function updateProduct(req, res, next) {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      res.status(404);
      throw new Error("Product not found");
    }

    const oldProductData = JSON.parse(JSON.stringify(product));
    const updates = req.body;
    Object.keys(updates).forEach((key) => {
      product[key] = updates[key];
    });

    const updatedProduct = await product.save();

    // Invalidate Redis cache
    await redis.del(`product:${product._id}`);

    await logAudit(req, {
      action: "UPDATE_PRODUCT",
      target: { type: "Product", id: product._id.toString() },
      oldValue: oldProductData,
      newValue: updatedProduct
    });

    res.json(updatedProduct);
  } catch (error) {
    next(error);
  }
}

export async function deleteProduct(req, res, next) {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      res.status(404);
      throw new Error("Product not found");
    }

    const oldProductData = JSON.parse(JSON.stringify(product));

    if (product.images && product.images.length > 0) {
      for (const image of product.images) {
        if (image.publicId) {
          await cloudinary.uploader.destroy(image.publicId);
        }
      }
    }

    await product.deleteOne();

    // Invalidate Redis cache
    await redis.del(`product:${product._id}`);

    await logAudit(req, {
      action: "DELETE_PRODUCT",
      target: { type: "Product", id: product._id.toString() },
      oldValue: oldProductData,
      newValue: null
    });

    res.json({ message: "Product deleted" });
  } catch (error) {
    next(error);
  }
}

/**
 * @desc    Check delivery availability and estimates for a product by pincode
 * @route   GET /api/products/:id/delivery-check?pincode=560001
 * @access  Public
 */
export async function checkProductDelivery(req, res, next) {
  try {
    const { id } = req.params;
    const { pincode } = req.query;

    if (!pincode) {
      res.status(400);
      throw new Error("Pincode query parameter is required");
    }

    let productPrice = 0;
    if (id && id !== "general") {
      const product = await Product.findById(id).select("price name stock");
      if (product) {
        productPrice = product.price || 0;
      }
    }

    const deliveryInfo = checkDeliveryAvailability(pincode, productPrice);
    if (!deliveryInfo.success) {
      return res.status(400).json(deliveryInfo);
    }

    res.status(200).json(deliveryInfo);
  } catch (error) {
    next(error);
  }
}

/**
 * @desc    Get live search suggestions for products, categories, brands, popular searches & recommendations
 * @route   GET /api/products/search/suggestions?q=...
 * @access  Public
 */
export async function getSearchSuggestions(req, res, next) {
  try {
    const rawQ = req.query.q || "";
    const cleanQ = rawQ.trim();

    const POPULAR_SEARCHES = [
      "Modern Sofa",
      "Dining Table",
      "King Bed",
      "Ergonomic Chair",
      "Coffee Table",
      "Solid Wood",
      "Velvet Armchair",
      "Bookshelf",
    ];

    // If query is empty, return popular searches, categories & brands
    if (!cleanQ) {
      const cacheKey = "search:suggest:empty";
      try {
        const cached = await redis.get(cacheKey);
        if (cached) return res.json(JSON.parse(cached));
      } catch (cacheErr) {
        // Cache read failure is non-fatal
      }

      const [categories, brands] = await Promise.all([
        Product.distinct("category"),
        Product.distinct("brand"),
      ]);

      const result = {
        query: "",
        products: [],
        categories: (categories || []).filter(Boolean).slice(0, 6),
        brands: (brands || []).filter(Boolean).slice(0, 6),
        popular: POPULAR_SEARCHES,
        recommendations: [],
      };

      try {
        await redis.set(cacheKey, JSON.stringify(result), "EX", 300);
      } catch (e) {}

      return res.json(result);
    }

    // Try Redis cache for specific query
    const cacheKey = `search:suggest:${cleanQ.toLowerCase()}`;
    try {
      const cached = await redis.get(cacheKey);
      if (cached) return res.json(JSON.parse(cached));
    } catch (e) {}

    const regex = new RegExp(cleanQ, "i");

    // Search across products, categories, brands, and spec attributes
    const [matchingProducts, categories, brands] = await Promise.all([
      Product.find({
        $or: [
          { name: regex },
          { category: regex },
          { brand: regex },
          { "specs.material": regex },
          { "specs.roomType": regex },
          { "specs.style": regex },
          { "specs.color": regex },
        ],
      })
        .select("name category brand price oldPrice images rating badge stock specs")
        .limit(6)
        .lean(),
      Product.distinct("category", { category: regex }),
      Product.distinct("brand", { brand: regex }),
    ]);

    // If no results, fetch top-rated recommendations
    let recommendations = [];
    if (matchingProducts.length === 0 && categories.length === 0 && brands.length === 0) {
      recommendations = await Product.find({})
        .select("name category brand price oldPrice images rating badge stock")
        .sort({ rating: -1, reviews: -1 })
        .limit(4)
        .lean();
    }

    const result = {
      query: cleanQ,
      products: matchingProducts.map((p) => ({
        _id: p._id,
        name: p.name,
        category: p.category,
        brand: p.brand,
        price: p.price,
        oldPrice: p.oldPrice,
        image: p.images && p.images[0] ? p.images[0].url : null,
        rating: p.rating,
        badge: p.badge,
        specs: p.specs,
      })),
      categories: (categories || []).filter(Boolean).slice(0, 5),
      brands: (brands || []).filter(Boolean).slice(0, 5),
      popular: POPULAR_SEARCHES,
      recommendations,
    };

    try {
      await redis.set(cacheKey, JSON.stringify(result), "EX", 60);
    } catch (e) {}

    res.json(result);
  } catch (error) {
    next(error);
  }
}


