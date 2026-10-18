import mongoose from "mongoose";

const returnItemSchema = new mongoose.Schema(
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

const returnStatusHistorySchema = new mongoose.Schema(
  {
    status: {
      type: String,
      required: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    comment: {
      type: String,
      default: "",
    },
    updatedBy: {
      type: String,
      default: "System",
    },
  },
  { _id: false }
);

const returnSchema = new mongoose.Schema(
  {
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    items: [returnItemSchema],
    reason: {
      type: String,
      enum: [
        "Damaged product",
        "Wrong product",
        "Product not as expected",
        "Changed mind",
        "Other",
      ],
      required: [true, "Return reason is required"],
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
      maxlength: [1000, "Description cannot exceed 1000 characters"],
    },
    images: {
      type: [
        {
          url: { type: String, required: true },
          publicId: { type: String },
        },
      ],
      default: [],
    },
    status: {
      type: String,
      enum: [
        "Requested",
        "Under Review",
        "Approved",
        "Rejected",
        "Pickup Scheduled",
        "Returned",
        "Refund Initiated",
        "Completed",
      ],
      default: "Requested",
    },
    adminNotes: {
      type: String,
      default: "",
      trim: true,
    },
    rejectionReason: {
      type: String,
      default: "",
      trim: true,
    },
    pickupDate: {
      type: Date,
      default: null,
    },
    refundAmount: {
      type: Number,
      default: 0,
    },
    refundStatus: {
      type: String,
      enum: ["Pending", "Processed", "Failed", "Not Applicable"],
      default: "Pending",
    },
    statusHistory: {
      type: [returnStatusHistorySchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
returnSchema.index({ user: 1, createdAt: -1 });
returnSchema.index({ status: 1 });

const Return = mongoose.model("Return", returnSchema);
export default Return;
