import Coupon from "../models/Coupon.js";

// @desc    Get all coupons (Admin)
// @route   GET /api/admin/coupons
// @access  Private/Admin
export async function getCoupons(req, res, next) {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 });
    res.json(coupons);
  } catch (error) {
    next(error);
  }
}

// @desc    Create a new coupon (Admin)
// @route   POST /api/admin/coupons
// @access  Private/Admin
export async function createCoupon(req, res, next) {
  try {
    const {
      code,
      discountType,
      discountValue,
      minOrderValue,
      maxDiscountAmount,
      maxUses,
      expiresAt,
      isActive,
      isPublic,
      description,
    } = req.body;

    if (!code || discountValue === undefined) {
      res.status(400);
      throw new Error("Coupon code and discount value are required");
    }

    const cleanCode = String(code).trim().toUpperCase();
    const existing = await Coupon.findOne({ code: cleanCode });
    if (existing) {
      res.status(400);
      throw new Error("Coupon code already exists");
    }

    const coupon = await Coupon.create({
      code: cleanCode,
      discountType: discountType || "percentage",
      discountValue: Number(discountValue),
      minOrderValue: minOrderValue ? Number(minOrderValue) : 0,
      maxDiscountAmount: maxDiscountAmount ? Number(maxDiscountAmount) : null,
      maxUses: maxUses ? Number(maxUses) : null,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      isActive: isActive !== undefined ? Boolean(isActive) : true,
      isPublic: isPublic !== undefined ? Boolean(isPublic) : true,
      description: description || "",
    });

    res.status(201).json(coupon);
  } catch (error) {
    next(error);
  }
}

// @desc    Update an existing coupon (Admin)
// @route   PUT /api/admin/coupons/:id
// @access  Private/Admin
export async function updateCoupon(req, res, next) {
  try {
    const coupon = await Coupon.findById(req.params.id);
    if (!coupon) {
      res.status(404);
      throw new Error("Coupon not found");
    }

    const {
      code,
      discountType,
      discountValue,
      minOrderValue,
      maxDiscountAmount,
      maxUses,
      expiresAt,
      isActive,
      isPublic,
      description,
    } = req.body;

    if (code) {
      const cleanCode = String(code).trim().toUpperCase();
      if (cleanCode !== coupon.code) {
        const existing = await Coupon.findOne({ code: cleanCode });
        if (existing) {
          res.status(400);
          throw new Error("Coupon code already exists");
        }
        coupon.code = cleanCode;
      }
    }

    if (discountType !== undefined) coupon.discountType = discountType;
    if (discountValue !== undefined) coupon.discountValue = Number(discountValue);
    if (minOrderValue !== undefined) coupon.minOrderValue = Number(minOrderValue);
    if (maxDiscountAmount !== undefined) coupon.maxDiscountAmount = maxDiscountAmount ? Number(maxDiscountAmount) : null;
    if (maxUses !== undefined) coupon.maxUses = maxUses ? Number(maxUses) : null;
    if (expiresAt !== undefined) coupon.expiresAt = expiresAt ? new Date(expiresAt) : null;
    if (isActive !== undefined) coupon.isActive = Boolean(isActive);
    if (isPublic !== undefined) coupon.isPublic = Boolean(isPublic);
    if (description !== undefined) coupon.description = description;

    const updatedCoupon = await coupon.save();
    res.json(updatedCoupon);
  } catch (error) {
    next(error);
  }
}

// @desc    Delete a coupon (Admin)
// @route   DELETE /api/admin/coupons/:id
// @access  Private/Admin
export async function deleteCoupon(req, res, next) {
  try {
    const coupon = await Coupon.findById(req.params.id);
    if (!coupon) {
      res.status(404);
      throw new Error("Coupon not found");
    }

    await coupon.deleteOne();
    res.json({ message: "Coupon deleted successfully" });
  } catch (error) {
    next(error);
  }
}
