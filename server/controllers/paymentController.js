import crypto from "crypto";
import razorpay from "../config/razorpay.js";
import Cart from "../models/Cart.js";
import Product from "../models/Product.js";
import Order from "../models/Order.js";

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

    const deliveryFee = itemsTotal > 999 ? 0 : 99;
    const totalAmount = itemsTotal + deliveryFee;

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
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      res.status(400);
      throw new Error("Missing Razorpay payment fields");
    }

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      res.status(400).json({ success: false, message: "Payment verification failed" });
      return;
    }

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
}

export async function handleRazorpayWebhook(req, res, next) {
  try {
    const signature = req.headers["x-razorpay-signature"];
    if (!signature) {
      return res.status(400).json({ status: "failed", message: "Missing Razorpay webhook signature" });
    }

    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!secret) {
      console.warn("RAZORPAY_WEBHOOK_SECRET is not configured");
      return res.status(500).json({ status: "failed", message: "Webhook secret not configured on server" });
    }

    // Verify signature using the raw body
    const shasum = crypto.createHmac("sha256", secret);
    shasum.update(req.rawBody || "");
    const digest = shasum.digest("hex");

    if (digest !== signature) {
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
