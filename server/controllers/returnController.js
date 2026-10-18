import mongoose from "mongoose";
import Return from "../models/Return.js";
import Order from "../models/Order.js";
import { createInAppNotification } from "../services/notificationService.js";

const VALID_RETURN_REASONS = [
  "Damaged product",
  "Wrong product",
  "Product not as expected",
  "Changed mind",
  "Other",
];

const VALID_RETURN_STATUSES = [
  "Requested",
  "Under Review",
  "Approved",
  "Rejected",
  "Pickup Scheduled",
  "Returned",
  "Refund Initiated",
  "Completed",
];

/**
 * @desc    Create a product return request for a delivered order
 * @route   POST /api/returns
 * @access  Private
 */
export async function createReturnRequest(req, res, next) {
  try {
    const { orderId, reason, description, images = [] } = req.body;

    if (!orderId || !mongoose.Types.ObjectId.isValid(orderId)) {
      res.status(400);
      throw new Error("Valid Order ID is required");
    }

    const order = await Order.findById(orderId);
    if (!order) {
      res.status(404);
      throw new Error("Order not found");
    }

    // Ownership check
    if (order.user.toString() !== req.user._id.toString()) {
      res.status(403);
      throw new Error("You are not authorized to request a return for this order");
    }

    // Status check: must be Delivered
    if (order.status !== "Delivered") {
      res.status(400);
      throw new Error(
        `Returns can only be requested for Delivered orders. Current order status: ${order.status}`
      );
    }

    // Check if an active return request already exists
    const existingReturn = await Return.findOne({
      order: orderId,
      status: { $nin: ["Rejected"] },
    });

    if (existingReturn) {
      res.status(400);
      throw new Error(
        `A return request is already ${existingReturn.status.toLowerCase()} for this order`
      );
    }

    if (!reason || !VALID_RETURN_REASONS.includes(reason)) {
      res.status(400);
      throw new Error(
        `Please select a valid return reason: ${VALID_RETURN_REASONS.join(", ")}`
      );
    }

    if (!description || !description.trim()) {
      res.status(400);
      throw new Error("Please provide a description explaining the return reason");
    }

    // Formatted images array
    const formattedImages = Array.isArray(images)
      ? images
          .filter((img) => (typeof img === "string" ? img : img?.url))
          .map((img) => (typeof img === "string" ? { url: img } : { url: img.url, publicId: img.publicId }))
      : [];

    const now = new Date();
    const returnDoc = await Return.create({
      order: order._id,
      user: req.user._id,
      items: order.items,
      reason,
      description: description.trim(),
      images: formattedImages,
      status: "Requested",
      refundAmount: order.totalAmount || 0,
      refundStatus: "Pending",
      statusHistory: [
        {
          status: "Requested",
          timestamp: now,
          comment: "Return request submitted by customer",
          updatedBy: req.user.name || "Customer",
        },
      ],
    });

    res.status(201).json({
      success: true,
      message: "Return request submitted successfully. Our team will review it within 24 hours.",
      data: returnDoc,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * @desc    Get all return requests for logged-in user
 * @route   GET /api/returns/my
 * @access  Private
 */
export async function getMyReturns(req, res, next) {
  try {
    const returns = await Return.find({ user: req.user._id })
      .populate("order", "totalAmount paymentMethod isPaid createdAt status")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: returns.length,
      data: returns,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * @desc    Get return request for a specific order
 * @route   GET /api/returns/order/:orderId
 * @access  Private
 */
export async function getReturnByOrderId(req, res, next) {
  try {
    const { orderId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      res.status(400);
      throw new Error("Invalid order ID format");
    }

    const returnDoc = await Return.findOne({ order: orderId }).sort({ createdAt: -1 });

    if (!returnDoc) {
      return res.status(200).json({ success: true, data: null });
    }

    // Ownership check (or admin)
    if (
      returnDoc.user.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      res.status(403);
      throw new Error("You are not authorized to view this return request");
    }

    res.status(200).json({
      success: true,
      data: returnDoc,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * @desc    Get single return request by ID
 * @route   GET /api/returns/:id
 * @access  Private
 */
export async function getReturnById(req, res, next) {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400);
      throw new Error("Invalid return ID format");
    }

    const returnDoc = await Return.findById(id)
      .populate("order")
      .populate("user", "name email");

    if (!returnDoc) {
      res.status(404);
      throw new Error("Return request not found");
    }

    // Ownership check (or admin)
    if (
      returnDoc.user._id.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      res.status(403);
      throw new Error("You are not authorized to view this return request");
    }

    res.status(200).json({
      success: true,
      data: returnDoc,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * @desc    Get all return requests (Admin)
 * @route   GET /api/returns/admin/all
 * @access  Private/Admin
 */
export async function getAllReturnsAdmin(req, res, next) {
  try {
    const { status, page = 1, limit = 50 } = req.query;
    const filter = {};

    if (status && VALID_RETURN_STATUSES.includes(status)) {
      filter.status = status;
    }

    const returns = await Return.find(filter)
      .populate("user", "name email")
      .populate("order", "_id createdAt totalAmount paymentMethod isPaid shippingAddress")
      .sort({ createdAt: -1 })
      .skip((page - 1) * Number(limit))
      .limit(Number(limit));

    const total = await Return.countDocuments(filter);

    res.status(200).json({
      success: true,
      count: returns.length,
      total,
      data: returns,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * @desc    Update return request status and admin notes (Admin)
 * @route   PUT /api/returns/admin/:id/status
 * @access  Private/Admin
 */
export async function updateReturnStatusAdmin(req, res, next) {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400);
      throw new Error("Invalid return ID format");
    }

    const returnDoc = await Return.findById(id).populate("user", "name email");
    if (!returnDoc) {
      res.status(404);
      throw new Error("Return request not found");
    }

    const {
      status,
      adminNotes,
      rejectionReason,
      pickupDate,
      refundAmount,
      refundStatus,
      comment,
    } = req.body;

    const oldStatus = returnDoc.status;

    if (status) {
      if (!VALID_RETURN_STATUSES.includes(status)) {
        res.status(400);
        throw new Error(
          `Invalid status. Must be one of: ${VALID_RETURN_STATUSES.join(", ")}`
        );
      }
      returnDoc.status = status;
    }

    if (adminNotes !== undefined) returnDoc.adminNotes = adminNotes;
    if (rejectionReason !== undefined) returnDoc.rejectionReason = rejectionReason;
    if (pickupDate !== undefined) returnDoc.pickupDate = pickupDate;
    if (refundAmount !== undefined) returnDoc.refundAmount = Number(refundAmount);
    if (refundStatus !== undefined) returnDoc.refundStatus = refundStatus;

    if (status && status !== oldStatus) {
      if (!returnDoc.statusHistory) {
        returnDoc.statusHistory = [];
      }
      returnDoc.statusHistory.push({
        status,
        timestamp: new Date(),
        comment: comment || `Status updated from ${oldStatus} to ${status}`,
        updatedBy: req.user.name || "Admin",
      });
    }

    const updated = await returnDoc.save();

    if (status && status !== oldStatus && returnDoc.user) {
      try {
        await createInAppNotification({
          userId: returnDoc.user._id || returnDoc.user,
          type: "return_update",
          title: `Return Request ${status}`,
          message: `Your return request for order #${returnDoc.order?.toString().slice(-6).toUpperCase() || ""} has been updated to "${status}".${comment ? ` (${comment})` : ""}`,
          link: "/orders",
          metadata: {
            returnId: returnDoc._id,
            status,
            orderId: returnDoc.order,
          },
        });
      } catch (notifErr) {
        console.error("Failed to trigger return_update notification:", notifErr);
      }
    }

    res.status(200).json({
      success: true,
      message: "Return request updated successfully",
      data: updated,
    });
  } catch (error) {
    next(error);
  }
}
