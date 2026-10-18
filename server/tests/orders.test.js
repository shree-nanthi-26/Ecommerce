import request from "supertest";
import app from "../app.js";
import Order from "../models/Order.js";
import Product from "../models/Product.js";
import Coupon from "../models/Coupon.js";
import User from "../models/User.js";
import generateToken from "../utils/generateToken.js";

describe("Order Endpoints", () => {
  let customerToken;
  let p1;
  let p2;

  beforeAll(async () => {
    await User.deleteMany({});
    const user = await User.create({
      name: "Test Customer",
      email: "customer@example.com",
      password: "password123",
    });
    customerToken = generateToken(user._id);
  });

  beforeEach(async () => {
    await Product.deleteMany({});
    await Order.deleteMany({});
    await Coupon.deleteMany({});

    p1 = await Product.create({
      name: "Oslo 3-Seater Fabric Sofa",
      category: "Sofas & Seating",
      price: 28999,
      oldPrice: 34999,
      stock: 5,
    });

    p2 = await Product.create({
      name: "Verona Sectional Sofa",
      category: "Sofas & Seating",
      price: 49999,
      stock: 0,
    });

    await Coupon.create({
      code: "SAVE10",
      discountType: "percentage",
      discountValue: 10,
      minOrderValue: 1000,
      isActive: true,
    });
  });

  describe("POST /api/orders/calculate (Order Preview & Calculation)", () => {
    it("should calculate exact server totals, coupon discount, delivery fee, and savings", async () => {
      const res = await request(app)
        .post("/api/orders/calculate")
        .set("Authorization", `Bearer ${customerToken}`)
        .send({
          items: [{ product: p1._id, quantity: 1 }],
          couponCode: "SAVE10",
          deliverySpeed: "standard",
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.itemsTotal).toBe(28999);
      expect(res.body.data.discountAmount).toBe(2900); // 10% of 28999 = 2899.9 -> round to 2900
      expect(res.body.data.deliveryFee).toBe(0); // Free delivery over 999
      expect(res.body.data.totalAmount).toBe(28999 - 2900); // 26099
      expect(res.body.data.totalSavings).toBe((34999 - 28999) + 2900); // 6000 + 2900 = 8900
    });

    it("should reject calculate request for invalid coupon", async () => {
      const res = await request(app)
        .post("/api/orders/calculate")
        .set("Authorization", `Bearer ${customerToken}`)
        .send({
          items: [{ product: p1._id, quantity: 1 }],
          couponCode: "FAKE99",
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/invalid coupon/i);
    });
  });

  describe("POST /api/orders (Create Order)", () => {
    it("should create a COD order and recalculate totals on server ignoring any client tampering", async () => {
      const res = await request(app)
        .post("/api/orders")
        .set("Authorization", `Bearer ${customerToken}`)
        .send({
          items: [{ product: p1._id, quantity: 2, price: 10 }], // client trying to pass tampered price 10
          shippingAddress: {
            fullName: "Test Customer",
            phone: "9876543210",
            addressLine1: "123 Street",
            city: "Delhi",
            state: "Delhi",
            pincode: "110001",
          },
          paymentMethod: "COD",
          totalAmount: 20, // client trying to pass tampered total 20
        });

      expect(res.status).toBe(201);
      expect(res.body.paymentMethod).toBe("COD");
      // Server must calculate real price 28999 * 2 = 57998
      expect(res.body.itemsTotal).toBe(57998);
      expect(res.body.totalAmount).toBe(57998);

      const updatedP1 = await Product.findById(p1._id);
      expect(updatedP1.stock).toBe(3);
    });

    it("should return 400 for insufficient stock", async () => {
      const res = await request(app)
        .post("/api/orders")
        .set("Authorization", `Bearer ${customerToken}`)
        .send({
          items: [{ product: p2._id, quantity: 1 }],
          shippingAddress: {
            fullName: "Test Customer",
            phone: "9876543210",
            addressLine1: "123 Street",
            city: "Delhi",
            state: "Delhi",
            pincode: "110001",
          },
          paymentMethod: "COD",
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain("out of stock");
    });

    it("should return 400 for invalid coupon", async () => {
      const res = await request(app)
        .post("/api/orders")
        .set("Authorization", `Bearer ${customerToken}`)
        .send({
          items: [{ product: p1._id, quantity: 1 }],
          couponCode: "INVALIDCODE",
          shippingAddress: {
            fullName: "Test Customer",
            phone: "9876543210",
            addressLine1: "123 Street",
            city: "Delhi",
            state: "Delhi",
            pincode: "110001",
          },
          paymentMethod: "COD",
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain("Invalid coupon");
    });

    it("should return 400 for online order payment signature failure", async () => {
      const res = await request(app)
        .post("/api/orders")
        .set("Authorization", `Bearer ${customerToken}`)
        .send({
          items: [{ product: p1._id, quantity: 1 }],
          paymentMethod: "ONLINE",
          razorpayOrderId: "order_123",
          razorpayPaymentId: "pay_123",
          razorpaySignature: "invalidsignature",
          shippingAddress: {
            fullName: "Test Customer",
            phone: "9876543210",
            addressLine1: "123 Street",
            city: "Delhi",
            state: "Delhi",
            pincode: "110001",
          },
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain("signature");
    });
  });
});
