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

  it("should create a COD order successfully", async () => {
    const res = await request(app)
      .post("/api/orders")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({
        items: [{ product: p1._id, quantity: 2 }],
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

    expect(res.status).toBe(201);
    expect(res.body.paymentMethod).toBe("COD");
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
