import request from "supertest";
import app from "../app.js";
import Product from "../models/Product.js";
import User from "../models/User.js";
import generateToken from "../utils/generateToken.js";

describe("Product Endpoints", () => {
  let adminToken;

  beforeAll(async () => {
    await User.deleteMany({});
    const adminUser = await User.create({
      name: "Admin User",
      email: "admin@example.com",
      password: "password123",
      role: "admin",
    });
    adminToken = generateToken(adminUser._id);
  });

  beforeEach(async () => {
    await Product.deleteMany({});
    await Product.create([
      { name: "Oslo 3-Seater Sofa", category: "Sofas & Seating", price: 28999, stock: 10, brand: "Furniva Atelier" },
      { name: "Verona Sectional", category: "Sofas & Seating", price: 49999, stock: 12, brand: "Furniva Atelier" },
      { name: "Windsor Dining Table", category: "Dining Furniture", price: 24999, stock: 5, brand: "Furniva Atelier" },
    ]);
  });

  it("should list all products", async () => {
    const res = await request(app).get("/api/products");
    expect(res.status).toBe(200);
    expect(res.body.products).toHaveLength(3);
  });

  it("should support page and limit pagination query params", async () => {
    const res = await request(app).get("/api/products?page=1&limit=2");
    expect(res.status).toBe(200);
    expect(res.body.products).toHaveLength(2);
    expect(res.body.page).toBe(1);
    expect(res.body.limit).toBe(2);
    expect(res.body.total).toBe(3);
    expect(res.body.totalPages).toBe(2);
  });

  it("should support category and price filtering", async () => {
    const res = await request(app).get("/api/products?category=Sofas%20%26%20Seating&minPrice=30000");
    expect(res.status).toBe(200);
    expect(res.body.products).toHaveLength(1);
    expect(res.body.products[0].name).toBe("Verona Sectional");
  });

  it("should allow admin to create a new product", async () => {
    const res = await request(app)
      .post("/api/products")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        name: "Luna Accent Lounge Chair",
        category: "Sofas & Seating",
        price: 12499,
        stock: 8,
        brand: "Furniva Studio",
      });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("_id");
    expect(res.body.name).toBe("Luna Accent Lounge Chair");
  });

  it("should allow admin to update an existing product", async () => {
    const p = await Product.findOne({ name: "Oslo 3-Seater Sofa" });
    const res = await request(app)
      .put(`/api/products/${p._id}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        price: 29999,
      });

    expect(res.status).toBe(200);
    expect(res.body.price).toBe(29999);
  });
});
