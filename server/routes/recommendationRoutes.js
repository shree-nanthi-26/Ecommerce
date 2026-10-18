import express from "express";
import {
  getFrequentlyBoughtTogetherHandler,
  getCustomersAlsoBoughtHandler,
  getSimilarProductsHandler,
  getYouMayAlsoLikeHandler,
  getPersonalizedRecommendationsHandler,
} from "../controllers/recommendationController.js";
import { optionalProtect } from "../middleware/authMiddleware.js";

const router = express.Router();

// 1. Frequently Bought Together (target product + complementary bundle)
router.get("/product/:productId/frequently-bought-together", getFrequentlyBoughtTogetherHandler);

// 2. Customers Also Bought
router.get("/product/:productId/customers-also-bought", getCustomersAlsoBoughtHandler);

// 3. Similar Products (matching category, material, style, and price)
router.get("/product/:productId/similar", getSimilarProductsHandler);

// 4. You May Also Like (cross-category matching design style)
router.get("/you-may-also-like", getYouMayAlsoLikeHandler);
router.get("/product/:productId/you-may-also-like", getYouMayAlsoLikeHandler);

// 5. Recommended For You (personalized based on orders, wishlist, cart, and recent history)
router.get("/for-you", optionalProtect, getPersonalizedRecommendationsHandler);

export default router;
