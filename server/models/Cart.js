import mongoose from "mongoose";

const cartItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      default: 1,
    },
    price: {
      type: Number,
      required: true,
    },
  },
  { _id: false }
);

const cartSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    items: [cartItemSchema],
    // Abandoned cart tracking fields
    lastActivityAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    reminderCount: {
      type: Number,
      default: 0,
    },
    lastReminderSentAt: {
      type: Date,
      default: null,
    },
    isAbandoned: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for abandoned cart detection and user queries
cartSchema.index({ lastActivityAt: 1, reminderCount: 1 });
cartSchema.index({ isAbandoned: 1, lastActivityAt: 1 });

const Cart = mongoose.model("Cart", cartSchema);
export default Cart;
