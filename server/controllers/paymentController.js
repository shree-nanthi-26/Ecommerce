import crypto from "crypto";
import razorpay from "../config/razorpay.js";

export async function createRazorpayOrder(req, res, next) {
  try {
    const { amount } = req.body;
    if (!amount || amount <= 0) {
      res.status(400);
      throw new Error("Invalid amount for payment");
    }

    if (!razorpay) {
      res.status(500);
      throw new Error("Razorpay is not configured on server");
    }

    const order = await razorpay.orders.create({
      amount: Math.round(amount * 100),
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
