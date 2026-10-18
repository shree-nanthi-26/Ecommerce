import User from "../models/User.js";
import Order from "../models/Order.js";
import Product from "../models/Product.js";
import AttackLog from "../models/AttackLog.js";
import BlockedIP from "../models/BlockedIP.js";
import AuditLog from "../models/AuditLog.js";
import redis from "../config/redis.js";
import { logAudit } from "../services/auditService.js";
import { sendEmail } from "../utils/sendEmail.js";
import { orderStatusUpdateTemplate } from "../emailTemplates/orderStatusUpdateTemplate.js";
import { createInAppNotification } from "../services/notificationService.js";
import { redactSensitiveData } from "../utils/sanitizer.js";

// @desc    Get dashboard business analytics and KPI metrics with timeframe filtering
// @route   GET /api/admin/dashboard
// @access  Private/Admin
export async function getDashboardStats(req, res, next) {
  try {
    const { timeframe = "7d", startDate, endDate } = req.query;

    // Check Redis Cache (TTL: 30s)
    const cacheKey = `admin:analytics:${timeframe}:${startDate || ""}:${endDate || ""}`;
    try {
      if (process.env.NODE_ENV !== "test") {
        const cached = await redis.get(cacheKey);
        if (cached) {
          return res.status(200).json(JSON.parse(cached));
        }
      }
    } catch (cacheErr) {
      // Redis fallback
    }

    const now = new Date();
    let filterStart = new Date();
    let numDays = 7;

    if (timeframe === "today") {
      filterStart.setHours(0, 0, 0, 0);
      numDays = 1;
    } else if (timeframe === "7d") {
      filterStart.setDate(filterStart.getDate() - 6);
      filterStart.setHours(0, 0, 0, 0);
      numDays = 7;
    } else if (timeframe === "30d") {
      filterStart.setDate(filterStart.getDate() - 29);
      filterStart.setHours(0, 0, 0, 0);
      numDays = 30;
    } else if (timeframe === "3m") {
      filterStart.setDate(filterStart.getDate() - 89);
      filterStart.setHours(0, 0, 0, 0);
      numDays = 90;
    } else if (timeframe === "1y") {
      filterStart.setDate(filterStart.getDate() - 364);
      filterStart.setHours(0, 0, 0, 0);
      numDays = 365;
    } else if (timeframe === "custom" && startDate) {
      filterStart = new Date(startDate);
      filterStart.setHours(0, 0, 0, 0);
      const end = endDate ? new Date(endDate) : new Date();
      end.setHours(23, 59, 59, 999);
      numDays = Math.max(1, Math.ceil((end - filterStart) / (1000 * 60 * 60 * 24)));
    } else {
      filterStart.setDate(filterStart.getDate() - 6);
      filterStart.setHours(0, 0, 0, 0);
      numDays = 7;
    }

    // 1. Core Global Counters
    const totalUsers = await User.countDocuments();
    const totalProducts = await Product.countDocuments();
    const totalOrdersAllTime = await Order.countDocuments();

    // 2. Today's Revenue & Orders
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todaySalesAgg = await Order.aggregate([
      { $match: { createdAt: { $gte: todayStart }, status: { $ne: "Cancelled" } } },
      { $group: { _id: null, revenue: { $sum: "$totalAmount" }, count: { $sum: 1 } } },
    ]);
    const todayRevenue = todaySalesAgg.length > 0 ? todaySalesAgg[0].revenue : 0;
    const todayOrdersCount = todaySalesAgg.length > 0 ? todaySalesAgg[0].count : 0;

    // 3. All-Time Revenue
    const allTimeSalesAgg = await Order.aggregate([
      { $match: { status: { $ne: "Cancelled" } } },
      { $group: { _id: null, totalSales: { $sum: "$totalAmount" }, count: { $sum: 1 } } },
    ]);
    const totalRevenueAllTime = allTimeSalesAgg.length > 0 ? allTimeSalesAgg[0].totalSales : 0;

    // 4. Timeframe Filtered Revenue & Orders
    const timeframeMatch = {
      createdAt: { $gte: filterStart },
      status: { $ne: "Cancelled" },
    };
    if (timeframe === "custom" && endDate) {
      const customEnd = new Date(endDate);
      customEnd.setHours(23, 59, 59, 999);
      timeframeMatch.createdAt.$lte = customEnd;
    }

    const timeframeSalesAgg = await Order.aggregate([
      { $match: timeframeMatch },
      { $group: { _id: null, revenue: { $sum: "$totalAmount" }, count: { $sum: 1 } } },
    ]);
    const filteredRevenue = timeframeSalesAgg.length > 0 ? timeframeSalesAgg[0].revenue : 0;
    const filteredOrdersCount = timeframeSalesAgg.length > 0 ? timeframeSalesAgg[0].count : 0;
    const avgOrderValue = filteredOrdersCount > 0 ? Math.round(filteredRevenue / filteredOrdersCount) : 0;

    // 5. Continuous Revenue & Orders Timeline
    const rawSalesTimeline = await Order.aggregate([
      { $match: timeframeMatch },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          revenue: { $sum: "$totalAmount" },
          orders: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const timelineMap = new Map();
    rawSalesTimeline.forEach((item) => timelineMap.set(item._id, item));

    const salesTimeline = [];
    const stepDays = numDays <= 30 ? 1 : Math.ceil(numDays / 30);
    for (let i = 0; i < numDays; i += stepDays) {
      const d = new Date(filterStart);
      d.setDate(d.getDate() + i);
      const dateKey = d.toISOString().split("T")[0];
      const existing = timelineMap.get(dateKey);
      salesTimeline.push({
        date: dateKey,
        revenue: existing ? existing.revenue : 0,
        orders: existing ? existing.orders : 0,
      });
    }

    // 6. Best-Selling Products (by quantity & revenue)
    const bestSellingProducts = await Order.aggregate([
      { $match: timeframeMatch },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.product",
          name: { $first: "$items.name" },
          unitsSold: { $sum: "$items.quantity" },
          revenue: { $sum: { $multiply: ["$items.price", "$items.quantity"] } },
        },
      },
      { $sort: { unitsSold: -1, revenue: -1 } },
      { $limit: 6 },
      {
        $lookup: {
          from: "products",
          localField: "_id",
          foreignField: "_id",
          as: "productDetails",
        },
      },
      {
        $project: {
          _id: 1,
          name: 1,
          unitsSold: 1,
          revenue: 1,
          image: { $arrayElemAt: ["$productDetails.images.url", 0] },
          category: { $arrayElemAt: ["$productDetails.category", 0] },
          stock: { $arrayElemAt: ["$productDetails.stock", 0] },
        },
      },
    ]);

    // 7. Best-Performing Categories
    const categoryBreakdown = await Product.aggregate([
      {
        $group: {
          _id: "$category",
          count: { $sum: 1 },
          totalStock: { $sum: "$stock" },
        },
      },
      { $sort: { count: -1 } },
    ]);

    // 8. Low Stock Products Query (stock <= lowStockThreshold)
    const lowStockProducts = await Product.find({
      $or: [
        { $expr: { $lte: ["$stock", { $ifNull: ["$lowStockThreshold", 5] }] } },
        { stock: { $lte: 5 } },
      ],
    })
      .select("name sku category price stock lowStockThreshold images")
      .sort({ stock: 1 })
      .limit(10);

    const totalLowStockCount = await Product.countDocuments({
      $or: [
        { $expr: { $lte: ["$stock", { $ifNull: ["$lowStockThreshold", 5] }] } },
        { stock: { $lte: 5 } },
      ],
    });

    // 9. Recent Orders (last 8)
    const recentOrders = await Order.find()
      .populate("user", "name email")
      .sort({ createdAt: -1 })
      .limit(8);

    // 10. Security & WAF metrics
    const recentAlertsCount = await AttackLog.countDocuments();
    const activeBlockedIPsCount = await BlockedIP.countDocuments({ isActive: true });

    const responsePayload = {
      metrics: {
        todayRevenue,
        todayOrders: todayOrdersCount,
        totalRevenue: totalRevenueAllTime,
        totalSales: totalRevenueAllTime,
        filteredRevenue,
        totalOrders: totalOrdersAllTime,
        filteredOrders: filteredOrdersCount,
        totalUsers,
        totalProducts,
        lowStockProductsCount: totalLowStockCount,
        avgOrderValue,
        recentAlertsCount,
        activeBlockedIPsCount,
      },
      timeframe,
      salesTimeline,
      dailySales: salesTimeline.map((s) => ({ _id: s.date, sales: s.revenue, count: s.orders })),
      bestSellingProducts,
      categoryBreakdown,
      lowStockProducts,
      recentOrders,
    };

    // Cache in Redis for 30s
    if (process.env.NODE_ENV !== "test") {
      try {
        await redis.set(cacheKey, JSON.stringify(responsePayload), "EX", 30);
      } catch {
        // Ignore cache write error
      }
    }

    res.status(200).json(responsePayload);
  } catch (error) {
    next(error);
  }
}

