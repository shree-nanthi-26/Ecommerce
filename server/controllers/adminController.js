import User from "../models/User.js";
import Order from "../models/Order.js";
import Product from "../models/Product.js";
import AttackLog from "../models/AttackLog.js";
import BlockedIP from "../models/BlockedIP.js";
import AuditLog from "../models/AuditLog.js";
import { logAudit } from "../services/auditService.js";
import { sendEmail } from "../utils/sendEmail.js";
import { orderStatusUpdateTemplate } from "../emailTemplates/orderStatusUpdateTemplate.js";

// @desc    Get dashboard analytics/statistics
// @route   GET /api/admin/dashboard
// @access  Private/Admin
export async function getDashboardStats(req, res, next) {
  try {
    const totalUsers = await User.countDocuments();
    const totalProducts = await Product.countDocuments();
    const totalOrders = await Order.countDocuments();

    // Calculate total revenue from non-cancelled orders
    const salesData = await Order.aggregate([
      { $match: { status: { $ne: "Cancelled" } } },
      { $group: { _id: null, totalSales: { $sum: "$totalAmount" } } },
    ]);
    const totalSales = salesData.length > 0 ? salesData[0].totalSales : 0;

    // Average order value
    const avgOrderValue = totalOrders > 0 ? Math.round(totalSales / totalOrders) : 0;

    // Recent orders (last 5)
    const recentOrders = await Order.find()
      .populate("user", "name email")
      .sort({ createdAt: -1 })
      .limit(5);

    // Sales over the last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const dailySales = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: sevenDaysAgo },
          status: { $ne: "Cancelled" },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          sales: { $sum: "$totalAmount" },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Product Category breakdown
    const categoryBreakdown = await Product.aggregate([
      { $group: { _id: "$category", count: { $sum: 1 } } },
    ]);

    // WAF alert count summary
    const recentAlertsCount = await AttackLog.countDocuments();
    const activeBlockedIPsCount = await BlockedIP.countDocuments({ isActive: true });

    // Low stock products query (stock <= lowStockThreshold or stock <= 5)
    const lowStockProducts = await Product.find({
      $expr: { $lte: ["$stock", "$lowStockThreshold"] }
    }).select("name category price stock lowStockThreshold images").sort({ stock: 1 });

    res.json({
      metrics: {
        totalUsers,
        totalProducts,
        totalOrders,
        totalSales,
        avgOrderValue,
        recentAlertsCount,
        activeBlockedIPsCount,
        lowStockCount: lowStockProducts.length,
      },
      recentOrders,
      dailySales,
      categoryBreakdown,
      lowStockProducts,
    });
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
    order.status = req.body.status || order.status;
    const updatedOrder = await order.save();

    await logAudit(req, {
      action: "UPDATE_ORDER_STATUS",
      target: { type: "Order", id: order._id.toString() },
      oldValue: { status: oldStatus },
      newValue: { status: updatedOrder.status }
    });

    // Send email notification if status changed
    if (req.body.status && req.body.status !== oldStatus && order.user && order.user.email) {
      try {
        const html = orderStatusUpdateTemplate(order, req.body.status);
        sendEmail(order.user.email, `Order Status Update #${order._id} - Furniva`, html).catch(err =>
          console.error("Order status update email failed:", err)
        );
      } catch (emailErr) {
        console.error("Failed to trigger order status email:", emailErr);
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

// @desc    Get all audit logs
// @route   GET /api/admin/audit-logs
// @access  Private/Admin
export async function getAuditLogs(req, res, next) {
  try {
    const logs = await AuditLog.find()
      .populate("admin", "name email")
      .sort({ timestamp: -1 })
      .limit(100);
    res.json(logs);
  } catch (error) {
    next(error);
  }
}
