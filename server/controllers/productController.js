import Product from "../models/Product.js";
import cloudinary from "../config/cloudinary.js";

export async function getAllProducts(req, res, next) {
  try {
    const {
      category, minPrice, maxPrice, sort,
      brand, ram, storage, screenSize, processor, os,
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

    // New filters
    if (brand) filter.brand = brand;
    if (ram) filter["specs.ram"] = ram;
    if (storage) filter["specs.storage"] = storage;
    if (screenSize) filter["specs.screenSize"] = screenSize;
    if (processor) filter["specs.processor"] = processor;
    if (os) filter["specs.os"] = os;
    if (minRating) filter.rating = { $gte: Number(minRating) };
    if (badge) filter.badge = badge;

    // Text search — case-insensitive regex on name and category
    if (q) {
      const regex = new RegExp(q, "i");
      filter.$or = [{ name: regex }, { category: regex }];
    }

    let query = Product.find(filter);

    if (sort) {
      switch (sort) {
        case "price_asc":
          query = query.sort({ price: 1 });
          break;
        case "price_desc":
          query = query.sort({ price: -1 });
          break;
        case "rating":
          query = query.sort({ rating: -1 });
          break;
        default:
          break;
      }
    }

    const products = await query;
    res.json(products);
  } catch (error) {
    next(error);
  }
}

export async function getProductById(req, res, next) {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      const err = new Error("Product not found");
      err.statusCode = 404;
      throw err;
    }

    res.json(product);
  } catch (error) {
    next(error);
  }
}

export async function createProduct(req, res, next) {
  try {
    const newProduct = new Product(req.body);
    const createdProduct = await newProduct.save();
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

    const updates = req.body;
    Object.keys(updates).forEach((key) => {
      product[key] = updates[key];
    });

    const updatedProduct = await product.save();
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

    if (product.images && product.images.length > 0) {
      for (const image of product.images) {
        if (image.publicId) {
          await cloudinary.uploader.destroy(image.publicId);
        }
      }
    }

    await product.deleteOne();
    res.json({ message: "Product deleted" });
  } catch (error) {
    next(error);
  }
}
