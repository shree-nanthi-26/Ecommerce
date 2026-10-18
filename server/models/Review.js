import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    rating: {
      type: Number,
      required: [true, "Please provide a rating between 1 and 5"],
      min: 1,
      max: 5,
    },
    title: {
      type: String,
      required: [true, "Please provide a review title"],
      trim: true,
      maxlength: [120, "Title cannot exceed 120 characters"],
    },
    comment: {
      type: String,
      required: [true, "Please provide a review comment"],
      trim: true,
      maxlength: [2000, "Review comment cannot exceed 2000 characters"],
    },
    images: {
      type: [
        {
          url: { type: String, required: true },
          publicId: { type: String, default: "" },
        },
      ],
      default: [],
    },
    verifiedPurchase: {
      type: Boolean,
      default: false,
    },
    helpfulCount: {
      type: Number,
      default: 0,
    },
    helpfulUsers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Prevent user from submitting multiple reviews for the same product
reviewSchema.index({ product: 1, user: 1 }, { unique: true });
reviewSchema.index({ product: 1, createdAt: -1 });
reviewSchema.index({ product: 1, rating: -1 });

const Review = mongoose.model("Review", reviewSchema);
export default Review;
