import express from "express";
import {
  getCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon,
} from "../controllers/adminCouponController.js";
import { protect, admin } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect, admin);

router.route("/")
  .get(getCoupons)
  .post(createCoupon);

router.route("/:id")
  .put(updateCoupon)
  .delete(deleteCoupon);

export default router;
