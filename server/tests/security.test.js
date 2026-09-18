import request from "supertest";
import app from "../app.js";
import BlockedIP from "../models/BlockedIP.js";
import User from "../models/User.js";
import generateToken from "../utils/generateToken.js";

describe("Security Enforcement", () => {
  let customerToken;

  beforeAll(async () => {
    await User.deleteMany({});
    const user = await User.create({
      name: "Test Customer",
      email: "customer@example.com",
      password: "password123",
      role: "customer",
    });
    customerToken = generateToken(user._id);
  });

  beforeEach(async () => {
    await BlockedIP.deleteMany({});
  });

  it("should return 403 for unauthorized admin access to admin endpoints", async () => {
    const res = await request(app)
      .get("/api/admin/dashboard")
      .set("Authorization", `Bearer ${customerToken}`);

    expect(res.status).toBe(403);
  });

  it("should return 403 for request from blocked IP", async () => {
    const testIp = "12.34.56.78";
    await BlockedIP.create({
      ip: testIp,
      isActive: true,
      reason: "Security threat detection",
    });

    const res = await request(app)
      .get("/api/products")
      .set("x-forwarded-for", testIp);

    expect(res.status).toBe(403);
    expect(res.body.message).toContain("Your IP has been blocked");
  });

  it("should include rate limit headers in API responses", async () => {
    const res = await request(app).get("/api/products");
    expect(res.headers).toHaveProperty("ratelimit-limit");
  });

  it("should block request with malicious SQLi payload in WAF detection", async () => {
    const res = await request(app)
      .get("/api/products?q=UNION SELECT username, password FROM users");

    expect(res.status).toBe(403);
    expect(res.body.message).toContain("WAF");
    expect(res.body.attackType).toBe("SQLi");
  });
});