// ─── USER MANAGEMENT ───

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private/Admin
export async function getUsers(req, res, next) {
  try {
    const users = await User.find().select("-password").sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    next(error);
  }
}

// @desc    Update user role
// @route   PUT /api/admin/users/:id/role
// @access  Private/Admin
export async function updateUserRole(req, res, next) {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      res.status(404);
      throw new Error("User not found");
    }

    if (req.user._id.toString() === user._id.toString()) {
      res.status(400);
      throw new Error("You cannot change your own admin status");
    }

    const oldRole = user.role;
    user.role = req.body.role || user.role;
    const updatedUser = await user.save();

    await logAudit(req, {
      action: "UPDATE_USER_ROLE",
      target: { type: "User", id: user._id.toString() },
      oldValue: { role: oldRole },
      newValue: { role: updatedUser.role }
    });

    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
    });
  } catch (error) {
    next(error);
  }
}

// @desc    Delete user
// @route   DELETE /api/admin/users/:id
// @access  Private/Admin
export async function deleteUser(req, res, next) {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      res.status(404);
      throw new Error("User not found");
    }

    if (req.user._id.toString() === user._id.toString()) {
      res.status(400);
      throw new Error("You cannot delete your own account");
    }

    const oldUserData = { name: user.name, email: user.email, role: user.role };
    await user.deleteOne();

    await logAudit(req, {
      action: "DELETE_USER",
      target: { type: "User", id: user._id.toString() },
      oldValue: oldUserData,
      newValue: null
    });

    res.json({ message: "User deleted successfully" });
  } catch (error) {
    next(error);
  }
}

