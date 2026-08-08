import Coupon from "../models/Coupon.js";

/**
 * POST /api/coupons/validate
 * Body: { code, itemsTotal }
 */
export async function validateCoupon(req, res, next) {
  try {
    const { code, itemsTotal } = req.body;

    if (!code || itemsTotal === undefined || itemsTotal === null) {
      res.status(400);
      throw new Error("Coupon code and items total are required");
    }

    const cleanCode = String(code).trim().toUpperCase();
    const coupon = await Coupon.findOne({ code: cleanCode });

    if (!coupon) {
      res.status(404);
      throw new Error("Invalid coupon code");
    }

    if (!coupon.isActive) {
      res.status(400);
      throw new Error("This coupon is no longer active");
    }

    if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
      res.status(400);
      throw new Error("This coupon has expired");
    }

    if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses) {
      res.status(400);
      throw new Error("This coupon has reached its maximum usage limit");
    }

    const subtotal = Number(itemsTotal);
    if (subtotal < coupon.minOrderValue) {
      res.status(400);
      throw new Error(
        `Minimum order value of ₹${coupon.minOrderValue} required for this coupon`
      );
    }

    // Calculate discount amount
    let discountAmount = 0;
    if (coupon.discountType === "percentage") {
      discountAmount = Math.round((subtotal * coupon.discountValue) / 100);
      if (coupon.maxDiscountAmount && discountAmount > coupon.maxDiscountAmount) {
        discountAmount = coupon.maxDiscountAmount;
      }
    } else if (coupon.discountType === "flat") {
      discountAmount = Math.min(coupon.discountValue, subtotal);
    }

    res.json({
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      discountAmount,
      minOrderValue: coupon.minOrderValue,
      maxDiscountAmount: coupon.maxDiscountAmount,
      description: coupon.description,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/coupons/public
 * Returns active, non-expired public coupons for display on Deals page
 */
export async function getPublicCoupons(req, res, next) {
  try {
    const now = new Date();
    const coupons = await Coupon.find({
      isActive: true,
      isPublic: true,
      $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }],
    }).select("code discountType discountValue minOrderValue maxDiscountAmount description expiresAt");

    res.json(coupons);
  } catch (error) {
    next(error);
  }
}
