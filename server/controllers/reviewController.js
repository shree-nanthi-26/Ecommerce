import mongoose from "mongoose";
import Review from "../models/Review.js";
import Product from "../models/Product.js";
import Order from "../models/Order.js";
import redis from "../config/redis.js";

/**
 * Safely recalculates product average rating and review count from Review collection.
 */
async function updateProductRatingStats(productId) {
  try {
    const stats = await Review.aggregate([
      { $match: { product: new mongoose.Types.ObjectId(productId) } },
      {
        $group: {
          _id: "$product",
          avgRating: { $avg: "$rating" },
          totalReviews: { $sum: 1 },
        },
      },
    ]);

    if (stats.length > 0) {
      const avgRating = Number(stats[0].avgRating.toFixed(1));
      const totalReviews = stats[0].totalReviews;

      await Product.findByIdAndUpdate(productId, {
        rating: avgRating,
        reviews: totalReviews,
      });
    }

    // Invalidate Redis product cache
    try {
      await redis.del(`product:${productId}`);
    } catch {
      // Ignore redis cache clearing error in dev
    }
  } catch (error) {
    console.error("Error updating product rating statistics:", error.message);
  }
}

/**
 * @desc    Get all reviews for a product with pagination, filters and rating distribution breakdown
 * @route   GET /api/reviews/product/:productId
 * @access  Public
 */
