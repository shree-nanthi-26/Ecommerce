import Ticket from "../models/Ticket.js";
import User from "../models/User.js";
import Notification from "../models/Notification.js";

// Generate unique human-readable ticket number (e.g. TK-839201-412)
function generateTicketNumber() {
  const timeSlice = Date.now().toString().slice(-6);
  const randomSuffix = Math.floor(100 + Math.random() * 900);
  return `TK-${timeSlice}-${randomSuffix}`;
}

/**
 * Customer: Create a new support ticket
 * POST /api/tickets
 */
export async function createTicket(req, res, next) {
  try {
    const { subject, category, message, attachments, orderId, priority } = req.body;

    if (!subject || !subject.trim()) {
      res.status(400);
      throw new Error("Subject is required");
    }

    const validCategories = ["Order", "Payment", "Delivery", "Product", "Return", "Other"];
    if (!category || !validCategories.includes(category)) {
      res.status(400);
      throw new Error("Valid category is required (Order, Payment, Delivery, Product, Return, Other)");
    }

    if (!message || !message.trim()) {
      res.status(400);
      throw new Error("Message content is required");
    }

    const ticketNumber = generateTicketNumber();

    const formattedAttachments = Array.isArray(attachments)
      ? attachments
          .filter((att) => att && (att.url || typeof att === "string"))
          .map((att) => ({
            url: typeof att === "string" ? att : att.url,
            publicId: att.publicId || null,
            name: att.name || "Attachment",
          }))
      : [];

    const initialMessage = {
      sender: req.user._id,
      senderRole: "customer",
      senderName: req.user.name,
      senderEmail: req.user.email,
      message: message.trim(),
      attachments: formattedAttachments,
    };

    const ticket = await Ticket.create({
      ticketNumber,
      user: req.user._id,
      subject: subject.trim(),
      category,
      priority: priority && ["Low", "Medium", "High", "Urgent"].includes(priority) ? priority : "Medium",
      status: "Open",
      orderId: orderId ? String(orderId).trim() : null,
      messages: [initialMessage],
      lastMessageAt: new Date(),
    });

    // Notify customer that ticket has been registered
    try {
      await Notification.create({
        user: req.user._id,
        type: "support_ticket",
        title: `Support Ticket Created (#${ticketNumber})`,
        message: `Your ticket regarding "${subject.trim().slice(0, 50)}" has been received. Our team will review and respond shortly.`,
        link: `/support?ticket=${ticketNumber}`,
        metadata: { ticketId: ticket._id, ticketNumber },
      });
    } catch (notifErr) {
      console.error("Failed to create ticket confirmation notification:", notifErr);
    }

    const populated = await Ticket.findById(ticket._id)
      .populate("user", "name email")
      .populate("assignedTo", "name email");

    res.status(201).json(populated);
  } catch (error) {
    next(error);
  }
}

/**
 * Customer: Get all tickets created by the logged-in user
 * GET /api/tickets/my
 */
export async function getMyTickets(req, res, next) {
  try {
    const { status, category, search } = req.query;
    const filter = { user: req.user._id };

    if (status && status !== "All") {
      filter.status = status;
    }

    if (category && category !== "All") {
      filter.category = category;
    }

    if (search && search.trim()) {
      const q = search.trim();
      const regex = new RegExp(q, "i");
      filter.$or = [{ ticketNumber: regex }, { subject: regex }, { orderId: regex }];
    }

    const tickets = await Ticket.find(filter)
      .sort({ lastMessageAt: -1 })
      .populate("assignedTo", "name email")
      .lean();

    res.json(tickets);
  } catch (error) {
    next(error);
  }
}

/**
 * Customer or Admin: Get single ticket details with complete message thread
 * GET /api/tickets/:id
 */
export async function getTicketById(req, res, next) {
  try {
    const { id } = req.params;

    // Support query by Mongo ID or ticketNumber
    const query = id.startsWith("TK-") ? { ticketNumber: id } : { _id: id };
    const ticket = await Ticket.findOne(query)
      .populate("user", "name email createdAt")
      .populate("assignedTo", "name email");

    if (!ticket) {
      res.status(404);
      throw new Error("Support ticket not found");
    }

    // Authorization check: Customer can only view their own ticket, Admin can view all
    const isOwner = ticket.user && ticket.user._id.equals(req.user._id);
    const isAdmin = req.user.role === "admin";

    if (!isOwner && !isAdmin) {
      res.status(403);
      throw new Error("Access denied: You are not authorized to view this ticket");
    }

    res.json(ticket);
  } catch (error) {
    next(error);
  }
}

