import express from "express";
import upload from "../middleware/upload.js";
import { uploadImage, uploadMultipleImages } from "../controllers/uploadController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

const adminOnly = (req, res, next) => {
  if (!req.user || req.user.role !== "admin") {
    res.status(403);
    throw new Error("Admin access required");
  }
  next();
};

router.post("/single", protect, adminOnly, upload.single("image"), uploadImage);
router.post("/multiple", protect, adminOnly, upload.array("images", 5), uploadMultipleImages);

export default router;
