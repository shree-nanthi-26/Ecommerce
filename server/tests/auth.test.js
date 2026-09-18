import request from "supertest";
import app from "../app.js";
import User from "../models/User.js";

describe("Auth Endpoints", () => {
  beforeEach(async () => {
    await User.deleteMany({});
  });

  it("should register a new user successfully", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({
        name: "Test Customer",
        email: "customer@example.com",
        password: "password123",
      });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("token");
    expect(res.body.email).toBe("customer@example.com");
  });

  it("should return 400 for duplicate registration email", async () => {
    await User.create({
      name: "Test Customer",
      email: "customer@example.com",
      password: "password123",
    });

    const res = await request(app)
      .post("/api/auth/register")
      .send({
        name: "Another Customer",
        email: "customer@example.com",
        password: "password123",
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toContain("already exists");
  });

  it("should login successfully with correct credentials", async () => {
    await User.create({
      name: "Test Customer",
      email: "customer@example.com",
      password: "password123",
    });

    const res = await request(app)
      .post("/api/auth/login")
      .send({
        email: "customer@example.com",
        password: "password123",
      });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("token");
  });

  it("should return 401 for incorrect password on login", async () => {
    await User.create({
      name: "Test Customer",
      email: "customer@example.com",
      password: "password123",
    });

    const res = await request(app)
      .post("/api/auth/login")
      .send({
        email: "customer@example.com",
        password: "wrongpassword",
      });

    expect(res.status).toBe(401);
  });

  it("should return 401 for protected route when no token is provided", async () => {
    const res = await request(app).get("/api/auth/me");
    expect(res.status).toBe(401);
  });
});
