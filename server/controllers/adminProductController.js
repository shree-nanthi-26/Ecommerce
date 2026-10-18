import Product from "../models/Product.js";
import redis from "../config/redis.js";
import cloudinary from "../config/cloudinary.js";
import { logAudit } from "../services/auditService.js";
import { notifyWishlistPriceDrop, notifyWishlistRestock } from "../services/notificationService.js";

// @desc    Get all products for admin with pagination, filtering & search
// @route   GET /api/admin/products
// @access  Private/Admin
export async function getProducts(req, res, next) {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit, 10) || 50));
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.search) {
      const regex = new RegExp(req.query.search, "i");
      filter.$or = [{ name: regex }, { category: regex }, { brand: regex }];
    }
    if (req.query.category) {
      filter.category = req.query.category;
    }

    const [products, total] = await Promise.all([
      Product.find(filter).skip(skip).limit(limit).sort({ createdAt: -1 }),
      Product.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(total / limit);
    res.json({ products, page, limit, total, totalPages });
  } catch (error) {
    next(error);
  }
}

// @desc    Get single product by id
// @route   GET /api/admin/products/:id
// @access  Private/Admin
export async function getProduct(req, res, next) {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      res.status(404);
      throw new Error("Product not found");
    }
    res.json(product);
  } catch (error) {
    next(error);
  }
}

// @desc    Create a new product
// @route   POST /api/admin/products
// @access  Private/Admin
export async function createProduct(req, res, next) {
  try {
    const newProduct = new Product({
      ...req.body,
      rating: req.body.rating || 0,
      reviews: req.body.reviews || 0,
      stock: req.body.stock || 0,
    });
    const saved = await newProduct.save();

    await logAudit(req, {
      action: "CREATE_PRODUCT",
      target: { type: "Product", id: saved._id.toString() },
      oldValue: null,
      newValue: saved,
    });

    res.status(201).json(saved);
  } catch (error) {
    next(error);
  }
}

// @desc    Update an existing product
// @route   PUT /api/admin/products/:id
// @access  Private/Admin
export async function updateProduct(req, res, next) {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      res.status(404);
      throw new Error("Product not found");
    }

    const oldProductData = JSON.parse(JSON.stringify(product));
    Object.assign(product, req.body);
    const updated = await product.save();

    // Invalidate Redis cache
    if (redis) {
      await redis.del(`product:${product._id}`);
    }

    await logAudit(req, {
      action: "UPDATE_PRODUCT",
      target: { type: "Product", id: product._id.toString() },
      oldValue: oldProductData,
      newValue: updated,
    });

    // Check for price drop
    if (oldProductData.price && updated.price < oldProductData.price) {
      notifyWishlistPriceDrop(updated, oldProductData.price, updated.price).catch((err) =>
        console.error("Price drop alert error:", err)
      );
    }

    // Check for restock
    if (oldProductData.stock === 0 && updated.stock > 0) {
      notifyWishlistRestock(updated, oldProductData.stock, updated.stock).catch((err) =>
        console.error("Restock alert error:", err)
      );
    }

    res.json(updated);
  } catch (error) {
    next(error);
  }
}

// @desc    Delete a product
// @route   DELETE /api/admin/products/:id
// @access  Private/Admin
export async function deleteProduct(req, res, next) {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      res.status(404);
      throw new Error("Product not found");
    }

    const oldProductData = JSON.parse(JSON.stringify(product));

    // Cleanup images from Cloudinary if applicable
    if (product.images && product.images.length > 0) {
      for (const image of product.images) {
        if (image.publicId) {
          try {
            await cloudinary.uploader.destroy(image.publicId);
          } catch (cloudErr) {
            console.error("Cloudinary image deletion error:", cloudErr);
          }
        }
      }
    }

    await product.deleteOne();

    // Invalidate Redis cache
    if (redis) {
      await redis.del(`product:${product._id}`);
    }

    await logAudit(req, {
      action: "DELETE_PRODUCT",
      target: { type: "Product", id: product._id.toString() },
      oldValue: oldProductData,
      newValue: null,
    });

    res.json({ message: "Product deleted" });
  } catch (error) {
    next(error);
  }
}
