import request from "supertest";
import app from "../app.js";
import User from "../models/User.js";
import AuditLog from "../models/AuditLog.js";
import AttackLog from "../models/AttackLog.js";
import BlockedIP from "../models/BlockedIP.js";
import generateToken from "../utils/generateToken.js";

describe("Admin Activity & Security Dashboard APIs", () => {
  let adminUser;
  let adminToken;
  let customerUser;
  let customerToken;

  beforeAll(async () => {
    await User.deleteMany({ email: { $in: ["sec_admin@furniva.com", "sec_cust@furniva.com"] } });

    adminUser = await User.create({
      name: "Security Admin",
      email: "sec_admin@furniva.com",
      password: "password123",
      role: "admin",
    });
    adminToken = generateToken(adminUser._id);

    customerUser = await User.create({
      name: "Regular Customer",
      email: "sec_cust@furniva.com",
      password: "password123",
      role: "customer",
    });
    customerToken = generateToken(customerUser._id);
  });

  beforeEach(async () => {
    await AuditLog.deleteMany({});
    await AttackLog.deleteMany({});
    await BlockedIP.deleteMany({});
  });

  describe("Admin Activity & Audit Logs (GET /api/admin/audit-logs)", () => {
    it("should reject non-admin users with 403", async () => {
      const res = await request(app)
        .get("/api/admin/audit-logs")
        .set("Authorization", `Bearer ${customerToken}`);

      expect(res.status).toBe(403);
    });

    it("should return paginated audit logs with action, resource, values, and IP", async () => {
      // Create sample audit logs
      await AuditLog.create([
        {
          admin: adminUser._id,
          action: "UPDATE_PRODUCT",
          target: { type: "Product", id: "prod_101" },
          oldValue: { price: 24999, stock: 12 },
          newValue: { price: 22999, stock: 15 },
          ip: "192.168.1.50",
          timestamp: new Date(),
        },
        {
          admin: adminUser._id,
          action: "BLOCK_IP",
          target: { type: "BlockedIP", id: "10.0.0.99" },
          oldValue: null,
          newValue: { ip: "10.0.0.99", reason: "SQL injection probe" },
          ip: "192.168.1.50",
          timestamp: new Date(),
        },
      ]);

      const res = await request(app)
        .get("/api/admin/audit-logs?page=1&limit=10")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("logs");
      expect(res.body).toHaveProperty("pagination");
      expect(res.body.pagination.total).toBe(2);
      expect(res.body.logs.length).toBe(2);

      const firstLog = res.body.logs[0];
      expect(firstLog.admin).toHaveProperty("name", "Security Admin");
      expect(firstLog).toHaveProperty("action");
      expect(firstLog).toHaveProperty("target");
      expect(firstLog.target).toHaveProperty("type");
      expect(firstLog.target).toHaveProperty("id");
      expect(firstLog).toHaveProperty("ip");
    });

    it("should filter audit logs by action, resource, and admin", async () => {
      await AuditLog.create([
        {
          admin: adminUser._id,
          action: "UPDATE_PRODUCT",
          target: { type: "Product", id: "prod_101" },
          ip: "192.168.1.50",
        },
        {
          admin: adminUser._id,
          action: "UPDATE_USER_ROLE",
          target: { type: "User", id: customerUser._id.toString() },
          ip: "192.168.1.50",
        },
      ]);

      // Filter by resource=Product
      const resResource = await request(app)
        .get("/api/admin/audit-logs?resource=Product")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(resResource.status).toBe(200);
      expect(resResource.body.logs.length).toBe(1);
      expect(resResource.body.logs[0].target.type).toBe("Product");

      // Filter by action=UPDATE_USER_ROLE
      const resAction = await request(app)
        .get("/api/admin/audit-logs?action=UPDATE_USER_ROLE")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(resAction.status).toBe(200);
      expect(resAction.body.logs.length).toBe(1);
      expect(resAction.body.logs[0].action).toBe("UPDATE_USER_ROLE");
    });

    it("should strictly redact passwords, tokens, and secrets from audit values", async () => {
      await AuditLog.create({
        admin: adminUser._id,
        action: "UPDATE_CREDENTIALS",
        target: { type: "User", id: "user_sec" },
        oldValue: { password: "plain_password_old", token: "secret_jwt_token", role: "customer" },
        newValue: { password: "plain_password_new", apiKey: "api_sec_12345", role: "admin" },
        ip: "127.0.0.1",
      });

      const res = await request(app)
        .get("/api/admin/audit-logs")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      const log = res.body.logs[0];
      expect(log.oldValue.password).toBe("[REDACTED]");
      expect(log.oldValue.token).toBe("[REDACTED]");
      expect(log.oldValue.role).toBe("customer");
      expect(log.newValue.password).toBe("[REDACTED]");
      expect(log.newValue.apiKey).toBe("[REDACTED]");
      expect(log.newValue.role).toBe("admin");
    });
  });

  describe("Security Dashboard & Events (GET /api/admin/security/*)", () => {
    it("should reject non-admin users with 403 on security dashboard and events", async () => {
      const resDash = await request(app)
        .get("/api/admin/security/dashboard")
        .set("Authorization", `Bearer ${customerToken}`);
      expect(resDash.status).toBe(403);

      const resEvents = await request(app)
        .get("/api/admin/security/events")
        .set("Authorization", `Bearer ${customerToken}`);
      expect(resEvents.status).toBe(403);
    });

    it("should return summary metrics across WAF, blocked IPs, rate-limits, auth failures, and audits", async () => {
      // Seed sample security data
      await AttackLog.create([
        {
          ip: "185.220.101.5",
          method: "GET",
          url: "/api/products?id=1' UNION SELECT",
          attackType: "SQLi",
          severity: 9,
          details: "SQL Injection detected",
        },
        {
          ip: "185.220.101.6",
          method: "POST",
          url: "/api/auth/login",
          attackType: "Authentication Failure",
          severity: 7,
          details: "Failed sign-in attempt",
        },
        {
          ip: "185.220.101.7",
          method: "GET",
          url: "/api/products",
          attackType: "Rate Limit Exceeded",
          severity: 6,
          details: "Rate limit threshold reached",
        },
        {
          ip: "185.220.101.8",
          method: "GET",
          url: "/.env",
          attackType: "Suspicious Request",
          severity: 8,
          details: "Sensitive file scan",
        },
      ]);

      await BlockedIP.create({
        ip: "185.220.101.99",
        isActive: true,
        reason: "Active automated scanning",
      });

      await AuditLog.create({
        admin: adminUser._id,
        action: "BLOCK_IP",
        target: { type: "BlockedIP", id: "185.220.101.99" },
        ip: "127.0.0.1",
      });

      const res = await request(app)
        .get("/api/admin/security/dashboard")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("summary");
      expect(res.body.summary.totalEvents).toBe(4);
      expect(res.body.summary.wafEvents).toBe(1);
      expect(res.body.summary.authFailures).toBe(1);
      expect(res.body.summary.rateLimitEvents).toBe(1);
      expect(res.body.summary.suspiciousRequests).toBe(1);
      expect(res.body.summary.activeBlockedIps).toBe(1);
      expect(res.body.summary.securityAuditEvents).toBe(1);
      expect(res.body).toHaveProperty("attackTypeDistribution");
      expect(res.body).toHaveProperty("topTargetedUrls");
      expect(res.body).toHaveProperty("topOffendingIps");
    });

    it("should filter security events by eventType, severity, date, and IP with pagination", async () => {
      await AttackLog.create([
        {
          ip: "192.168.1.100",
          method: "GET",
          url: "/api/products",
          attackType: "SQLi",
          severity: 9,
          details: "SQL injection",
          payload: { query: { token: "secret_token_123", q: "UNION SELECT" } },
        },
        {
          ip: "192.168.1.200",
          method: "POST",
          url: "/api/auth/login",
          attackType: "Authentication Failure",
          severity: 7,
          details: "Invalid password",
        },
      ]);

      // Filter by severity=critical (>= 9)
      const resCritical = await request(app)
        .get("/api/admin/security/events?severity=critical")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(resCritical.status).toBe(200);
      expect(resCritical.body.events.length).toBe(1);
      expect(resCritical.body.events[0].attackType).toBe("SQLi");

      // Filter by eventType=auth_failure
      const resAuth = await request(app)
        .get("/api/admin/security/events?eventType=auth_failure")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(resAuth.status).toBe(200);
      expect(resAuth.body.events.length).toBe(1);
      expect(resAuth.body.events[0].attackType).toBe("Authentication Failure");

      // Filter by IP
      const resIp = await request(app)
        .get("/api/admin/security/events?ip=192.168.1.100")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(resIp.status).toBe(200);
      expect(resIp.body.events.length).toBe(1);
      expect(resIp.body.events[0].ip).toBe("192.168.1.100");

      // Verify payload redaction: token should be masked
      expect(resIp.body.events[0].payload.query.token).toBe("[REDACTED]");
    });
  });
});
