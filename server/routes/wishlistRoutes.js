import express from "express";
import {
  getWishlist,
  syncWishlist,
  addProduct,
  removeProduct,
  clearWishlist,
} from "../controllers/wishlistController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect);
router.get("/", getWishlist);
router.post("/sync", syncWishlist);
router.post("/products", addProduct);
router.delete("/products/:productId", removeProduct);
router.delete("/", clearWishlist);

export default router;