/**
 * Customer or Admin: Add a reply message to an existing ticket
 * POST /api/tickets/:id/messages
 */
export async function addMessage(req, res, next) {
  try {
    const { id } = req.params;
    const { message, attachments, newStatus } = req.body;

    if ((!message || !message.trim()) && (!attachments || attachments.length === 0)) {
      res.status(400);
      throw new Error("Message text or at least one attachment is required");
    }

    const query = id.startsWith("TK-") ? { ticketNumber: id } : { _id: id };
    const ticket = await Ticket.findOne(query).populate("user", "name email");

    if (!ticket) {
      res.status(404);
      throw new Error("Ticket not found");
    }

    const isOwner = ticket.user && ticket.user._id.equals(req.user._id);
    const isAdmin = req.user.role === "admin";

    if (!isOwner && !isAdmin) {
      res.status(403);
      throw new Error("Access denied: You are not authorized to reply to this ticket");
    }

    const senderRole = isAdmin ? "admin" : "customer";

    const formattedAttachments = Array.isArray(attachments)
      ? attachments
          .filter((att) => att && (att.url || typeof att === "string"))
          .map((att) => ({
            url: typeof att === "string" ? att : att.url,
            publicId: att.publicId || null,
            name: att.name || "Attachment",
          }))
      : [];

    const newMessage = {
      sender: req.user._id,
      senderRole,
      senderName: req.user.name,
      senderEmail: req.user.email,
      message: message ? message.trim() : "",
      attachments: formattedAttachments,
    };

    ticket.messages.push(newMessage);
    ticket.lastMessageAt = new Date();

    // Status transitions
    if (isAdmin) {
      // Admin reply
      if (newStatus && ["Open", "In Progress", "Waiting for Customer", "Resolved", "Closed"].includes(newStatus)) {
        ticket.status = newStatus;
        if (newStatus === "Closed") ticket.closedAt = new Date();
      } else if (ticket.status === "Open" || ticket.status === "In Progress") {
        ticket.status = "Waiting for Customer";
      }

      // Automatically assign to replying admin if ticket was unassigned
      if (!ticket.assignedTo) {
        ticket.assignedTo = req.user._id;
      }

      // Notify customer of agent response
      try {
        await Notification.create({
          user: ticket.user._id,
          type: "support_ticket",
          title: `Reply on Ticket #${ticket.ticketNumber}`,
          message: `${req.user.name} from Furniva Support replied: "${(message || "New attachment added").slice(0, 80)}"`,
          link: `/support?ticket=${ticket.ticketNumber}`,
          metadata: { ticketId: ticket._id, ticketNumber: ticket.ticketNumber },
        });
      } catch (notifErr) {
        console.error("Failed to notify user on admin reply:", notifErr);
      }
    } else {
      // Customer reply
      if (ticket.status === "Waiting for Customer" || ticket.status === "Resolved" || ticket.status === "Closed") {
        ticket.status = "In Progress";
        ticket.closedAt = null;
      }
    }

    await ticket.save();

    const updated = await Ticket.findById(ticket._id)
      .populate("user", "name email")
      .populate("assignedTo", "name email");

    res.json(updated);
  } catch (error) {
    next(error);
  }
}

/**
 * Admin: Get all tickets with filtering, pagination & status metrics
 * GET /api/tickets/admin/all
 */
