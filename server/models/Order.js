import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
    },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    items: [orderItemSchema],
    shippingAddress: {
      fullName: { type: String, required: true },
      phone: { type: String, required: true },
      addressLine1: { type: String, required: true },
      addressLine2: { type: String },
      city: { type: String, required: true },
      state: { type: String, required: true },
      pincode: { type: String, required: true },
    },
    paymentMethod: {
      type: String,
      enum: ["COD", "ONLINE"],
      default: "COD",
      required: true,
    },
    itemsTotal: {
      type: Number,
      required: true,
      default: 0,
    },
    deliveryFee: {
      type: Number,
      required: true,
      default: 0,
    },
    couponCode: {
      type: String,
      default: null,
    },
    discountAmount: {
      type: Number,
      default: 0,
    },
    totalAmount: {
      type: Number,
      required: true,
      default: 0,
    },
    status: {
      type: String,
      enum: ["Placed", "Confirmed", "Shipped", "Delivered", "Cancelled"],
      default: "Placed",
    },
    isPaid: {
      type: Boolean,
      default: false,
    },
    paidAt: {
      type: Date,
    },
    razorpayOrderId: {
      type: String,
    },
    razorpayPaymentId: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for query performance
orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ status: 1 });
orderSchema.index({ razorpayOrderId: 1 });

const Order = mongoose.model("Order", orderSchema);
export default Order;
