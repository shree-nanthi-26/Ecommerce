import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    senderRole: {
      type: String,
      enum: ["customer", "admin"],
      required: true,
    },
    senderName: {
      type: String,
      required: true,
      trim: true,
    },
    senderEmail: {
      type: String,
      trim: true,
      lowercase: true,
    },
    message: {
      type: String,
      required: [true, "Message content is required"],
      trim: true,
      maxlength: [4000, "Message cannot exceed 4000 characters"],
    },
    attachments: [
      {
        url: { type: String, required: true },
        publicId: { type: String },
        name: { type: String },
      },
    ],
  },
  {
    timestamps: true,
  }
);

const ticketSchema = new mongoose.Schema(
  {
    ticketNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    subject: {
      type: String,
      required: [true, "Subject is required"],
      trim: true,
      minlength: [3, "Subject must be at least 3 characters"],
      maxlength: [200, "Subject cannot exceed 200 characters"],
    },
    category: {
      type: String,
      enum: ["Order", "Payment", "Delivery", "Product", "Return", "Other"],
      required: [true, "Category is required"],
      index: true,
    },
    priority: {
      type: String,
      enum: ["Low", "Medium", "High", "Urgent"],
      default: "Medium",
    },
    status: {
      type: String,
      enum: [
        "Open",
        "In Progress",
        "Waiting for Customer",
        "Resolved",
        "Closed",
      ],
      default: "Open",
      index: true,
    },
    orderId: {
      type: String,
      trim: true,
      default: null,
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    messages: [messageSchema],
    lastMessageAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    closedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

ticketSchema.index({ user: 1, status: 1 });
ticketSchema.index({ createdAt: -1 });

export default mongoose.model("Ticket", ticketSchema);