export async function getAdminTickets(req, res, next) {
  try {
    const { status, category, priority, assignedTo, search, page = 1, limit = 20 } = req.query;
    const filter = {};

    if (status && status !== "All") {
      filter.status = status;
    }

    if (category && category !== "All") {
      filter.category = category;
    }

    if (priority && priority !== "All") {
      filter.priority = priority;
    }

    if (assignedTo && assignedTo !== "All") {
      if (assignedTo === "unassigned") {
        filter.assignedTo = null;
      } else {
        filter.assignedTo = assignedTo;
      }
    }

    if (search && search.trim()) {
      const q = search.trim();
      const regex = new RegExp(q, "i");
      filter.$or = [{ ticketNumber: regex }, { subject: regex }, { orderId: regex }];
    }

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;

    const [tickets, totalFiltered, counts] = await Promise.all([
      Ticket.find(filter)
        .sort({ lastMessageAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .populate("user", "name email")
        .populate("assignedTo", "name email")
        .lean(),
      Ticket.countDocuments(filter),
      Ticket.aggregate([
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    const stats = {
      total: 0,
      open: 0,
      inProgress: 0,
      waitingForCustomer: 0,
      resolved: 0,
      closed: 0,
    };

    counts.forEach((item) => {
      stats.total += item.count;
      if (item._id === "Open") stats.open = item.count;
      if (item._id === "In Progress") stats.inProgress = item.count;
      if (item._id === "Waiting for Customer") stats.waitingForCustomer = item.count;
      if (item._id === "Resolved") stats.resolved = item.count;
      if (item._id === "Closed") stats.closed = item.count;
    });

    res.json({
      tickets,
      stats,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: totalFiltered,
        totalPages: Math.ceil(totalFiltered / limitNum),
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Admin: Update ticket status
 * PUT /api/tickets/admin/:id/status
 */
export async function updateTicketStatus(req, res, next) {
  try {
    const { id } = req.params;
    const { status, note } = req.body;

    const validStatuses = ["Open", "In Progress", "Waiting for Customer", "Resolved", "Closed"];
    if (!status || !validStatuses.includes(status)) {
      res.status(400);
      throw new Error(`Valid status is required (${validStatuses.join(", ")})`);
    }

    const query = id.startsWith("TK-") ? { ticketNumber: id } : { _id: id };
    const ticket = await Ticket.findOne(query).populate("user", "name email");

    if (!ticket) {
      res.status(404);
      throw new Error("Ticket not found");
    }

    const oldStatus = ticket.status;
    ticket.status = status;
    ticket.lastMessageAt = new Date();

    if (status === "Closed") {
      ticket.closedAt = new Date();
    } else {
      ticket.closedAt = null;
    }

    // Add optional status change note to messages thread
    if (note && note.trim()) {
      ticket.messages.push({
        sender: req.user._id,
        senderRole: "admin",
        senderName: req.user.name,
        senderEmail: req.user.email,
        message: `[Status changed from ${oldStatus} to ${status}]: ${note.trim()}`,
        attachments: [],
      });
    }

    await ticket.save();

    // Notify customer
    try {
      await Notification.create({
        user: ticket.user._id,
        type: "support_ticket",
        title: `Ticket #${ticket.ticketNumber} Status: ${status}`,
        message: `Your support ticket #${ticket.ticketNumber} is now marked as "${status}".`,
        link: `/support?ticket=${ticket.ticketNumber}`,
        metadata: { ticketId: ticket._id, ticketNumber: ticket.ticketNumber, status },
      });
    } catch (notifErr) {
      console.error("Failed to notify user on status change:", notifErr);
    }

    const updated = await Ticket.findById(ticket._id)
      .populate("user", "name email")
      .populate("assignedTo", "name email");

    res.json(updated);
  } catch (error) {
    next(error);
  }
}

/**
 * Admin: Assign ticket to an admin agent
 * PUT /api/tickets/admin/:id/assign
 */
export async function assignTicket(req, res, next) {
  try {
    const { id } = req.params;
    const { assignedTo } = req.body; // User ID or null to unassign

    const query = id.startsWith("TK-") ? { ticketNumber: id } : { _id: id };
    const ticket = await Ticket.findOne(query);

    if (!ticket) {
      res.status(404);
      throw new Error("Ticket not found");
    }

    if (assignedTo) {
      const agent = await User.findById(assignedTo);
      if (!agent || agent.role !== "admin") {
        res.status(400);
        throw new Error("Assignee must be a registered administrative user");
      }
      ticket.assignedTo = agent._id;
    } else {
      ticket.assignedTo = null;
    }

    ticket.lastMessageAt = new Date();
    await ticket.save();

    const updated = await Ticket.findById(ticket._id)
      .populate("user", "name email")
      .populate("assignedTo", "name email");

    res.json(updated);
  } catch (error) {
    next(error);
  }
}

/**
 * Admin: Get list of admin users to populate agent assignment dropdown
 * GET /api/tickets/admin/agents
 */
export async function getAdminAgents(req, res, next) {
  try {
    const agents = await User.find({ role: "admin" })
      .select("name email role createdAt")
      .sort({ name: 1 })
      .lean();

    res.json(agents);
  } catch (error) {
    next(error);
  }
}
