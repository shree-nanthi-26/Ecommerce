import User from "../models/User.js";
import Order from "../models/Order.js";
import Product from "../models/Product.js";
import AttackLog from "../models/AttackLog.js";
import BlockedIP from "../models/BlockedIP.js";

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

    res.json({
      metrics: {
        totalUsers,
        totalProducts,
        totalOrders,
        totalSales,
        avgOrderValue,
        recentAlertsCount,
        activeBlockedIPsCount,
      },
      recentOrders,
      dailySales,
      categoryBreakdown,
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

    user.role = req.body.role || user.role;
    const updatedUser = await user.save();
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

    await user.deleteOne();
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
    const order = await Order.findById(req.params.id);
    if (!order) {
      res.status(404);
      throw new Error("Order not found");
    }

    order.status = req.body.status || order.status;
    const updatedOrder = await order.save();
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

    order.isPaid = !order.isPaid;
    order.paidAt = order.isPaid ? Date.now() : undefined;
    const updatedOrder = await order.save();
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
      existingBlock.isActive = true;
      existingBlock.reason = reason || existingBlock.reason;
      if (expiresAt) existingBlock.expiresAt = expiresAt;
      await existingBlock.save();
      return res.json(existingBlock);
    }

    const newBlock = await BlockedIP.create({ ip, reason, expiresAt });
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

    entry.isActive = !entry.isActive;
    const updated = await entry.save();
    res.json(updated);
  } catch (error) {
    next(error);
  }
}
