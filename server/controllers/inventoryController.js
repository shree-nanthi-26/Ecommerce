import mongoose from "mongoose";
import Product from "../models/Product.js";
import InventoryHistory from "../models/InventoryHistory.js";
import { notifyWishlistRestock } from "../services/notificationService.js";

function calculateInventoryStatus(stock, threshold = 5) {
  const currentStock = Number(stock) || 0;
  const lowThreshold = Number(threshold) || 5;

  if (currentStock === 0) return "Out of Stock";
  if (currentStock <= Math.max(1, Math.floor(lowThreshold / 2))) return "Critical";
  if (currentStock <= lowThreshold) return "Low Stock";
  return "Healthy";
}

/**
 * @desc    Get all inventory items with computed statuses & stats
 * @route   GET /api/admin/inventory
 * @access  Private/Admin
 */
export async function getInventory(req, res, next) {
  try {
    const { status, category, search, page = 1, limit = 50 } = req.query;

    const query = {};

    if (category && category !== "All") {
      query.category = category;
    }

    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), "i");
      query.$or = [{ name: searchRegex }, { sku: searchRegex }, { category: searchRegex }];
    }

    const allProducts = await Product.find(query)
      .select("name sku category price stock lowStockThreshold images updatedAt")
      .sort({ stock: 1, updatedAt: -1 });

    // Compute inventory items with status
    const mapped = allProducts.map((p) => {
      const computedStatus = calculateInventoryStatus(p.stock, p.lowStockThreshold);
      return {
        _id: p._id,
        name: p.name,
        sku: p.sku || `FUR-${p._id.toString().slice(-6).toUpperCase()}`,
        category: p.category,
        price: p.price,
        stock: p.stock,
        lowStockThreshold: p.lowStockThreshold || 5,
        status: computedStatus,
        images: p.images,
        updatedAt: p.updatedAt,
      };
    });

    // Calculate overall inventory summary counts
    let totalCount = mapped.length;
    let healthyCount = 0;
    let lowStockCount = 0;
    let criticalCount = 0;
    let outOfStockCount = 0;

    mapped.forEach((item) => {
      if (item.status === "Healthy") healthyCount++;
      else if (item.status === "Low Stock") lowStockCount++;
      else if (item.status === "Critical") criticalCount++;
      else if (item.status === "Out of Stock") outOfStockCount++;
    });

    // Apply status filter if requested
    let filtered = mapped;
    if (status && status !== "All") {
      filtered = mapped.filter((item) => item.status.toLowerCase() === status.toLowerCase());
    }

    const startIndex = (Number(page) - 1) * Number(limit);
    const paginated = filtered.slice(startIndex, startIndex + Number(limit));

    res.status(200).json({
      success: true,
      data: paginated,
      total: filtered.length,
      summary: {
        totalProducts: totalCount,
        healthyCount,
        lowStockCount,
        criticalCount,
        outOfStockCount,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * @desc    Adjust product stock with audit logging
 * @route   POST /api/admin/inventory/adjust
 * @access  Private/Admin
 */
export async function adjustStock(req, res, next) {
  try {
    const { productId, type = "set", value, reason, notes } = req.body;

    if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
      res.status(400);
      throw new Error("Valid Product ID is required");
    }

    if (value === undefined || value === null || isNaN(value)) {
      res.status(400);
      throw new Error("Valid numerical adjustment value is required");
    }

    const parsedValue = Number(value);

    const product = await Product.findById(productId);
    if (!product) {
      res.status(404);
      throw new Error("Product not found");
    }

    const previousStock = product.stock || 0;
    let newStock = previousStock;
    let quantityChange = 0;

    if (type === "set") {
      if (parsedValue < 0) {
        res.status(400);
        throw new Error("Stock cannot be negative");
      }
      newStock = parsedValue;
      quantityChange = newStock - previousStock;
    } else if (type === "add") {
      if (parsedValue <= 0) {
        res.status(400);
        throw new Error("Add quantity must be greater than 0");
      }
      newStock = previousStock + parsedValue;
      quantityChange = parsedValue;
    } else if (type === "subtract") {
      if (parsedValue <= 0) {
        res.status(400);
        throw new Error("Subtract quantity must be greater than 0");
      }
      if (previousStock - parsedValue < 0) {
        res.status(400);
        throw new Error(
          `Cannot subtract ${parsedValue} units. Current stock is only ${previousStock} units.`
        );
      }
      newStock = previousStock - parsedValue;
      quantityChange = -parsedValue;
    } else {
      res.status(400);
      throw new Error('Invalid adjustment type. Must be "set", "add", or "subtract".');
    }

    if (!reason) {
      res.status(400);
      throw new Error("Please specify a reason for this inventory adjustment");
    }

    // Update product stock atomically
    product.stock = newStock;
    await product.save();

    // Create Inventory History log
    const historyEntry = await InventoryHistory.create({
      product: product._id,
      quantityChange,
      previousStock,
      newStock,
      reason,
      admin: req.user?._id || null,
      adminName: req.user?.name || "Admin",
      notes: notes ? notes.trim() : "",
      timestamp: new Date(),
    });

    // Notify consented wishlist users if restocked from 0
    if (previousStock === 0 && newStock > 0) {
      notifyWishlistRestock(product, previousStock, newStock).catch(() => {});
    }

    const computedStatus = calculateInventoryStatus(product.stock, product.lowStockThreshold);

    res.status(200).json({
      success: true,
      message: `Stock updated to ${newStock} units (${quantityChange >= 0 ? `+${quantityChange}` : quantityChange})`,
      data: {
        product: {
          _id: product._id,
          name: product.name,
          sku: product.sku || `FUR-${product._id.toString().slice(-6).toUpperCase()}`,
          stock: product.stock,
          lowStockThreshold: product.lowStockThreshold,
          status: computedStatus,
        },
        history: historyEntry,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * @desc    Get inventory audit history logs
 * @route   GET /api/admin/inventory/history
 * @access  Private/Admin
 */
export async function getInventoryHistory(req, res, next) {
  try {
    const { productId, page = 1, limit = 50 } = req.query;
    const filter = {};

    if (productId && mongoose.Types.ObjectId.isValid(productId)) {
      filter.product = productId;
    }

    const history = await InventoryHistory.find(filter)
      .populate("product", "name sku category images price")
      .populate("admin", "name email")
      .sort({ timestamp: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));

    const total = await InventoryHistory.countDocuments(filter);

    res.status(200).json({
      success: true,
      total,
      data: history,
    });
  } catch (error) {
    next(error);
  }
}
