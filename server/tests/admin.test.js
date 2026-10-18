import request from "supertest";
import app from "../app.js";
import Product from "../models/Product.js";
import User from "../models/User.js";
import Order from "../models/Order.js";
import generateToken from "../utils/generateToken.js";

describe("Admin & Dashboard Endpoints", () => {
  let adminToken;
  let adminUser;

  beforeAll(async () => {
    await User.deleteMany({});
    adminUser = await User.create({
      name: "Admin User",
      email: "admin_cleanup@example.com",
      password: "password123",
      role: "admin",
    });
    adminToken = generateToken(adminUser._id);
  });

  beforeEach(async () => {
    await Product.deleteMany({});
    await Order.deleteMany({});

    await Product.create([
      { name: "Nordic Lounge Chair", category: "Sofas & Seating", price: 15999, stock: 4, brand: "Furniva" },
      { name: "Kyoto Teak Coffee Table", category: "Tables & Desks", price: 9999, stock: 10, brand: "Furniva" },
    ]);
  });

  it("should get all products via /api/admin/products", async () => {
    const res = await request(app)
      .get("/api/admin/products")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.products).toHaveLength(2);
    expect(res.body.total).toBe(2);
  });

  it("should create, update, and delete a product via /api/admin/products", async () => {
    // 1. Create
    const createRes = await request(app)
      .post("/api/admin/products")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        name: "Berlin Minimalist Bookshelf",
        category: "Storage & Cabinets",
        price: 18499,
        stock: 7,
        brand: "Furniva",
      });

    expect(createRes.status).toBe(201);
    expect(createRes.body).toHaveProperty("_id");
    const newId = createRes.body._id;

    // 2. Update
    const updateRes = await request(app)
      .put(`/api/admin/products/${newId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ price: 17499 });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.price).toBe(17499);

    // 3. Delete
    const deleteRes = await request(app)
      .delete(`/api/admin/products/${newId}`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(deleteRes.status).toBe(200);
    expect(deleteRes.body.message).toBe("Product deleted");
  });

  it("should return continuous 7-day timeline and correct stats in dashboard", async () => {
    const product = await Product.findOne({ name: "Nordic Lounge Chair" });

    // Create 1 delivered order and 1 cancelled order
    await Order.create({
      user: adminUser._id,
      items: [{ product: product._id, name: product.name, price: product.price, quantity: 1 }],
      shippingAddress: {
        fullName: "Test User",
        phone: "9876543210",
        addressLine1: "123 Street",
        city: "Bangalore",
        state: "Karnataka",
        pincode: "560001",
      },
      paymentMethod: "COD",
      itemsTotal: 15999,
      deliveryFee: 0,
      totalAmount: 15999,
      status: "Delivered",
      isPaid: true,
    });

    await Order.create({
      user: adminUser._id,
      items: [{ product: product._id, name: product.name, price: product.price, quantity: 1 }],
      shippingAddress: {
        fullName: "Cancelled User",
        phone: "9876543210",
        addressLine1: "123 Street",
        city: "Bangalore",
        state: "Karnataka",
        pincode: "560001",
      },
      paymentMethod: "COD",
      itemsTotal: 15999,
      deliveryFee: 0,
      totalAmount: 15999,
      status: "Cancelled",
    });

    const res = await request(app)
      .get("/api/admin/dashboard")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.metrics.totalSales).toBe(15999);
    expect(res.body.metrics.avgOrderValue).toBe(15999); // Based on 1 non-cancelled order, not 2
    expect(res.body.dailySales).toHaveLength(7); // Full continuous 7-day timeline
  });

  it("should require reason when overriding online order payment", async () => {
    const product = await Product.findOne({ name: "Nordic Lounge Chair" });

    const onlineOrder = await Order.create({
      user: adminUser._id,
      items: [{ product: product._id, name: product.name, price: product.price, quantity: 1 }],
      shippingAddress: {
        fullName: "Online User",
        phone: "9876543210",
        addressLine1: "123 Street",
        city: "Bangalore",
        state: "Karnataka",
        pincode: "560001",
      },
      paymentMethod: "ONLINE",
      itemsTotal: 15999,
      deliveryFee: 0,
      totalAmount: 15999,
      status: "Placed",
      isPaid: false,
    });

    // 1. Without reason -> 400
    const failRes = await request(app)
      .put(`/api/admin/orders/${onlineOrder._id}/pay`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({});

    expect(failRes.status).toBe(400);
    expect(failRes.body.message).toContain("Reason is required");

    // 2. With reason -> 200
    const passRes = await request(app)
      .put(`/api/admin/orders/${onlineOrder._id}/pay`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ reason: "Bank reconciliation verified manually" });

    expect(passRes.status).toBe(200);
    expect(passRes.body.isPaid).toBe(true);
  });
});
