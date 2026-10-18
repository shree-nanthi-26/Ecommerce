import express from "express";
import {
  getProductReviews,
  getReviewEligibility,
  createReview,
  updateReview,
  deleteReview,
  toggleHelpful,
} from "../controllers/reviewController.js";
import { protect, optionalProtect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Public review retrieval with optional auth (for helpful vote state)
router.get("/product/:productId", optionalProtect, getProductReviews);

// Eligibility check (requires auth)
router.get("/product/:productId/eligibility", protect, getReviewEligibility);

// Submit new review (requires auth)
router.post("/product/:productId", protect, createReview);

// Update review (requires auth & ownership/admin)
router.put("/:id", protect, updateReview);

// Delete review (requires auth & ownership/admin)
router.delete("/:id", protect, deleteReview);

// Toggle helpful count (requires auth)
router.post("/:id/helpful", protect, toggleHelpful);

export default router;
