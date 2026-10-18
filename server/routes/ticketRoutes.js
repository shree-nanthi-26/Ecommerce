import express from "express";
import { protect, admin } from "../middleware/authMiddleware.js";
import {
  createTicket,
  getMyTickets,
  getTicketById,
  addMessage,
  getAdminTickets,
  updateTicketStatus,
  assignTicket,
  getAdminAgents,
} from "../controllers/ticketController.js";

const router = express.Router();

// ── Customer Routes (Protected) ──────────────────────────────────────────────
router.post("/", protect, createTicket);
router.get("/my", protect, getMyTickets);

// ── Admin Routes (Admin Only) ────────────────────────────────────────────────
router.get("/admin/all", protect, admin, getAdminTickets);
router.get("/admin/agents", protect, admin, getAdminAgents);
router.put("/admin/:id/status", protect, admin, updateTicketStatus);
router.put("/admin/:id/assign", protect, admin, assignTicket);

// ── Shared Single Ticket Routes (Protected with Authorization Check) ─────────
router.get("/:id", protect, getTicketById);
router.post("/:id/messages", protect, addMessage);

export default router;
