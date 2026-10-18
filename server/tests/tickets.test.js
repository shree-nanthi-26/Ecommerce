import request from "supertest";
import app from "../app.js";
import Ticket from "../models/Ticket.js";
import User from "../models/User.js";
import generateToken from "../utils/generateToken.js";

describe("Support Ticket System", () => {
  let customerUser;
  let customerToken;
  let otherUser;
  let otherToken;
  let adminUser;
  let adminToken;
  let adminAgent;

  beforeAll(async () => {
    await User.deleteMany({});

    customerUser = await User.create({
      name: "Alice Customer",
      email: "alice@example.com",
      password: "password123",
      role: "customer",
    });
    customerToken = generateToken(customerUser._id);

    otherUser = await User.create({
      name: "Bob Intruder",
      email: "bob@example.com",
      password: "password123",
      role: "customer",
    });
    otherToken = generateToken(otherUser._id);

    adminUser = await User.create({
      name: "Super Admin",
      email: "admin@furniva.com",
      password: "password123",
      role: "admin",
    });
    adminToken = generateToken(adminUser._id);

    adminAgent = await User.create({
      name: "Agent Sarah",
      email: "sarah@furniva.com",
      password: "password123",
      role: "admin",
    });
  });

  beforeEach(async () => {
    await Ticket.deleteMany({});
  });

  describe("Customer Ticket Creation (POST /api/tickets)", () => {
    it("should allow an authenticated customer to create a ticket", async () => {
      const res = await request(app)
        .post("/api/tickets")
        .set("Authorization", `Bearer ${customerToken}`)
        .send({
          subject: "Damaged leg on dining table delivery",
          category: "Delivery",
          message: "The courier delivered the dining table today but one leg has a scratch.",
          attachments: [{ url: "https://example.com/damage.jpg", name: "damage.jpg" }],
          priority: "High",
        });

      expect(res.status).toBe(201);
      expect(res.body.ticketNumber).toMatch(/^TK-/);
      expect(res.body.status).toBe("Open");
      expect(res.body.category).toBe("Delivery");
      expect(res.body.subject).toBe("Damaged leg on dining table delivery");
      expect(res.body.messages).toHaveLength(1);
      expect(res.body.messages[0].senderRole).toBe("customer");
      expect(res.body.messages[0].attachments).toHaveLength(1);
    });

    it("should reject ticket creation without required fields", async () => {
      const res = await request(app)
        .post("/api/tickets")
        .set("Authorization", `Bearer ${customerToken}`)
        .send({
          subject: "",
          category: "InvalidCategory",
          message: "",
        });

      expect(res.status).toBe(400);
    });

    it("should reject ticket creation from unauthenticated requests", async () => {
      const res = await request(app)
        .post("/api/tickets")
        .send({
          subject: "Help please",
          category: "Order",
          message: "Please help",
        });

      expect(res.status).toBe(401);
    });
  });

  describe("Customer Ticket History (GET /api/tickets/my)", () => {
    it("should return only tickets belonging to the authenticated customer", async () => {
      await Ticket.create({
        ticketNumber: "TK-111111-111",
        user: customerUser._id,
        subject: "Alice inquiry",
        category: "Order",
        status: "Open",
        messages: [{
          sender: customerUser._id,
          senderRole: "customer",
          senderName: customerUser.name,
          message: "Hello Alice",
        }],
      });

      await Ticket.create({
        ticketNumber: "TK-222222-222",
        user: otherUser._id,
        subject: "Bob inquiry",
        category: "Payment",
        status: "Resolved",
        messages: [{
          sender: otherUser._id,
          senderRole: "customer",
          senderName: otherUser.name,
          message: "Hello Bob",
        }],
      });

      const res = await request(app)
        .get("/api/tickets/my")
        .set("Authorization", `Bearer ${customerToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
      expect(res.body[0].ticketNumber).toBe("TK-111111-111");
    });
  });

  describe("Authorization & Data Protection (GET /api/tickets/:id)", () => {
    it("should forbid customer B from accessing customer A's ticket", async () => {
      const ticket = await Ticket.create({
        ticketNumber: "TK-333333-333",
        user: customerUser._id,
        subject: "Private Alice Issue",
        category: "Product",
        status: "Open",
        messages: [{
          sender: customerUser._id,
          senderRole: "customer",
          senderName: customerUser.name,
          message: "Secret note",
        }],
      });

      const res = await request(app)
        .get(`/api/tickets/${ticket._id}`)
        .set("Authorization", `Bearer ${otherToken}`);

      expect(res.status).toBe(403);
      expect(res.body.message).toContain("Access denied");
    });

    it("should allow customer A to access their own ticket", async () => {
      const ticket = await Ticket.create({
        ticketNumber: "TK-444444-444",
        user: customerUser._id,
        subject: "My Table Query",
        category: "Product",
        status: "Open",
        messages: [{
          sender: customerUser._id,
          senderRole: "customer",
          senderName: customerUser.name,
          message: "My query",
        }],
      });

      const res = await request(app)
        .get(`/api/tickets/${ticket._id}`)
        .set("Authorization", `Bearer ${customerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.ticketNumber).toBe("TK-444444-444");
    });

    it("should allow admin to view any customer ticket", async () => {
      const ticket = await Ticket.create({
        ticketNumber: "TK-555555-555",
        user: customerUser._id,
        subject: "Alice Ticket",
        category: "Return",
        status: "Open",
        messages: [{
          sender: customerUser._id,
          senderRole: "customer",
          senderName: customerUser.name,
          message: "Need return",
        }],
      });

      const res = await request(app)
        .get(`/api/tickets/${ticket._id}`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.ticketNumber).toBe("TK-555555-555");
    });
  });

  describe("Ticket Replies (POST /api/tickets/:id/messages)", () => {
    it("should allow customer to reply and transition status from Waiting for Customer to In Progress", async () => {
      const ticket = await Ticket.create({
        ticketNumber: "TK-666666-666",
        user: customerUser._id,
        subject: "Fabric question",
        category: "Product",
        status: "Waiting for Customer",
        messages: [{
          sender: customerUser._id,
          senderRole: "customer",
          senderName: customerUser.name,
          message: "Initial query",
        }],
      });

      const res = await request(app)
        .post(`/api/tickets/${ticket._id}/messages`)
        .set("Authorization", `Bearer ${customerToken}`)
        .send({
          message: "Here are the additional dimensions you requested: 120cm.",
        });

      expect(res.status).toBe(200);
      expect(res.body.messages).toHaveLength(2);
      expect(res.body.status).toBe("In Progress");
    });

    it("should allow admin to reply and update status to Waiting for Customer", async () => {
      const ticket = await Ticket.create({
        ticketNumber: "TK-777777-777",
        user: customerUser._id,
        subject: "Order delay",
        category: "Order",
        status: "Open",
        messages: [{
          sender: customerUser._id,
          senderRole: "customer",
          senderName: customerUser.name,
          message: "When will it ship?",
        }],
      });

      const res = await request(app)
        .post(`/api/tickets/${ticket._id}/messages`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          message: "Your order is scheduled for dispatch tomorrow morning.",
          newStatus: "Waiting for Customer",
        });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe("Waiting for Customer");
      expect(res.body.messages[1].senderRole).toBe("admin");
      expect(res.body.assignedTo).toBeDefined();
    });
  });

  describe("Admin Management (GET, PUT /api/tickets/admin/*)", () => {
    it("should allow admin to view all tickets with status metrics", async () => {
      await Ticket.create({
        ticketNumber: "TK-888888-881",
        user: customerUser._id,
        subject: "Ticket One",
        category: "Order",
        status: "Open",
        messages: [{ sender: customerUser._id, senderRole: "customer", senderName: "Alice", message: "m1" }],
      });
      await Ticket.create({
        ticketNumber: "TK-888888-882",
        user: otherUser._id,
        subject: "Ticket Two",
        category: "Payment",
        status: "Resolved",
        messages: [{ sender: otherUser._id, senderRole: "customer", senderName: "Bob", message: "m2" }],
      });

      const res = await request(app)
        .get("/api/tickets/admin/all")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.tickets).toHaveLength(2);
      expect(res.body.stats.open).toBe(1);
      expect(res.body.stats.resolved).toBe(1);
      expect(res.body.stats.total).toBe(2);
    });

    it("should allow admin to update ticket status to any valid status", async () => {
      const ticket = await Ticket.create({
        ticketNumber: "TK-999999-991",
        user: customerUser._id,
        subject: "Close me",
        category: "Other",
        status: "Open",
        messages: [{ sender: customerUser._id, senderRole: "customer", senderName: "Alice", message: "m" }],
      });

      const res = await request(app)
        .put(`/api/tickets/admin/${ticket._id}/status`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ status: "Resolved", note: "Issue resolved via phone call." });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe("Resolved");
    });

    it("should allow admin to assign a ticket to an admin agent", async () => {
      const ticket = await Ticket.create({
        ticketNumber: "TK-999999-992",
        user: customerUser._id,
        subject: "Assign me",
        category: "Product",
        status: "Open",
        messages: [{ sender: customerUser._id, senderRole: "customer", senderName: "Alice", message: "m" }],
      });

      const res = await request(app)
        .put(`/api/tickets/admin/${ticket._id}/assign`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ assignedTo: adminAgent._id });

      expect(res.status).toBe(200);
      expect(res.body.assignedTo._id.toString()).toBe(adminAgent._id.toString());
      expect(res.body.assignedTo.name).toBe("Agent Sarah");
    });

    it("should reject non-admin users from accessing admin routes", async () => {
      const res = await request(app)
        .get("/api/tickets/admin/all")
        .set("Authorization", `Bearer ${customerToken}`);

      expect(res.status).toBe(403);
    });
  });
});
