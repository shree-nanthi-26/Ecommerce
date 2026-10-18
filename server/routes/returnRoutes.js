import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  createReturnRequest,
  getMyReturns,
  getReturnByOrderId,
  getReturnById,
  getAllReturnsAdmin,
  updateReturnStatusAdmin,
} from "../controllers/returnController.js";

const router = express.Router();

const adminOnly = (req, res, next) => {
  if (!req.user || req.user.role !== "admin") {
    res.status(403);
    throw new Error("Admin access required");
  }
  next();
};

// All return routes require authentication
router.use(protect);

// Customer endpoints
router.post("/", createReturnRequest);
router.get("/my", getMyReturns);
router.get("/order/:orderId", getReturnByOrderId);
router.get("/:id", getReturnById);

// Admin endpoints
router.get("/admin/all", adminOnly, getAllReturnsAdmin);
router.put("/admin/:id/status", adminOnly, updateReturnStatusAdmin);

export default router;
