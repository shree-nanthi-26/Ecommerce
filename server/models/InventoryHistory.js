import mongoose from "mongoose";

const inventoryHistorySchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
      index: true,
    },
    quantityChange: {
      type: Number,
      required: true,
    },
    previousStock: {
      type: Number,
      required: true,
      min: 0,
    },
    newStock: {
      type: Number,
      required: true,
      min: 0,
    },
    reason: {
      type: String,
      required: [true, "Adjustment reason is required"],
      enum: [
        "Restock",
        "Stock Correction",
        "Damaged / Defect",
        "Customer Return",
        "Physical Inventory Audit",
        "Order Fulfillment",
        "Order Cancellation",
        "Other",
      ],
      default: "Stock Correction",
    },
    admin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    adminName: {
      type: String,
      default: "System",
    },
    notes: {
      type: String,
      default: "",
      trim: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

inventoryHistorySchema.index({ product: 1, timestamp: -1 });

const InventoryHistory = mongoose.model("InventoryHistory", inventoryHistorySchema);

export default InventoryHistory;
