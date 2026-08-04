import crypto from "crypto";
import Order from "../models/Order.js";
import Product from "../models/Product.js";
import Cart from "../models/Cart.js";
import razorpay from "../config/razorpay.js";

export async function createOrder(req, res, next) {
  try {
    const {
      items,
      shippingAddress,
      paymentMethod = "COD",
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
    } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      res.status(400);
      throw new Error("Order must include at least one item");
    }

    if (paymentMethod === "ONLINE") {
      if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
        res.status(400);
        throw new Error("Online payment requires Razorpay payment details");
      }

      const expectedSignature = crypto
        .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
        .update(`${razorpayOrderId}|${razorpayPaymentId}`)
        .digest("hex");

      if (expectedSignature !== razorpaySignature) {
        res.status(400);
        throw new Error("Invalid Razorpay payment signature");
      }
    }

    const orderItems = [];
    let itemsTotal = 0;

    for (const item of items) {
      if (!item.product || !item.quantity) {
        res.status(400);
        throw new Error("Each order item must include product and quantity");
      }

      const product = await Product.findById(item.product);
      if (!product) {
        res.status(404);
        throw new Error(`Product not found: ${item.product}`);
      }

      const quantity = Number(item.quantity);
      const price = product.price;
      const lineTotal = price * quantity;
      itemsTotal += lineTotal;

      orderItems.push({
        product: product._id,
        name: product.name,
        price,
        quantity,
      });
    }

    const deliveryFee = itemsTotal > 999 ? 0 : 99;
    const totalAmount = itemsTotal + deliveryFee;

    // Verify online payment amount matches server recalculated totalAmount
    if (paymentMethod === "ONLINE" && razorpay) {
      const rzpOrder = await razorpay.orders.fetch(razorpayOrderId);
      const expectedPaise = Math.round(totalAmount * 100);
      if (!rzpOrder || rzpOrder.amount !== expectedPaise) {
        res.status(400);
        throw new Error(
          `Payment amount mismatch: Razorpay order amount (${rzpOrder?.amount ? rzpOrder.amount / 100 : 0}) does not match order total (${totalAmount})`
        );
      }
    }

    const order = await Order.create({
      user: req.user._id,
      items: orderItems,
      shippingAddress,
      paymentMethod,
      itemsTotal,
      deliveryFee,
      totalAmount,
      isPaid: paymentMethod === "ONLINE",
      paidAt: paymentMethod === "ONLINE" ? Date.now() : undefined,
      razorpayOrderId: paymentMethod === "ONLINE" ? razorpayOrderId : undefined,
      razorpayPaymentId: paymentMethod === "ONLINE" ? razorpayPaymentId : undefined,
    });

    await Cart.findOneAndUpdate(
      { user: req.user._id },
      { items: [] },
      { new: true }
    );

    res.status(201).json(order);
  } catch (error) {
    next(error);
  }
}

export async function getMyOrders(req, res, next) {
  try {
    const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    next(error);
  }
}

export async function getOrderById(req, res, next) {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      res.status(404);
      throw new Error("Order not found");
    }

    if (
      order.user.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      res.status(403);
      throw new Error("You are not authorized to view this order");
    }

    res.json(order);
  } catch (error) {
    next(error);
  }
}
