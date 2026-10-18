import crypto from "crypto";
import razorpay from "../config/razorpay.js";
import Cart from "../models/Cart.js";
import Product from "../models/Product.js";
import Order from "../models/Order.js";
import Coupon from "../models/Coupon.js";

export async function createRazorpayOrder(req, res, next) {
  try {
    if (!razorpay) {
      res.status(500);
      throw new Error("Razorpay is not configured on server");
    }

    // Fetch user's cart from database
    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart || !cart.items || cart.items.length === 0) {
      res.status(400);
      throw new Error("Cannot create payment order for empty cart");
    }

    let itemsTotal = 0;
    for (const item of cart.items) {
      const product = await Product.findById(item.product);
      if (!product) {
        res.status(404);
        throw new Error(`Product not found: ${item.product}`);
      }
      itemsTotal += product.price * item.quantity;
    }

    // Validate coupon and calculate discount if couponCode is provided
    const { couponCode } = req.body;
    let discountAmount = 0;

    if (couponCode && String(couponCode).trim()) {
      const cleanCode = String(couponCode).trim().toUpperCase();
      const coupon = await Coupon.findOne({ code: cleanCode });
      if (!coupon) {
        res.status(400);
        throw new Error("Invalid coupon code");
      }
      if (!coupon.isActive) {
        res.status(400);
        throw new Error("Coupon code is inactive");
      }
      if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
        res.status(400);
        throw new Error("Coupon code has expired");
      }
      if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses) {
        res.status(400);
        throw new Error("Coupon code usage limit reached");
      }
      if (itemsTotal < coupon.minOrderValue) {
        res.status(400);
        throw new Error(
          `Minimum order subtotal of ₹${coupon.minOrderValue} required for coupon ${coupon.code}`
        );
      }

      if (coupon.discountType === "percentage") {
        discountAmount = Math.round((itemsTotal * coupon.discountValue) / 100);
        if (coupon.maxDiscountAmount && discountAmount > coupon.maxDiscountAmount) {
          discountAmount = coupon.maxDiscountAmount;
        }
      } else if (coupon.discountType === "flat") {
        discountAmount = Math.min(coupon.discountValue, itemsTotal);
      }
    }

    const deliveryFee = itemsTotal > 999 ? 0 : 99;
    const totalAmount = Math.max(0, itemsTotal + deliveryFee - discountAmount);

    if (totalAmount <= 0) {
      res.status(400);
      throw new Error("Invalid total amount for payment");
    }

    const order = await razorpay.orders.create({
      amount: Math.round(totalAmount * 100),
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
    });

    res.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    next(error);
  }
}

export async function verifyPayment(req, res, next) {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    if (
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !razorpay_signature ||
      typeof razorpay_signature !== "string" ||
      typeof razorpay_order_id !== "string" ||
      typeof razorpay_payment_id !== "string"
    ) {
      res.status(400);
      throw new Error("Missing or invalid Razorpay payment fields");
    }

    const secret = process.env.RAZORPAY_KEY_SECRET || (process.env.NODE_ENV === "test" ? "mock_secret" : null);
    if (!secret) {
      res.status(500);
      throw new Error("Razorpay secret not configured on server");
    }

    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");
    const expectedBuf = Buffer.from(expectedSignature, "utf-8");
    const sigBuf = Buffer.from(razorpay_signature, "utf-8");
    if (expectedBuf.length !== sigBuf.length || !crypto.timingSafeEqual(expectedBuf, sigBuf)) {
      res.status(400).json({ success: false, message: "Payment verification failed" });
      return;
    }

    res.json({ success: true, message: "Payment verified successfully" });
  } catch (error) {
    next(error);
  }
}

export async function handleRazorpayWebhook(req, res, next) {
  try {
    const signature = req.headers["x-razorpay-signature"];
    if (!signature || typeof signature !== "string") {
      return res.status(400).json({ status: "failed", message: "Missing or invalid Razorpay webhook signature" });
    }

    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!secret) {
      console.warn("RAZORPAY_WEBHOOK_SECRET is not configured");
      return res.status(500).json({ status: "failed", message: "Webhook secret not configured on server" });
    }

    if (!req.rawBody || req.rawBody.length === 0) {
      return res.status(400).json({ status: "failed", message: "Missing raw request body for webhook verification" });
    }

    // Verify signature using the exact raw body
    const shasum = crypto.createHmac("sha256", secret);
    shasum.update(req.rawBody);
    const digest = shasum.digest("hex");

    const digestBuf = Buffer.from(digest, "utf-8");
    const webhookSigBuf = Buffer.from(signature, "utf-8");
    if (digestBuf.length !== webhookSigBuf.length || !crypto.timingSafeEqual(digestBuf, webhookSigBuf)) {
      return res.status(400).json({ status: "failed", message: "Invalid signature" });
    }

    // Signature verified!
    const { event, payload } = req.body;

    if (event === "payment.captured" || event === "order.paid") {
      const paymentEntity = payload.payment.entity;
      const razorpayOrderId = paymentEntity.order_id;
      const razorpayPaymentId = paymentEntity.id;

      if (razorpayOrderId) {
        const order = await Order.findOne({ razorpayOrderId });
        if (order) {
          if (!order.isPaid) {
            order.isPaid = true;
            order.paidAt = new Date();
            order.razorpayPaymentId = razorpayPaymentId;
            await order.save();
            console.log(`Order ${order._id} marked as paid via webhook.`);
          }
        } else {
          console.warn(`Order with razorpayOrderId ${razorpayOrderId} not found in webhook.`);
        }
      }
    }

    res.status(200).json({ status: "ok" });
  } catch (error) {
    next(error);
  }
}
