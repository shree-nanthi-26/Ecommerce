import crypto from "crypto";
import mongoose from "mongoose";
import Order from "../models/Order.js";
import Product from "../models/Product.js";
import Cart from "../models/Cart.js";
import Coupon from "../models/Coupon.js";
import razorpay from "../config/razorpay.js";
import { sendEmail } from "../utils/sendEmail.js";
import { orderConfirmationTemplate } from "../emailTemplates/orderConfirmationTemplate.js";
import { createInAppNotification } from "../services/notificationService.js";

/**
 * @desc    Calculate and preview order summary with server-side pricing, coupons, delivery fees, and savings
 * @route   POST /api/orders/calculate
 * @access  Private
 */
export async function calculateOrderSummary(req, res, next) {
  try {
    const { items, couponCode, deliverySpeed = "standard" } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      res.status(400);
      throw new Error("Order calculation requires at least one item");
    }

    let itemsTotal = 0;
    let originalItemsTotal = 0;
    const verifiedItems = [];

    for (const item of items) {
      if (!item.product || !item.quantity) {
        res.status(400);
        throw new Error("Each item must include product ID and quantity");
      }

      const quantity = Number(item.quantity);
      if (quantity <= 0) {
        res.status(400);
        throw new Error("Item quantity must be greater than zero");
      }

      const product = await Product.findById(item.product);
      if (!product) {
        res.status(404);
        throw new Error(`Product not found: ${item.product}`);
      }

      const price = product.price;
      const originalPrice = product.oldPrice || product.originalPrice || product.price;
      const lineTotal = price * quantity;
      const originalLineTotal = originalPrice * quantity;

      itemsTotal += lineTotal;
      originalItemsTotal += originalLineTotal;

      verifiedItems.push({
        product: product._id,
        name: product.name,
        price,
        originalPrice,
        image: product.images && product.images.length > 0 ? product.images[0] : null,
        quantity,
        lineTotal,
        inStock: product.stock >= quantity,
        availableStock: product.stock,
      });
    }

    // Server-Side Coupon Validation
    let appliedCoupon = null;
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

      appliedCoupon = {
        code: coupon.code,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        discountAmount,
      };
    }

    let deliveryFee = itemsTotal > 999 ? 0 : 99;
    if (deliverySpeed === "express") {
      deliveryFee += 199;
    }

    const netItemsSubtotal = Math.max(0, itemsTotal - discountAmount);
    const totalAmount = netItemsSubtotal + deliveryFee;
    const catalogSavings = Math.max(0, originalItemsTotal - itemsTotal);
    const totalSavings = catalogSavings + discountAmount;

    res.status(200).json({
      success: true,
      data: {
        itemsTotal,
        originalItemsTotal,
        catalogSavings,
        discountAmount,
        deliveryFee,
        totalSavings,
        totalAmount,
        appliedCoupon,
        deliverySpeed,
        taxAmount: 0,
        items: verifiedItems,
      },
    });
  } catch (error) {
    next(error);
  }
}

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
      deliverySpeed = "standard",
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
    } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      res.status(400);
      throw new Error("Order must include at least one item");
    }

    // 0. Prevent duplicate order creation (tamper / double-click protection)
    if (paymentMethod === "ONLINE" && razorpayOrderId) {
      const duplicateOrder = await Order.findOne({ razorpayOrderId }).session(isReplicaSet ? session : null);
      if (duplicateOrder) {
        res.status(400);
        throw new Error("An order has already been placed for this payment ID");
      }
    }

    const recentDuplicate = await Order.findOne({
      user: req.user._id,
      createdAt: { $gte: new Date(Date.now() - 3000) },
    }).session(isReplicaSet ? session : null);

    if (recentDuplicate) {
      res.status(400);
      throw new Error("A duplicate order submission was detected. Please wait a moment before trying again.");
    }

    // 1. Stock Pre-validation and Product Verification (Always recalculates live prices from MongoDB)
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

    // 2. Server-Side Coupon Validation & Discount Calculation (Never trusts frontend calculations)
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

    let deliveryFee = itemsTotal > 999 ? 0 : 99;
    if (deliverySpeed === "express") {
      deliveryFee += 199;
    }

    const netItemsSubtotal = Math.max(0, itemsTotal - discountAmount);
    const totalAmount = netItemsSubtotal + deliveryFee;

    // 3. Razorpay Signature & Amount Verification
    if (paymentMethod === "ONLINE") {
      if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
        res.status(400);
        throw new Error("ONLINE payment requires Razorpay payment details");
      }

      const secret = process.env.RAZORPAY_KEY_SECRET || (process.env.NODE_ENV === "test" ? "mock_secret" : null);
      if (!secret) {
        res.status(500);
        throw new Error("Razorpay secret is not configured on server");
      }

      const expectedSignature = crypto
        .createHmac("sha256", secret)
        .update(`${razorpayOrderId}|${razorpayPaymentId}`)
        .digest("hex");

      const expectedBuf = Buffer.from(expectedSignature, "utf-8");
      const sigBuf = Buffer.from(razorpaySignature, "utf-8");
      if (expectedBuf.length !== sigBuf.length || !crypto.timingSafeEqual(expectedBuf, sigBuf)) {
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
    const now = new Date();
    const deliveryDays = deliverySpeed === "express" ? 2 : 4;
    const expectedDelivery = new Date(now.getTime() + deliveryDays * 24 * 60 * 60 * 1000);

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
      status: "Placed",
      expectedDelivery,
      statusHistory: [
        {
          status: "Placed",
          timestamp: now,
          comment: "Order received & verified",
        },
      ],
      isPaid: paymentMethod === "ONLINE",
      paidAt: paymentMethod === "ONLINE" ? now : undefined,
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

    // Clear User Cart and reset abandoned tracking
    await Cart.findOneAndUpdate(
      { user: req.user._id },
      {
        items: [],
        isAbandoned: false,
        reminderCount: 0,
        lastReminderSentAt: null,
        lastActivityAt: new Date(),
      },
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

    // Send In-App Notification
    try {
      await createInAppNotification({
        userId: req.user._id,
        type: "order_placed",
        title: "Order Placed Successfully",
        message: `Your order #${order._id.toString().slice(-6).toUpperCase()} for ₹${totalAmount.toLocaleString("en-IN")} has been placed and received.`,
        link: "/orders",
        metadata: {
          orderId: order._id,
          totalAmount,
          itemCount: orderItems.length,
        },
      });
    } catch (notifErr) {
      console.error("Failed to trigger in-app order_placed notification:", notifErr);
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

/**
 * @desc    Cancel an eligible order
 * @route   POST /api/orders/:id/cancel
 * @access  Private
 */
export async function cancelOrder(req, res, next) {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      res.status(404);
      throw new Error("Order not found");
    }

    // Ownership check (or admin)
    if (
      order.user.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      res.status(403);
      throw new Error("You are not authorized to cancel this order");
    }

    // Eligibility check: only pre-dispatch orders can be cancelled
    const cancellableStatuses = ["Placed", "Confirmed", "Packed"];
    if (!cancellableStatuses.includes(order.status)) {
      res.status(400);
      throw new Error(
        order.status === "Cancelled"
          ? "Order is already cancelled"
          : `Order cannot be cancelled because it is already ${order.status}. You can request a return once it is delivered.`
      );
    }

    const { reason = "Customer requested cancellation" } = req.body;

    // Restore product inventory stock
    for (const item of order.items) {
      if (item.product) {
        await Product.findByIdAndUpdate(item.product, {
          $inc: { stock: item.quantity },
        });
      }
    }

    order.status = "Cancelled";
    order.cancellationReason = reason;
    order.cancelledAt = new Date();

    if (!order.statusHistory) {
      order.statusHistory = [];
    }
    order.statusHistory.push({
      status: "Cancelled",
      timestamp: new Date(),
      comment: `Order cancelled: ${reason}`,
    });

    const updatedOrder = await order.save();

    res.status(200).json({
      success: true,
      message: "Order cancelled successfully",
      data: updatedOrder,
    });
  } catch (error) {
    next(error);
  }
}
