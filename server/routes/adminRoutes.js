import express from "express";
import { protect, admin } from "../middleware/authMiddleware.js";
import {
  getDashboardStats,
  getUsers,
  updateUserRole,
  deleteUser,
  getOrders,
  updateOrderStatus,
  toggleOrderPayment,
  getAttackLogs,
  getBlockedIPs,
  blockIP,
  unblockIP,
} from "../controllers/adminController.js";

const router = express.Router();

// Apply admin access control to all routes in this router
router.use(protect, admin);

// Dashboard
router.get("/dashboard", getDashboardStats);

// Users
router.get("/users", getUsers);
router.put("/users/:id/role", updateUserRole);
router.delete("/users/:id", deleteUser);

// Orders
router.get("/orders", getOrders);
router.put("/orders/:id/status", updateOrderStatus);
router.put("/orders/:id/pay", toggleOrderPayment);

// WAF Security Logs & IP Blocking
router.get("/attack-logs", getAttackLogs);
router.get("/blocked-ips", getBlockedIPs);
router.post("/blocked-ips", blockIP);
router.put("/blocked-ips/:id/unblock", unblockIP);

export default router;
