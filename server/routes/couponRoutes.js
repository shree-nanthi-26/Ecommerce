import express from "express";
import { validateCoupon, getPublicCoupons } from "../controllers/couponController.js";

const router = express.Router();

router.post("/validate", validateCoupon);
router.get("/public", getPublicCoupons);

export default router;
