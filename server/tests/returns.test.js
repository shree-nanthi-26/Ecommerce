import request from "supertest";
import app from "../app.js";
import Order from "../models/Order.js";
import Product from "../models/Product.js";
import Return from "../models/Return.js";
import User from "../models/User.js";
import generateToken from "../utils/generateToken.js";

describe("Order Cancellation & Returns System", () => {
  let customerUser;
  let customerToken;
  let otherUser;
  let otherToken;
  let adminUser;
  let adminToken;
  let product;

  beforeAll(async () => {
    await User.deleteMany({});
    customerUser = await User.create({
      name: "Customer One",
      email: "cust1@example.com",
      password: "password123",
      role: "customer",
    });
    customerToken = generateToken(customerUser._id);

    otherUser = await User.create({
      name: "Customer Two",
      email: "cust2@example.com",
      password: "password123",
      role: "customer",
    });
    otherToken = generateToken(otherUser._id);

    adminUser = await User.create({
      name: "Admin User",
      email: "admin@example.com",
      password: "password123",
      role: "admin",
    });
    adminToken = generateToken(adminUser._id);
  });

  beforeEach(async () => {
    await Product.deleteMany({});
    await Order.deleteMany({});
    await Return.deleteMany({});

    product = await Product.create({
      name: "Nordic Lounge Chair",
      category: "Chairs",
      price: 12999,
      stock: 10,
    });
  });

  describe("POST /api/orders/:id/cancel (Order Cancellation)", () => {
    it("should cancel an eligible order in 'Placed' status and restore stock", async () => {
      const order = await Order.create({
        user: customerUser._id,
        items: [{ product: product._id, name: product.name, price: 12999, quantity: 2 }],
        shippingAddress: { fullName: "Customer One", phone: "9876543210", addressLine1: "123 Main St", city: "Bangalore", state: "Karnataka", pincode: "560001" },
        itemsTotal: 25998,
        totalAmount: 25998,
        status: "Placed",
      });

      // Stock was reduced when ordered (simulated at 8)
      await Product.findByIdAndUpdate(product._id, { stock: 8 });

      const res = await request(app)
        .post(`/api/orders/${order._id}/cancel`)
        .set("Authorization", `Bearer ${customerToken}`)
        .send({ reason: "Found a better deal elsewhere" });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe("Cancelled");
      expect(res.body.data.cancellationReason).toBe("Found a better deal elsewhere");

      // Verify stock restored back to 10
      const updatedProduct = await Product.findById(product._id);
      expect(updatedProduct.stock).toBe(10);
    });

    it("should reject cancellation for 'Shipped' or 'Delivered' orders", async () => {
      const order = await Order.create({
        user: customerUser._id,
        items: [{ product: product._id, name: product.name, price: 12999, quantity: 1 }],
        shippingAddress: { fullName: "Customer One", phone: "9876543210", addressLine1: "123 Main St", city: "Bangalore", state: "Karnataka", pincode: "560001" },
        itemsTotal: 12999,
        totalAmount: 12999,
        status: "Shipped",
      });

      const res = await request(app)
        .post(`/api/orders/${order._id}/cancel`)
        .set("Authorization", `Bearer ${customerToken}`)
        .send({ reason: "Changed my mind" });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/cannot be cancelled because it is already Shipped/i);
    });

    it("should reject cancellation if another customer attempts to cancel", async () => {
      const order = await Order.create({
        user: customerUser._id,
        items: [{ product: product._id, name: product.name, price: 12999, quantity: 1 }],
        shippingAddress: { fullName: "Customer One", phone: "9876543210", addressLine1: "123 Main St", city: "Bangalore", state: "Karnataka", pincode: "560001" },
        itemsTotal: 12999,
        totalAmount: 12999,
        status: "Placed",
      });

      const res = await request(app)
        .post(`/api/orders/${order._id}/cancel`)
        .set("Authorization", `Bearer ${otherToken}`)
        .send({ reason: "Unauthorized attempt" });

      expect(res.status).toBe(403);
    });
  });

  describe("POST /api/returns (Product Return Request)", () => {
    it("should create a return request for a Delivered order", async () => {
      const order = await Order.create({
        user: customerUser._id,
        items: [{ product: product._id, name: product.name, price: 12999, quantity: 1 }],
        shippingAddress: { fullName: "Customer One", phone: "9876543210", addressLine1: "123 Main St", city: "Bangalore", state: "Karnataka", pincode: "560001" },
        itemsTotal: 12999,
        totalAmount: 12999,
        status: "Delivered",
      });

      const res = await request(app)
        .post("/api/returns")
        .set("Authorization", `Bearer ${customerToken}`)
        .send({
          orderId: order._id,
          reason: "Damaged product",
          description: "There is a crack along the armrest upon unboxing.",
          images: [{ url: "https://res.cloudinary.com/test/image/upload/v123/damage.jpg" }],
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe("Requested");
      expect(res.body.data.reason).toBe("Damaged product");
      expect(res.body.data.images.length).toBe(1);
    });

    it("should reject return request if order is not Delivered", async () => {
      const order = await Order.create({
        user: customerUser._id,
        items: [{ product: product._id, name: product.name, price: 12999, quantity: 1 }],
        shippingAddress: { fullName: "Customer One", phone: "9876543210", addressLine1: "123 Main St", city: "Bangalore", state: "Karnataka", pincode: "560001" },
        itemsTotal: 12999,
        totalAmount: 12999,
        status: "Placed",
      });

      const res = await request(app)
        .post("/api/returns")
        .set("Authorization", `Bearer ${customerToken}`)
        .send({
          orderId: order._id,
          reason: "Wrong product",
          description: "Not delivered yet",
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/Returns can only be requested for Delivered orders/i);
    });

    it("should reject return with invalid reason enum", async () => {
      const order = await Order.create({
        user: customerUser._id,
        items: [{ product: product._id, name: product.name, price: 12999, quantity: 1 }],
        shippingAddress: { fullName: "Customer One", phone: "9876543210", addressLine1: "123 Main St", city: "Bangalore", state: "Karnataka", pincode: "560001" },
        itemsTotal: 12999,
        totalAmount: 12999,
        status: "Delivered",
      });

      const res = await request(app)
        .post("/api/returns")
        .set("Authorization", `Bearer ${customerToken}`)
        .send({
          orderId: order._id,
          reason: "Invalid Reason Not In Enum",
          description: "Reason description",
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/valid return reason/i);
    });
  });

  describe("GET /api/returns/my & GET /api/returns/order/:orderId", () => {
    it("should get customer returns list and return details by order ID", async () => {
      const order = await Order.create({
        user: customerUser._id,
        items: [{ product: product._id, name: product.name, price: 12999, quantity: 1 }],
        shippingAddress: { fullName: "Customer One", phone: "9876543210", addressLine1: "123 Main St", city: "Bangalore", state: "Karnataka", pincode: "560001" },
        itemsTotal: 12999,
        totalAmount: 12999,
        status: "Delivered",
      });

      await Return.create({
        order: order._id,
        user: customerUser._id,
        items: order.items,
        reason: "Wrong product",
        description: "Received grey instead of blue",
        status: "Under Review",
      });

      const myReturnsRes = await request(app)
        .get("/api/returns/my")
        .set("Authorization", `Bearer ${customerToken}`);

      expect(myReturnsRes.status).toBe(200);
      expect(myReturnsRes.body.count).toBe(1);
      expect(myReturnsRes.body.data[0].reason).toBe("Wrong product");

      const orderReturnRes = await request(app)
        .get(`/api/returns/order/${order._id}`)
        .set("Authorization", `Bearer ${customerToken}`);

      expect(orderReturnRes.status).toBe(200);
      expect(orderReturnRes.body.data.status).toBe("Under Review");
    });
  });

  describe("Admin Return Management", () => {
    let order;
    let returnDoc;

    beforeEach(async () => {
      order = await Order.create({
        user: customerUser._id,
        items: [{ product: product._id, name: product.name, price: 12999, quantity: 1 }],
        shippingAddress: { fullName: "Customer One", phone: "9876543210", addressLine1: "123 Main St", city: "Bangalore", state: "Karnataka", pincode: "560001" },
        itemsTotal: 12999,
        totalAmount: 12999,
        status: "Delivered",
      });

      returnDoc = await Return.create({
        order: order._id,
        user: customerUser._id,
        items: order.items,
        reason: "Damaged product",
        description: "Broken leg",
        status: "Requested",
        refundAmount: 12999,
      });
    });

    it("should allow admin to view all return requests", async () => {
      const res = await request(app)
        .get("/api/returns/admin/all")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.count).toBe(1);
      expect(res.body.data[0].reason).toBe("Damaged product");
    });

    it("should prevent non-admin from accessing admin return endpoints", async () => {
      const res = await request(app)
        .get("/api/returns/admin/all")
        .set("Authorization", `Bearer ${customerToken}`);

      expect(res.status).toBe(403);
    });

    it("should allow admin to update return status, add notes, and record status history", async () => {
      const res = await request(app)
        .put(`/api/returns/admin/${returnDoc._id}/status`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          status: "Approved",
          adminNotes: "Customer evidence verified. Replacement or refund authorized.",
          comment: "Approved by Admin Support",
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe("Approved");
      expect(res.body.data.adminNotes).toContain("Customer evidence verified");
      expect(res.body.data.statusHistory.length).toBeGreaterThan(0);
      expect(res.body.data.statusHistory[res.body.data.statusHistory.length - 1].status).toBe("Approved");
    });

    it("should support advancing through stages: Pickup Scheduled -> Returned -> Refund Initiated -> Completed", async () => {
      // 1. Pickup Scheduled
      const step1 = await request(app)
        .put(`/api/returns/admin/${returnDoc._id}/status`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          status: "Pickup Scheduled",
          pickupDate: new Date(Date.now() + 86400000),
          comment: "Courier assigned for reverse pickup",
        });
      expect(step1.status).toBe(200);
      expect(step1.body.data.status).toBe("Pickup Scheduled");

      // 2. Returned
      const step2 = await request(app)
        .put(`/api/returns/admin/${returnDoc._id}/status`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          status: "Returned",
          comment: "Product received at warehouse and inspection passed",
        });
      expect(step2.status).toBe(200);
      expect(step2.body.data.status).toBe("Returned");

      // 3. Refund Initiated
      const step3 = await request(app)
        .put(`/api/returns/admin/${returnDoc._id}/status`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          status: "Refund Initiated",
          refundStatus: "Processed",
          refundAmount: 12999,
          comment: "Refund credited to original payment source",
        });
      expect(step3.status).toBe(200);
      expect(step3.body.data.status).toBe("Refund Initiated");
      expect(step3.body.data.refundStatus).toBe("Processed");

      // 4. Completed
      const step4 = await request(app)
        .put(`/api/returns/admin/${returnDoc._id}/status`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          status: "Completed",
          comment: "Return and refund lifecycle completed",
        });
      expect(step4.status).toBe(200);
      expect(step4.body.data.status).toBe("Completed");
    });
  });
});