// ─── ORDER MANAGEMENT ───

// @desc    Get all orders
// @route   GET /api/admin/orders
// @access  Private/Admin
export async function getOrders(req, res, next) {
  try {
    const orders = await Order.find()
      .populate("user", "name email")
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    next(error);
  }
}

// @desc    Update order status
// @route   PUT /api/admin/orders/:id/status
// @access  Private/Admin
export async function updateOrderStatus(req, res, next) {
  try {
    const order = await Order.findById(req.params.id).populate("user", "name email");
    if (!order) {
      res.status(404);
      throw new Error("Order not found");
    }

    const oldStatus = order.status;
    const { status, courier, trackingNumber, expectedDelivery, comment } = req.body;

    if (status && status !== oldStatus) {
      order.status = status;
      if (!order.statusHistory) {
        order.statusHistory = [];
      }
      order.statusHistory.push({
        status,
        timestamp: new Date(),
        comment: comment || `Order updated to ${status}`,
      });
    }

    if (courier !== undefined) order.courier = courier;
    if (trackingNumber !== undefined) order.trackingNumber = trackingNumber;
    if (expectedDelivery !== undefined) order.expectedDelivery = expectedDelivery;

    const updatedOrder = await order.save();

    await logAudit(req, {
      action: "UPDATE_ORDER_STATUS",
      target: { type: "Order", id: order._id.toString() },
      oldValue: { status: oldStatus },
      newValue: { status: updatedOrder.status }
    });

    // Send email notification if status changed
    if (status && status !== oldStatus && order.user && order.user.email) {
      try {
        const html = orderStatusUpdateTemplate(order, status);
        sendEmail(order.user.email, `Order Status Update #${order._id} - Furniva`, html).catch(err =>
          console.error("Order status update email failed:", err)
        );
      } catch (emailErr) {
        console.error("Failed to trigger order status email:", emailErr);
      }
    }

    // Send In-App Notification if status changed
    if (status && status !== oldStatus && order.user) {
      try {
        const shortOrderId = order._id.toString().slice(-6).toUpperCase();
        let notifType = null;
        let notifTitle = "";
        let notifMsg = "";

        if (status === "Confirmed") {
          notifType = "order_confirmed";
          notifTitle = "Order Confirmed";
          notifMsg = `Your order #${shortOrderId} has been confirmed. Our team is preparing your items.`;
        } else if (status === "Shipped") {
          notifType = "order_shipped";
          notifTitle = "Order Shipped";
          notifMsg = `Your order #${shortOrderId} has shipped${courier ? ` via ${courier}` : ""}${trackingNumber ? ` (Tracking: ${trackingNumber})` : ""}.`;
        } else if (status === "Out for Delivery") {
          notifType = "out_for_delivery";
          notifTitle = "Out for Delivery Today";
          notifMsg = `Great news! Your order #${shortOrderId} is out for delivery today.`;
        } else if (status === "Delivered") {
          notifType = "delivered";
          notifTitle = "Order Delivered & Assembled";
          notifMsg = `Your order #${shortOrderId} has been delivered successfully. Thank you for shopping with Furniva!`;
        }

        if (notifType) {
          await createInAppNotification({
            userId: order.user._id || order.user,
            type: notifType,
            title: notifTitle,
            message: notifMsg,
            link: `/orders/${order._id}/track`,
            metadata: {
              orderId: order._id,
              status,
              courier: courier || null,
              trackingNumber: trackingNumber || null,
            },
          });
        }
      } catch (inAppErr) {
        console.error("Failed to trigger in-app order status notification:", inAppErr);
      }
    }

    res.json(updatedOrder);
  } catch (error) {
    next(error);
  }
}

