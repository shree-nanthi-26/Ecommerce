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
  getAuditLogs,
  getSecurityDashboard,
  getSecurityEvents,
  getAbandonedCartsAdmin,
  triggerAbandonedCartCheckAdmin,
} from "../controllers/adminController.js";
import {
  getProducts as getAdminProducts,
  getProduct as getAdminProduct,
  createProduct as createAdminProduct,
  updateProduct as updateAdminProduct,
  deleteProduct as deleteAdminProduct,
} from "../controllers/adminProductController.js";

const router = express.Router();

// Apply admin access control to all routes in this router
router.use(protect, admin);

// Dashboard
router.get("/dashboard", getDashboardStats);

// Products
router.get("/products", getAdminProducts);
router.get("/products/:id", getAdminProduct);
router.post("/products", createAdminProduct);
router.put("/products/:id", updateAdminProduct);
router.delete("/products/:id", deleteAdminProduct);

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
router.get("/audit-logs", getAuditLogs);
router.get("/security/dashboard", getSecurityDashboard);
router.get("/security/events", getSecurityEvents);

// Abandoned Carts Management
router.get("/abandoned-carts", getAbandonedCartsAdmin);
router.post("/abandoned-carts/run-check", triggerAbandonedCartCheckAdmin);

export default router;
