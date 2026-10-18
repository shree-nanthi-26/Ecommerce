import mongoose from "mongoose";
import Notification from "../models/Notification.js";

/**
 * Filter groups mapping for convenient UI categorization
 */
const TYPE_GROUPS = {
  orders: [
    "order_placed",
    "order_confirmed",
    "order_shipped",
    "out_for_delivery",
    "delivered",
  ],
  returns: ["return_update"],
  alerts: ["price_drop", "back_in_stock"],
  deals: ["new_deals"],
};

/**
 * @desc    Get user notifications with filtering, unread count, and pagination
 * @route   GET /api/notifications
 * @access  Private
 */
export async function getNotifications(req, res, next) {
  try {
    const userId = req.user._id;
    const { filter = "all", type, page = 1, limit = 50 } = req.query;

    const query = { user: userId };

    if (filter === "unread") {
      query.isRead = false;
    } else if (TYPE_GROUPS[filter]) {
      query.type = { $in: TYPE_GROUPS[filter] };
    }

    if (type && type !== "all") {
      query.type = type;
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 50));
    const skip = (pageNum - 1) * limitNum;

    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find(query).sort({ createdAt: -1 }).skip(skip).limit(limitNum).lean(),
      Notification.countDocuments(query),
      Notification.countDocuments({ user: userId, isRead: false }),
    ]);

    res.json({
      success: true,
      notifications,
      unreadCount,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum) || 1,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * @desc    Get unread notification count only
 * @route   GET /api/notifications/unread-count
 * @access  Private
 */
export async function getUnreadCount(req, res, next) {
  try {
    const unreadCount = await Notification.countDocuments({
      user: req.user._id,
      isRead: false,
    });

    res.json({ success: true, unreadCount });
  } catch (error) {
    next(error);
  }
}

/**
 * @desc    Mark a single notification as read
 * @route   PUT /api/notifications/:id/read
 * @access  Private
 */
export async function markAsRead(req, res, next) {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400);
      throw new Error("Invalid notification ID");
    }

    const notification = await Notification.findOneAndUpdate(
      { _id: id, user: req.user._id },
      { isRead: true, readAt: new Date() },
      { new: true }
    );

    if (!notification) {
      res.status(404);
      throw new Error("Notification not found");
    }

    const unreadCount = await Notification.countDocuments({
      user: req.user._id,
      isRead: false,
    });

    res.json({
      success: true,
      notification,
      unreadCount,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * @desc    Mark all notifications as read for current user
 * @route   PUT /api/notifications/read-all
 * @access  Private
 */
export async function markAllAsRead(req, res, next) {
  try {
    const now = new Date();
    const result = await Notification.updateMany(
      { user: req.user._id, isRead: false },
      { $set: { isRead: true, readAt: now } }
    );

    res.json({
      success: true,
      message: "All notifications marked as read",
      modifiedCount: result.modifiedCount,
      unreadCount: 0,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * @desc    Delete a single notification
 * @route   DELETE /api/notifications/:id
 * @access  Private
 */
export async function deleteNotification(req, res, next) {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400);
      throw new Error("Invalid notification ID");
    }

    const notification = await Notification.findOneAndDelete({
      _id: id,
      user: req.user._id,
    });

    if (!notification) {
      res.status(404);
      throw new Error("Notification not found");
    }

    const unreadCount = await Notification.countDocuments({
      user: req.user._id,
      isRead: false,
    });

    res.json({
      success: true,
      message: "Notification deleted successfully",
      unreadCount,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * @desc    Clear all notifications for current user
 * @route   DELETE /api/notifications
 * @access  Private
 */
export async function clearAllNotifications(req, res, next) {
  try {
    const result = await Notification.deleteMany({ user: req.user._id });

    res.json({
      success: true,
      message: "All notifications cleared",
      deletedCount: result.deletedCount,
      unreadCount: 0,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * @desc    Create a custom in-app notification (Reusable dispatcher endpoint)
 * @route   POST /api/notifications
 * @access  Private
 */
export async function createNotification(req, res, next) {
  try {
    const { type, title, message, link, metadata } = req.body;

    if (!type || !title || !message) {
      res.status(400);
      throw new Error("Notification type, title, and message are required");
    }

    const notification = await Notification.create({
      user: req.user._id,
      type,
      title,
      message,
      link: link || null,
      metadata: metadata || {},
    });

    const unreadCount = await Notification.countDocuments({
      user: req.user._id,
      isRead: false,
    });

    res.status(201).json({
      success: true,
      notification,
      unreadCount,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * @desc    Seed sample notifications for testing all 9 notification types
 * @route   POST /api/notifications/demo-seed
 * @access  Private
 */
export async function seedDemoNotifications(req, res, next) {
  try {
    const userId = req.user._id;

    const sampleNotifications = [
      {
        user: userId,
        type: "order_placed",
        title: "Order Placed Successfully",
        message: "Your order #FUR-84920 for Scandinavian Walnut Sofa has been placed and received.",
        link: "/orders",
        metadata: { orderId: "FUR-84920", totalAmount: 48999 },
        isRead: false,
        createdAt: new Date(Date.now() - 5 * 60 * 1000), // 5 mins ago
      },
      {
        user: userId,
        type: "order_confirmed",
        title: "Order Confirmed & Verified",
        message: "Payment verified for order #FUR-84920. Our artisans have begun packing your items.",
        link: "/orders",
        metadata: { orderId: "FUR-84920" },
        isRead: false,
        createdAt: new Date(Date.now() - 35 * 60 * 1000), // 35 mins ago
      },
      {
        user: userId,
        type: "order_shipped",
        title: "Order Shipped via Express Courier",
        message: "Your order #FUR-73019 has shipped via BlueDart Express (Tracking #BLU99482103).",
        link: "/orders",
        metadata: { orderId: "FUR-73019", trackingNumber: "BLU99482103", courier: "BlueDart Express" },
        isRead: false,
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      },
      {
        user: userId,
        type: "out_for_delivery",
        title: "Out for Delivery Today!",
        message: "Delivery executive Suresh Kumar is arriving today with your order #FUR-73019. Keep phone handy.",
        link: "/orders",
        metadata: { orderId: "FUR-73019", deliveryAgent: "Suresh Kumar" },
        isRead: false,
        createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
      },
      {
        user: userId,
        type: "delivered",
        title: "Delivered & Assembled Successfully",
        message: "Package for order #FUR-61042 was delivered and assembled at your address. Enjoy your furniture!",
        link: "/orders",
        metadata: { orderId: "FUR-61042" },
        isRead: true,
        readAt: new Date(Date.now() - 10 * 60 * 60 * 1000),
        createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000), // 12 hours ago
      },
      {
        user: userId,
        type: "return_update",
        title: "Return Request Approved",
        message: "Your return request #RET-4091 has been Approved. Pickup scheduled for tomorrow between 10 AM - 2 PM.",
        link: "/orders",
        metadata: { returnId: "RET-4091", status: "Approved" },
        isRead: false,
        createdAt: new Date(Date.now() - 18 * 60 * 60 * 1000), // 18 hours ago
      },
      {
        user: userId,
        type: "price_drop",
        title: "Price Drop Alert: Minimalist Oak Desk",
        message: "Great news! Minimalist Oak Desk in your wishlist dropped from ₹18,499 to ₹14,999 (Save 19%)!",
        link: "/products",
        metadata: { oldPrice: 18499, newPrice: 14999, discountPercent: 19 },
        isRead: false,
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
      },
      {
        user: userId,
        type: "back_in_stock",
        title: "Back in Stock: Velvet Lounge Accent Chair",
        message: "Your saved item 'Velvet Lounge Accent Chair' is back in stock with limited units remaining!",
        link: "/products",
        metadata: { stock: 8 },
        isRead: true,
        readAt: new Date(Date.now() - 28 * 60 * 60 * 1000),
        createdAt: new Date(Date.now() - 36 * 60 * 60 * 1000), // 1.5 days ago
      },
      {
        user: userId,
        type: "new_deals",
        title: "Festive Living Room Sale — Flat 25% Off",
        message: "Limited time offer! Use coupon code FESTIVE25 on all premium Sofas and Coffee Tables this weekend.",
        link: "/deals",
        metadata: { couponCode: "FESTIVE25", discount: 25 },
        isRead: false,
        createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000), // 2 days ago
      },
    ];

    const inserted = await Notification.insertMany(sampleNotifications);

    const unreadCount = await Notification.countDocuments({
      user: userId,
      isRead: false,
    });

    res.status(201).json({
      success: true,
      message: "Seeded 9 sample notifications for all notification types",
      count: inserted.length,
      unreadCount,
    });
  } catch (error) {
    next(error);
  }
}