// @desc    Toggle order payment status
// @route   PUT /api/admin/orders/:id/pay
// @access  Private/Admin
export async function toggleOrderPayment(req, res, next) {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      res.status(404);
      throw new Error("Order not found");
    }

    const { reason } = req.body;
    if (order.paymentMethod === "ONLINE") {
      if (!reason || !reason.trim()) {
        res.status(400);
        throw new Error("Reason is required to manually override online payment status");
      }
    }

    const oldIsPaid = order.isPaid;
    order.isPaid = !order.isPaid;
    order.paidAt = order.isPaid ? Date.now() : undefined;
    const updatedOrder = await order.save();

    await logAudit(req, {
      action: "TOGGLE_ORDER_PAYMENT",
      target: { type: "Order", id: order._id.toString() },
      oldValue: { isPaid: oldIsPaid },
      newValue: { isPaid: updatedOrder.isPaid },
      reason: order.paymentMethod === "ONLINE" ? reason : undefined
    });

    res.json(updatedOrder);
  } catch (error) {
    next(error);
  }
}

// ─── WAF & SECURITY LOGS ───

// @desc    Get WAF attack logs
// @route   GET /api/admin/attack-logs
// @access  Private/Admin
export async function getAttackLogs(req, res, next) {
  try {
    const logs = await AttackLog.find().sort({ timestamp: -1 }).limit(100);
    res.json(logs);
  } catch (error) {
    next(error);
  }
}

// @desc    Get all blocked IPs
// @route   GET /api/admin/blocked-ips
// @access  Private/Admin
export async function getBlockedIPs(req, res, next) {
  try {
    const list = await BlockedIP.find().sort({ blockedAt: -1 });
    res.json(list);
  } catch (error) {
    next(error);
  }
}

