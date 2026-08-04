// server/controllers/adminOrderController.js
import { getOrders, updateOrderStatus, toggleOrderPayment } from "./adminController.js";
import asyncHandler from "express-async-handler";

// Export wrappers to keep route imports simple
export const getOrders = asyncHandler(getOrders);
export const updateOrderStatus = asyncHandler(updateOrderStatus);
export const toggleOrderPayment = asyncHandler(toggleOrderPayment);
