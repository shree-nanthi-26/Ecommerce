import Product from "../models/Product.js";
import redis from "../config/redis.js";
import cloudinary from "../config/cloudinary.js";
import { logAudit } from "../services/auditService.js";

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

    // Text search — case-insensitive regex on name and category
    if (q) {
      const regex = new RegExp(q, "i");
      filter.$or = [{ name: regex }, { category: regex }];
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

    const totalPages = Math.ceil(total / limit);
    res.json({ products, page, limit, total, totalPages });
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