// @desc    Manually block an IP
// @route   POST /api/admin/blocked-ips
// @access  Private/Admin
export async function blockIP(req, res, next) {
  try {
    const { ip, reason, expiresAt } = req.body;
    if (!ip) {
      res.status(400);
      throw new Error("IP address is required");
    }

    const existingBlock = await BlockedIP.findOne({ ip });
    if (existingBlock) {
      const oldIsActive = existingBlock.isActive;
      existingBlock.isActive = true;
      existingBlock.reason = reason || existingBlock.reason;
      if (expiresAt) existingBlock.expiresAt = expiresAt;
      const updated = await existingBlock.save();

      await logAudit(req, {
        action: "BLOCK_IP",
        target: { type: "BlockedIP", id: ip },
        oldValue: { isActive: oldIsActive },
        newValue: { isActive: true, reason: existingBlock.reason, expiresAt: existingBlock.expiresAt }
      });

      return res.json(updated);
    }

    const newBlock = await BlockedIP.create({ ip, reason, expiresAt });

    await logAudit(req, {
      action: "BLOCK_IP",
      target: { type: "BlockedIP", id: ip },
      oldValue: null,
      newValue: { ip, reason, expiresAt }
    });

    res.status(201).json(newBlock);
  } catch (error) {
    next(error);
  }
}

// @desc    Unblock / toggle blocked IP status
// @route   PUT /api/admin/blocked-ips/:id/unblock
// @access  Private/Admin
export async function unblockIP(req, res, next) {
  try {
    const entry = await BlockedIP.findById(req.params.id);
    if (!entry) {
      res.status(404);
      throw new Error("Blocked IP entry not found");
    }

    const oldIsActive = entry.isActive;
    entry.isActive = !entry.isActive;
    const updated = await entry.save();

    await logAudit(req, {
      action: "TOGGLE_IP_BLOCK",
      target: { type: "BlockedIP", id: entry._id.toString() },
      oldValue: { isActive: oldIsActive },
      newValue: { isActive: updated.isActive }
    });

    res.json(updated);
  } catch (error) {
    next(error);
  }
}

// @desc    Get all audit logs with pagination and multi-dimensional filters
// @route   GET /api/admin/audit-logs
// @access  Private/Admin
export async function getAuditLogs(req, res, next) {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const query = {};

    // Filter by Admin
    if (req.query.admin && req.query.admin !== "All" && req.query.admin !== "all") {
      query.admin = req.query.admin;
    }

    // Filter by Action
    if (req.query.action && req.query.action !== "All" && req.query.action !== "all") {
      query.action = req.query.action.trim();
    }

    // Filter by Resource (target.type)
    if (req.query.resource && req.query.resource !== "All" && req.query.resource !== "all") {
      query["target.type"] = req.query.resource.trim();
    }

    // Filter by Date
    if (req.query.startDate || req.query.endDate) {
      query.timestamp = {};
      if (req.query.startDate) {
        query.timestamp.$gte = new Date(req.query.startDate);
      }
      if (req.query.endDate) {
        const end = new Date(req.query.endDate);
        if (req.query.endDate.length <= 10) {
          end.setHours(23, 59, 59, 999);
        }
        query.timestamp.$lte = end;
      }
    }

    // Keyword Search
    if (req.query.search && req.query.search.trim()) {
      const searchRegex = new RegExp(req.query.search.trim(), "i");
      query.$or = [
        { action: searchRegex },
        { "target.type": searchRegex },
        { "target.id": searchRegex },
        { reason: searchRegex },
        { ip: searchRegex },
      ];
    }

    const [total, rawLogs, distinctActions, distinctResources] = await Promise.all([
      AuditLog.countDocuments(query),
      AuditLog.find(query)
        .populate("admin", "name email role")
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      AuditLog.distinct("action"),
      AuditLog.distinct("target.type"),
    ]);

    // Redact sensitive credentials from oldValue and newValue
    const logs = rawLogs.map((log) => ({
      ...log,
      oldValue: log.oldValue ? redactSensitiveData(log.oldValue) : null,
      newValue: log.newValue ? redactSensitiveData(log.newValue) : null,
    }));

    // Find active admins who have performed audit actions
    const adminIds = await AuditLog.distinct("admin");
    const activeAdmins = await User.find({ _id: { $in: adminIds.filter(Boolean) } })
      .select("name email role")
      .lean();

    res.json({
      logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
      filterOptions: {
        actions: distinctActions.filter(Boolean),
        resources: distinctResources.filter(Boolean),
        admins: activeAdmins,
      },
    });
  } catch (error) {
    next(error);
  }
}

