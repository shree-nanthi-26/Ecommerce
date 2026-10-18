import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  getInventory,
  adjustStock,
  getInventoryHistory,
} from "../controllers/inventoryController.js";

const router = express.Router();

const adminOnly = (req, res, next) => {
  if (!req.user || req.user.role !== "admin") {
    res.status(403);
    throw new Error("Admin access required");
  }
  next();
};

router.use(protect);
router.use(adminOnly);

router.get("/", getInventory);
router.post("/adjust", adjustStock);
router.get("/history", getInventoryHistory);

export default router;
