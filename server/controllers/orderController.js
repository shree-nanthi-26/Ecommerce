import crypto from "crypto";
import mongoose from "mongoose";
import Order from "../models/Order.js";
import Product from "../models/Product.js";
import Cart from "../models/Cart.js";
import Coupon from "../models/Coupon.js";
import razorpay from "../config/razorpay.js";
import { sendEmail } from "../utils/sendEmail.js";
import { orderConfirmationTemplate } from "../emailTemplates/orderConfirmationTemplate.js";

export async function createOrder(req, res, next) {
  const session = await mongoose.startSession();
  const isReplicaSet = mongoose.connection.client && 
                       mongoose.connection.client.topology && 
                       mongoose.connection.client.topology.description.type !== 'Single';

  if (isReplicaSet) {
    session.startTransaction();
  }

  try {
    const {
      items,
      shippingAddress,
      paymentMethod = "COD",
      couponCode,
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
    } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      res.status(400);
      throw new Error("Order must include at least one item");
    }

    // 1. Stock Pre-validation and Product Verification
    const orderItems = [];
    const productsToUpdate = [];
    let itemsTotal = 0;

    for (const item of items) {
      if (!item.product || !item.quantity) {
        res.status(400);
        throw new Error("Each order item must include product and quantity");
      }

      const quantity = Number(item.quantity);
      if (quantity <= 0) {
        res.status(400);
        throw new Error("Item quantity must be greater than zero");
      }

      const product = await Product.findById(item.product).session(isReplicaSet ? session : null);
      if (!product) {
        res.status(404);
        throw new Error(`Product not found: ${item.product}`);
      }

      if (product.stock < quantity) {
        res.status(400);
        throw new Error(
          product.stock === 0
            ? `"${product.name}" is currently out of stock`
            : `Insufficient stock for "${product.name}". Only ${product.stock} left in stock`
        );
      }

      const price = product.price;
      const lineTotal = price * quantity;
      itemsTotal += lineTotal;

      orderItems.push({
        product: product._id,
        name: product.name,
        price,
        quantity,
      });

      productsToUpdate.push({ product, quantity });
    }

    // 2. Server-Side Coupon Validation & Discount Calculation
    let appliedCoupon = null;
    let discountAmount = 0;

    if (couponCode && String(couponCode).trim()) {
      const cleanCode = String(couponCode).trim().toUpperCase();
      const coupon = await Coupon.findOne({ code: cleanCode }).session(isReplicaSet ? session : null);

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

      appliedCoupon = coupon;
    }

    const deliveryFee = itemsTotal > 999 ? 0 : 99;
    const netItemsSubtotal = Math.max(0, itemsTotal - discountAmount);
    const totalAmount = netItemsSubtotal + deliveryFee;

    // 3. Razorpay Signature & Amount Verification
    if (paymentMethod === "ONLINE") {
      if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
        res.status(400);
        throw new Error("ONLINE payment requires Razorpay payment details");
      }

      const expectedSignature = crypto
        .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
        .update(`${razorpayOrderId}|${razorpayPaymentId}`)
        .digest("hex");

      if (expectedSignature !== razorpaySignature) {
        res.status(400);
        throw new Error("Invalid Razorpay payment signature");
      }

      if (razorpay) {
        const rzpOrder = await razorpay.orders.fetch(razorpayOrderId);
        const expectedPaise = Math.round(totalAmount * 100);
        if (!rzpOrder || rzpOrder.amount !== expectedPaise) {
          res.status(400);
          throw new Error(
            `Payment amount mismatch: Razorpay amount (${rzpOrder?.amount ? rzpOrder.amount / 100 : 0}) does not match total (${totalAmount})`
          );
        }
      }
    }

    // 4. Atomic Stock Decrement (Prevents race conditions / overselling)
    for (const { product, quantity } of productsToUpdate) {
      const updated = await Product.findOneAndUpdate(
        { _id: product._id, stock: { $gte: quantity } },
        { $inc: { stock: -quantity } },
        { new: true, session: isReplicaSet ? session : undefined }
      );

      if (!updated) {
        throw new Error(`Item "${product.name}" went out of stock. Please adjust your cart.`);
      }
    }

    // 5. Increment Coupon Usage if applicable
    if (appliedCoupon) {
      await Coupon.findByIdAndUpdate(appliedCoupon._id, { $inc: { usedCount: 1 } }, { session: isReplicaSet ? session : undefined });
    }

    // 6. Create Order
    const orderData = {
      user: req.user._id,
      items: orderItems,
      shippingAddress,
      paymentMethod,
      itemsTotal,
      deliveryFee,
      couponCode: appliedCoupon ? appliedCoupon.code : null,
      discountAmount,
      totalAmount,
      isPaid: paymentMethod === "ONLINE",
      paidAt: paymentMethod === "ONLINE" ? Date.now() : undefined,
      razorpayOrderId: paymentMethod === "ONLINE" ? razorpayOrderId : undefined,
      razorpayPaymentId: paymentMethod === "ONLINE" ? razorpayPaymentId : undefined,
    };

    let order;
    if (isReplicaSet) {
      const [createdOrder] = await Order.create([orderData], { session });
      order = createdOrder;
    } else {
      order = await Order.create(orderData);
    }

    // Clear User Cart
    await Cart.findOneAndUpdate(
      { user: req.user._id },
      { items: [] },
      { new: true, session: isReplicaSet ? session : undefined }
    );

    if (isReplicaSet) {
      await session.commitTransaction();
    }
    session.endSession();

    // Send Confirmation Email
    try {
      if (req.user && req.user.email) {
        const html = orderConfirmationTemplate({
          _id: order._id,
          orderItems,
          totalPrice: totalAmount,
        });
        sendEmail(req.user.email, `Furniva Order Confirmation #${order._id}`, html).catch(err =>
          console.error("Order confirmation email failed:", err)
        );
      }
    } catch (emailErr) {
      console.error("Failed to trigger order confirmation email:", emailErr);
    }

    res.status(201).json(order);
  } catch (error) {
    if (isReplicaSet) {
      await session.abortTransaction();
    }
    session.endSession();
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