// @desc    Get aggregate security metrics and threat distribution
// @route   GET /api/admin/security/dashboard
// @access  Private/Admin
export async function getSecurityDashboard(req, res, next) {
  try {
    const now = new Date();
    const past24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const past7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [
      totalEvents,
      eventsLast24h,
      activeBlockedIps,
      wafEvents,
      rateLimitEvents,
      authFailures,
      suspiciousRequests,
      criticalThreats,
      securityAuditEvents,
      attackTypeDistribution,
      severityDistribution,
      topTargetedUrls,
      topOffendingIpsRaw,
      timelineRaw,
    ] = await Promise.all([
      AttackLog.countDocuments(),
      AttackLog.countDocuments({ timestamp: { $gte: past24h } }),
      BlockedIP.countDocuments({
        isActive: true,
        $or: [{ expiresAt: null }, { expiresAt: { $exists: false } }, { expiresAt: { $gt: now } }],
      }),
      AttackLog.countDocuments({
        attackType: { $in: ["SQLi", "XSS", "Path Traversal", "Command Injection", "NoSQL Injection"] },
      }),
      AttackLog.countDocuments({ attackType: "Rate Limit Exceeded" }),
      AttackLog.countDocuments({ attackType: "Authentication Failure" }),
      AttackLog.countDocuments({
        attackType: { $in: ["Suspicious Request", "Blocked IP Access Attempt"] },
      }),
      AttackLog.countDocuments({ severity: { $gte: 8 } }),
      AuditLog.countDocuments({
        $or: [
          { action: { $in: ["BLOCK_IP", "TOGGLE_IP_BLOCK", "UPDATE_USER_ROLE", "DELETE_USER"] } },
          { "target.type": "BlockedIP" },
        ],
      }),
      AttackLog.aggregate([
        { $group: { _id: "$attackType", count: { $sum: 1 }, avgSeverity: { $avg: "$severity" } } },
        { $sort: { count: -1 } },
      ]),
      AttackLog.aggregate([
        { $group: { _id: "$severity", count: { $sum: 1 } } },
        { $sort: { _id: -1 } },
      ]),
      AttackLog.aggregate([
        { $group: { _id: "$url", count: { $sum: 1 }, attackTypes: { $addToSet: "$attackType" } } },
        { $sort: { count: -1 } },
        { $limit: 8 },
      ]),
      AttackLog.aggregate([
        {
          $group: {
            _id: "$ip",
            count: { $sum: 1 },
            maxSeverity: { $max: "$severity" },
            lastSeen: { $max: "$timestamp" },
            attackTypes: { $addToSet: "$attackType" },
          },
        },
        { $sort: { count: -1 } },
        { $limit: 8 },
      ]),
      AttackLog.aggregate([
        { $match: { timestamp: { $gte: past7d } } },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$timestamp" } },
            count: { $sum: 1 },
            highSeverity: {
              $sum: { $cond: [{ $gte: ["$severity", 8] }, 1, 0] },
            },
          },
        },
        { $sort: { _id: 1 } },
      ]),
    ]);

    // Check which top offending IPs are already blocked
    const offendingIpList = topOffendingIpsRaw.map((i) => i._id);
    const blockedStatusList = await BlockedIP.find({ ip: { $in: offendingIpList }, isActive: true }).select("ip");
    const blockedIpSet = new Set(blockedStatusList.map((b) => b.ip));

    const topOffenders = topOffendingIpsRaw.map((item) => ({
      ...item,
      isBlocked: blockedIpSet.has(item._id),
    }));

    res.json({
      summary: {
        totalEvents,
        eventsLast24h,
        activeBlockedIps,
        wafEvents,
        rateLimitEvents,
        authFailures,
        suspiciousRequests,
        criticalThreats,
        securityAuditEvents,
      },
      attackTypeDistribution,
      severityDistribution,
      topTargetedUrls,
      topOffendingIps: topOffenders,
      timeline: timelineRaw.map((t) => ({ date: t._id, count: t.count, highSeverity: t.highSeverity })),
    });
  } catch (error) {
    next(error);
  }
}

