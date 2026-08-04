// server/controllers/adminProductController.js
import Product from "../models/Product.js";
import asyncHandler from "express-async-handler";

// @desc    Get all products (with optional pagination & search)
// @route   GET /api/admin/products
// @access  Private/Admin
export const getProducts = asyncHandler(async (req, res) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 20;
  const skip = (page - 1) * limit;

  const filter = {};
  // optional search by name or category
  if (req.query.search) {
    const regex = new RegExp(req.query.search, "i");
    filter.$or = [{ name: regex }, { category: regex }];
  }

  const total = await Product.countDocuments(filter);
  const products = await Product.find(filter)
    .skip(skip)
    .limit(limit)
    .sort({ createdAt: -1 });

  res.json({ page, limit, total, products });
});

// @desc    Get single product by id
// @route   GET /api/admin/products/:id
// @access  Private/Admin
export const getProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }
  res.json(product);
});

// @desc    Create a new product
// @route   POST /api/admin/products
// @access  Private/Admin
export const createProduct = asyncHandler(async (req, res) => {
  const newProduct = new Product({
    ...req.body,
    // ensure required fields have defaults if missing
    rating: req.body.rating || 0,
    reviews: req.body.reviews || 0,
    stock: req.body.stock || 0,
  });
  const saved = await newProduct.save();
  res.status(201).json(saved);
});

// @desc    Update an existing product
// @route   PUT /api/admin/products/:id
// @access  Private/Admin
export const updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }
  Object.assign(product, req.body);
  const updated = await product.save();
  res.json(updated);
});

// @desc    Delete a product
// @route   DELETE /api/admin/products/:id
// @access  Private/Admin
export const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }
  await product.remove();
  res.json({ message: "Product deleted" });
});
