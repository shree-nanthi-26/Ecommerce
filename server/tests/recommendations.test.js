import request from "supertest";
import app from "../app.js";
import Product from "../models/Product.js";
import User from "../models/User.js";
import Order from "../models/Order.js";
import generateToken from "../utils/generateToken.js";

describe("Product Recommendation Engine Endpoints", () => {
  let user;
  let token;
  let sofa;
  let coffeeTable;
  let loungeChair;
  let diningTable;

  beforeAll(async () => {
    await User.deleteMany({});
    await Product.deleteMany({});
    await Order.deleteMany({});

    user = await User.create({
      name: "Ananya Deshmukh",
      email: "ananya.d@example.com",
      password: "password123",
      role: "customer",
    });
    token = generateToken(user._id);

    // Create a curated set of products
    [sofa, coffeeTable, loungeChair, diningTable] = await Product.create([
      {
        name: "Oslo 3-Seater Sofa",
        category: "Sofas & Seating",
        price: 28999,
        stock: 10,
        rating: 4.8,
        reviews: 24,
        brand: "Furniva Atelier",
        specs: { material: "Solid Pine", style: "Scandinavian Minimalist", roomType: "Living Room" },
      },
      {
        name: "Nordic Oak Coffee Table",
        category: "Tables & Desks",
        price: 8999,
        stock: 12,
        rating: 4.7,
        reviews: 18,
        brand: "Furniva Atelier",
        specs: { material: "Solid Oak", style: "Scandinavian Minimalist", roomType: "Living Room" },
      },
      {
        name: "Luna Accent Lounge Chair",
        category: "Sofas & Seating",
        price: 12499,
        stock: 8,
        rating: 4.9,
        reviews: 30,
        brand: "Furniva Atelier",
        specs: { material: "Solid Pine", style: "Scandinavian Minimalist", roomType: "Living Room" },
      },
      {
        name: "Windsor Solid Wood Dining Table",
        category: "Dining Furniture",
        price: 24999,
        stock: 5,
        rating: 4.8,
        reviews: 15,
        brand: "Furniva Atelier",
        specs: { material: "Solid Teak", style: "Modern Contemporary", roomType: "Dining Room" },
      },
    ]);

    // Create an order containing both Sofa and Coffee Table (co-occurrence)
    await Order.create({
      user: user._id,
      items: [
        { product: sofa._id, name: sofa.name, price: sofa.price, quantity: 1 },
        { product: coffeeTable._id, name: coffeeTable.name, price: coffeeTable.price, quantity: 1 },
      ],
      shippingAddress: {
        fullName: "Ananya Deshmukh",
        phone: "9876543210",
        addressLine1: "45 MG Road",
        city: "Pune",
        state: "Maharashtra",
        pincode: "411001",
      },
      paymentMethod: "ONLINE",
      totalAmount: 37998,
      status: "Delivered",
      isPaid: true,
    });
  });

  afterAll(async () => {
    await Order.deleteMany({});
    await Product.deleteMany({});
    await User.deleteMany({});
  });

  it("should return Frequently Bought Together bundle with complementary products", async () => {
    const res = await request(app).get(
      `/api/recommendations/product/${sofa._id}/frequently-bought-together?limit=2`
    );

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("targetProduct");
    expect(res.body.targetProduct._id.toString()).toBe(sofa._id.toString());
    expect(res.body.recommendations).toBeInstanceOf(Array);
    expect(res.body.recommendations.length).toBeGreaterThanOrEqual(1);
    // Should prioritize coffee table from order co-occurrence
    const returnedIds = res.body.recommendations.map((r) => r._id.toString());
    expect(returnedIds).toContain(coffeeTable._id.toString());
    expect(returnedIds).not.toContain(sofa._id.toString());
  });

  it("should return Customers Also Bought recommendations", async () => {
    const res = await request(app).get(
      `/api/recommendations/product/${sofa._id}/customers-also-bought?limit=3`
    );

    expect(res.status).toBe(200);
    expect(res.body).toBeInstanceOf(Array);
    expect(res.body.length).toBeGreaterThanOrEqual(1);
    const returnedIds = res.body.map((r) => r._id.toString());
    expect(returnedIds).not.toContain(sofa._id.toString());
  });

  it("should return Similar Products matching category and style", async () => {
    const res = await request(app).get(
      `/api/recommendations/product/${sofa._id}/similar?limit=3`
    );

    expect(res.status).toBe(200);
    expect(res.body).toBeInstanceOf(Array);
    // Luna Lounge Chair is in Sofas & Seating
    const chair = res.body.find((p) => p._id.toString() === loungeChair._id.toString());
    expect(chair).toBeDefined();
  });

  it("should return You May Also Like cross-category recommendations", async () => {
    const res = await request(app).get(
      `/api/recommendations/product/${sofa._id}/you-may-also-like?limit=3`
    );

    expect(res.status).toBe(200);
    expect(res.body).toBeInstanceOf(Array);
    expect(res.body.length).toBeGreaterThan(0);
    // Should include products from different categories
    const categories = res.body.map((p) => p.category);
    expect(categories.some((c) => c !== "Sofas & Seating")).toBe(true);
  });

  it("should return Personalized Recommendations for authenticated user based on past orders", async () => {
    const res = await request(app)
      .get("/api/recommendations/for-you?limit=4")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toBeInstanceOf(Array);
    expect(res.body.length).toBeGreaterThan(0);
  });
});