// @desc    Get paginated and filtered security threat events
// @route   GET /api/admin/security/events
// @access  Private/Admin
export async function getSecurityEvents(req, res, next) {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 25));
    const skip = (page - 1) * limit;

    const query = {};

    // Filter by Event Type
    const { eventType, severity, ip, startDate, endDate, search } = req.query;

    if (eventType && eventType !== "All" && eventType !== "all") {
      switch (eventType.toLowerCase()) {
        case "waf":
          query.attackType = { $in: ["SQLi", "XSS", "Path Traversal", "Command Injection", "NoSQL Injection"] };
          break;
        case "rate_limit":
        case "rate limit":
          query.attackType = "Rate Limit Exceeded";
          break;
        case "auth_failure":
        case "auth failure":
        case "authentication failure":
          query.attackType = "Authentication Failure";
          break;
        case "suspicious":
        case "suspicious request":
          query.attackType = { $in: ["Suspicious Request", "Blocked IP Access Attempt"] };
          break;
        case "blocked_ip":
          query.attackType = "Blocked IP Access Attempt";
          break;
        default:
          query.attackType = eventType;
      }
    }

    // Filter by Severity
    if (severity && severity !== "All" && severity !== "all") {
      switch (severity.toLowerCase()) {
        case "critical":
          query.severity = { $gte: 9 };
          break;
        case "high":
          query.severity = { $gte: 7, $lte: 8 };
          break;
        case "medium":
          query.severity = { $gte: 5, $lte: 6 };
          break;
        case "low":
          query.severity = { $lte: 4 };
          break;
        default:
          const num = parseInt(severity, 10);
          if (!isNaN(num)) query.severity = num;
      }
    }

    // Filter by IP
    if (ip && ip.trim()) {
      query.ip = new RegExp(ip.trim(), "i");
    }

    // Filter by Date
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        if (endDate.length <= 10) end.setHours(23, 59, 59, 999);
        query.timestamp.$lte = end;
      }
    }

    // Keyword Search
    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), "i");
      query.$or = [
        { ip: regex },
        { attackType: regex },
        { url: regex },
        { details: regex },
        { userAgent: regex },
      ];
    }

    const [total, rawEvents] = await Promise.all([
      AttackLog.countDocuments(query),
      AttackLog.find(query).sort({ timestamp: -1 }).skip(skip).limit(limit).lean(),
    ]);

    // Redact sensitive payload info
    const events = rawEvents.map((ev) => ({
      ...ev,
      payload: ev.payload ? redactSensitiveData(ev.payload) : null,
    }));

    res.json({
      events,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    next(error);
  }
}

// @desc    Get all abandoned carts and overview metrics
// @route   GET /api/admin/abandoned-carts
// @access  Private/Admin
export async function getAbandonedCartsAdmin(req, res, next) {
  try {
    const { thresholdHours, limit = 50 } = req.query;
    const { findAbandonedCarts } = await import("../services/abandonedCartService.js");

    const result = await findAbandonedCarts({
      thresholdHours: thresholdHours ? Number(thresholdHours) : null,
      limit: Number(limit),
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

// @desc    Trigger abandoned cart reminder detection & email dispatch
// @route   POST /api/admin/abandoned-carts/run-check
// @access  Private/Admin
export async function triggerAbandonedCartCheckAdmin(req, res, next) {
  try {
    const { thresholdHours, dryRun = false } = req.body;
    const { processAbandonedCarts } = await import("../services/abandonedCartService.js");

    const result = await processAbandonedCarts({
      thresholdHours: thresholdHours !== undefined ? Number(thresholdHours) : null,
      dryRun: Boolean(dryRun),
      clientUrl: process.env.CLIENT_URL,
    });

    await logAudit(req, {
      action: "TRIGGER_ABANDONED_CART_CHECK",
      target: { type: "Cart", id: "bulk" },
      oldValue: null,
      newValue: {
        dryRun,
        remindersSent: result.remindersSent,
        scanned: result.scanned,
      },
    });

    res.json(result);
  } catch (error) {
    next(error);
  }
}