export async function getProductReviews(req, res, next) {
  try {
    const { productId } = req.params;
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.max(1, Math.min(50, parseInt(req.query.limit, 10) || 5));
    const skip = (page - 1) * limit;
    const { rating, sort, withImages } = req.query;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      res.status(400);
      throw new Error("Invalid Product ID format");
    }

    const filter = { product: productId };

    if (rating && !isNaN(Number(rating))) {
      filter.rating = Number(rating);
    }

    if (withImages === "true") {
      filter["images.0"] = { $exists: true };
    }

    let sortOption = { createdAt: -1 }; // default newest
    if (sort === "highest") {
      sortOption = { rating: -1, createdAt: -1 };
    } else if (sort === "lowest") {
      sortOption = { rating: 1, createdAt: -1 };
    } else if (sort === "helpful") {
      sortOption = { helpfulCount: -1, createdAt: -1 };
    } else if (sort === "oldest") {
      sortOption = { createdAt: 1 };
    }

    // Fetch reviews and aggregate stats simultaneously
    const [reviews, totalMatching, breakdownStats] = await Promise.all([
      Review.find(filter)
        .populate("user", "name role")
        .sort(sortOption)
        .skip(skip)
        .limit(limit)
        .lean(),
      Review.countDocuments(filter),
      Review.aggregate([
        { $match: { product: new mongoose.Types.ObjectId(productId) } },
        {
          $group: {
            _id: "$rating",
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    // Build 5-to-1 star distribution breakdown
    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    let totalAllReviews = 0;
    let sumRatings = 0;

    breakdownStats.forEach((item) => {
      if (distribution[item._id] !== undefined) {
        distribution[item._id] = item.count;
        totalAllReviews += item.count;
        sumRatings += item._id * item.count;
      }
    });

    const averageRating =
      totalAllReviews > 0 ? Number((sumRatings / totalAllReviews).toFixed(1)) : 0;

    const breakdownPercentage = {
      5: totalAllReviews > 0 ? Math.round((distribution[5] / totalAllReviews) * 100) : 0,
      4: totalAllReviews > 0 ? Math.round((distribution[4] / totalAllReviews) * 100) : 0,
      3: totalAllReviews > 0 ? Math.round((distribution[3] / totalAllReviews) * 100) : 0,
      2: totalAllReviews > 0 ? Math.round((distribution[2] / totalAllReviews) * 100) : 0,
      1: totalAllReviews > 0 ? Math.round((distribution[1] / totalAllReviews) * 100) : 0,
    };

    // Attach current user helpful status if authenticated
    const currentUserId = req.user?._id?.toString();
    const formattedReviews = reviews.map((r) => ({
      ...r,
      isHelpful: currentUserId
        ? (r.helpfulUsers || []).some((uId) => uId.toString() === currentUserId)
        : false,
      helpfulUsersCount: r.helpfulCount || (r.helpfulUsers || []).length,
    }));

    res.json({
      reviews: formattedReviews,
      page,
      limit,
      total: totalMatching,
      totalPages: Math.ceil(totalMatching / limit),
      stats: {
        totalReviews: totalAllReviews,
        averageRating,
        distribution,
        breakdownPercentage,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * @desc    Check if current user can review this product and if they purchased it
 * @route   GET /api/reviews/product/:productId/eligibility
 * @access  Private
 */
export async function getReviewEligibility(req, res, next) {
  try {
    const { productId } = req.params;
    const userId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      res.status(400);
      throw new Error("Invalid Product ID format");
    }

    const [existingReview, purchaseOrder] = await Promise.all([
      Review.findOne({ product: productId, user: userId }).lean(),
      Order.findOne({
        user: userId,
        "items.product": productId,
        status: { $in: ["Placed", "Confirmed", "Shipped", "Delivered"] },
      }).lean(),
    ]);

    const isVerifiedPurchase = Boolean(purchaseOrder);

    res.json({
      canReview: !existingReview,
      hasReviewed: Boolean(existingReview),
      existingReview,
      isVerifiedPurchase,
      orderId: purchaseOrder?._id || null,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * @desc    Create a new product review
 * @route   POST /api/reviews/product/:productId
 * @access  Private
 */
export async function createReview(req, res, next) {
  try {
    const { productId } = req.params;
    const { rating, title, comment, images } = req.body;
    const userId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      res.status(400);
      throw new Error("Invalid Product ID format");
    }

    const product = await Product.findById(productId);
    if (!product) {
      res.status(404);
      throw new Error("Product not found");
    }

    // Validate review content
    const numRating = Number(rating);
    if (!numRating || numRating < 1 || numRating > 5) {
      res.status(400);
      throw new Error("Please provide a valid rating between 1 and 5 stars");
    }

    if (!title || !title.trim()) {
      res.status(400);
      throw new Error("Please provide a review headline / title");
    }

    if (!comment || !comment.trim()) {
      res.status(400);
      throw new Error("Please write your review feedback");
    }

    // Check if user already reviewed this product
    const alreadyReviewed = await Review.findOne({ product: productId, user: userId });
    if (alreadyReviewed) {
      res.status(400);
      throw new Error("You have already reviewed this product. You can edit your existing review.");
    }

    // Determine verified purchase from Order history (server-side security check)
    const verifiedOrder = await Order.findOne({
      user: userId,
      "items.product": productId,
      status: { $in: ["Placed", "Confirmed", "Shipped", "Delivered"] },
    });

    const isVerifiedPurchase = Boolean(verifiedOrder);

    // Sanitize image payloads
    const sanitizedImages = Array.isArray(images)
      ? images
          .filter((img) => img && (typeof img === "string" || img.url))
          .map((img) =>
            typeof img === "string" ? { url: img, publicId: "" } : { url: img.url, publicId: img.publicId || "" }
          )
      : [];

    const newReview = await Review.create({
      user: userId,
      product: productId,
      rating: numRating,
      title: title.trim(),
      comment: comment.trim(),
      images: sanitizedImages,
      verifiedPurchase: isVerifiedPurchase,
    });

    // Recalculate average rating & counts safely
    await updateProductRatingStats(productId);

    const populatedReview = await Review.findById(newReview._id)
      .populate("user", "name role")
      .lean();

    res.status(201).json({
      message: "Review submitted successfully",
      review: {
        ...populatedReview,
        isHelpful: false,
        helpfulUsersCount: 0,
      },
    });
  } catch (error) {
    if (error.code === 11000) {
      res.status(400);
      return next(new Error("You have already submitted a review for this product."));
    }
    next(error);
  }
}

/**
 * @desc    Update an existing review
 * @route   PUT /api/reviews/:id
 * @access  Private
 */
export async function updateReview(req, res, next) {
  try {
    const { id } = req.params;
    const { rating, title, comment, images } = req.body;
    const userId = req.user._id.toString();
    const isAdmin = req.user.role === "admin";

    const review = await Review.findById(id);
    if (!review) {
      res.status(404);
      throw new Error("Review not found");
    }

    if (review.user.toString() !== userId && !isAdmin) {
      res.status(403);
      throw new Error("You are not authorized to edit this review");
    }

    if (rating !== undefined) {
      const numRating = Number(rating);
      if (!numRating || numRating < 1 || numRating > 5) {
        res.status(400);
        throw new Error("Rating must be between 1 and 5");
      }
      review.rating = numRating;
    }

    if (title !== undefined) review.title = title.trim();
    if (comment !== undefined) review.comment = comment.trim();

    if (images !== undefined) {
      review.images = Array.isArray(images)
        ? images
            .filter((img) => img && (typeof img === "string" || img.url))
            .map((img) =>
              typeof img === "string" ? { url: img, publicId: "" } : { url: img.url, publicId: img.publicId || "" }
            )
        : [];
    }

    await review.save();

    // Recalculate product rating stats
    await updateProductRatingStats(review.product);

    const updatedReview = await Review.findById(review._id)
      .populate("user", "name role")
      .lean();

    res.json({
      message: "Review updated successfully",
      review: updatedReview,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * @desc    Delete a review
 * @route   DELETE /api/reviews/:id
 * @access  Private
 */
export async function deleteReview(req, res, next) {
  try {
    const { id } = req.params;
    const userId = req.user._id.toString();
    const isAdmin = req.user.role === "admin";

    const review = await Review.findById(id);
    if (!review) {
      res.status(404);
      throw new Error("Review not found");
    }

    if (review.user.toString() !== userId && !isAdmin) {
      res.status(403);
      throw new Error("You are not authorized to delete this review");
    }

    const productId = review.product;
    await review.deleteOne();

    // Recalculate product rating stats
    await updateProductRatingStats(productId);

    res.json({ message: "Review deleted successfully" });
  } catch (error) {
    next(error);
  }
}

/**
 * @desc    Toggle helpful vote on a review
 * @route   POST /api/reviews/:id/helpful
 * @access  Private
 */
export async function toggleHelpful(req, res, next) {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const review = await Review.findById(id);
    if (!review) {
      res.status(404);
      throw new Error("Review not found");
    }

    // Prevent voting on own review
    if (review.user.toString() === userId.toString()) {
      res.status(400);
      throw new Error("You cannot mark your own review as helpful");
    }

    const userIndex = review.helpfulUsers.findIndex(
      (uId) => uId.toString() === userId.toString()
    );

    let isHelpful = false;
    if (userIndex > -1) {
      // User already marked helpful: remove vote
      review.helpfulUsers.splice(userIndex, 1);
      review.helpfulCount = Math.max(0, review.helpfulCount - 1);
      isHelpful = false;
    } else {
      // Add vote
      review.helpfulUsers.push(userId);
      review.helpfulCount = (review.helpfulCount || 0) + 1;
      isHelpful = true;
    }

    await review.save();

    res.json({
      helpfulCount: review.helpfulCount,
      isHelpful,
      message: isHelpful ? "Marked as helpful" : "Helpful mark removed",
    });
  } catch (error) {
    next(error);
  }
}
