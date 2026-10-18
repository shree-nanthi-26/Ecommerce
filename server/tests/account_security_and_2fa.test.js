import request from "supertest";
import app from "../app.js";
import User from "../models/User.js";
import Session from "../models/Session.js";
import generateToken from "../utils/generateToken.js";
import { generateSync } from "otplib";

describe("Account Security, Brute-Force Lockout, Sessions & 2FA APIs", () => {
  let testAdmin;
  let testAdminToken;
  let testCustomer;
  let testCustomerToken;

  beforeAll(async () => {
    await User.deleteMany({
      email: { $in: ["sec_suite_admin@furniva.com", "sec_suite_cust@furniva.com", "lockout_test@furniva.com"] },
    });
    await Session.deleteMany({});

    testAdmin = await User.create({
      name: "Suite Admin",
      email: "sec_suite_admin@furniva.com",
      password: "OldPassword@123",
      role: "admin",
    });
    testAdminToken = generateToken(testAdmin._id);

    testCustomer = await User.create({
      name: "Suite Customer",
      email: "sec_suite_cust@furniva.com",
      password: "CustomerPass@123",
      role: "customer",
    });
    testCustomerToken = generateToken(testCustomer._id);
  });

  afterAll(async () => {
    await User.deleteMany({
      email: { $in: ["sec_suite_admin@furniva.com", "sec_suite_cust@furniva.com", "lockout_test@furniva.com"] },
    });
    await Session.deleteMany({});
  });

  describe("Password Change & Strength Validation (POST /api/auth/change-password)", () => {
    it("should reject password change with incorrect current password", async () => {
      const res = await request(app)
        .post("/api/auth/change-password")
        .set("Authorization", `Bearer ${testCustomerToken}`)
        .send({
          currentPassword: "WrongPassword999!",
          newPassword: "BrandNewSecurePass@2026",
          confirmPassword: "BrandNewSecurePass@2026",
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/incorrect current password/i);
    });

    it("should reject password change if new password does not meet strength requirements", async () => {
      const res = await request(app)
        .post("/api/auth/change-password")
        .set("Authorization", `Bearer ${testCustomerToken}`)
        .send({
          currentPassword: "CustomerPass@123",
          newPassword: "weak",
          confirmPassword: "weak",
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/at least 8 characters|security requirements/i);
    });

    it("should reject password change if new password equals current password", async () => {
      const res = await request(app)
        .post("/api/auth/change-password")
        .set("Authorization", `Bearer ${testCustomerToken}`)
        .send({
          currentPassword: "CustomerPass@123",
          newPassword: "CustomerPass@123",
          confirmPassword: "CustomerPass@123",
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/cannot be the same/i);
    });

    it("should successfully change password when requirements are satisfied", async () => {
      const res = await request(app)
        .post("/api/auth/change-password")
        .set("Authorization", `Bearer ${testCustomerToken}`)
        .send({
          currentPassword: "CustomerPass@123",
          newPassword: "UpgradedSecurePass@2026",
          confirmPassword: "UpgradedSecurePass@2026",
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.token).toBeDefined();

      // Test login with the new password
      const loginRes = await request(app)
        .post("/api/auth/login")
        .send({
          email: "sec_suite_cust@furniva.com",
          password: "UpgradedSecurePass@2026",
        });

      expect(loginRes.status).toBe(200);
      expect(loginRes.body.token).toBeDefined();
    });
  });

  describe("Login Attempt Tracking & Brute-Force Temporary Lockout", () => {
    it("should track failed attempts and lock out account after 5 consecutive failures", async () => {
      const lockedUser = await User.create({
        name: "Lockout Test User",
        email: "lockout_test@furniva.com",
        password: "ValidSecretPass@2026",
      });

      // 4 Failed attempts: should return 401 with remaining attempts warning
      for (let i = 1; i <= 4; i++) {
        const res = await request(app)
          .post("/api/auth/login")
          .send({
            email: "lockout_test@furniva.com",
            password: "WrongPassword!",
          });

        expect(res.status).toBe(401);
        expect(res.body.message).toMatch(/remaining before temporary lockout/i);
      }

      // 5th Failed attempt: triggers temporary lockout
      const fifthRes = await request(app)
        .post("/api/auth/login")
        .send({
          email: "lockout_test@furniva.com",
          password: "WrongPassword!",
        });

      expect(fifthRes.status).toBe(423);
      expect(fifthRes.body.message).toMatch(/locked/i);

      // Even WITH the correct password, locked account must be rejected until lockout expires
      const lockedTry = await request(app)
        .post("/api/auth/login")
        .send({
          email: "lockout_test@furniva.com",
          password: "ValidSecretPass@2026",
        });

      expect(lockedTry.status).toBe(423);
      expect(lockedTry.body.message).toMatch(/temporarily locked/i);
    });
  });

  describe("Active Session Management & Logout All Sessions", () => {
    it("should list active sessions for authenticated user", async () => {
      const res = await request(app)
        .get("/api/auth/sessions")
        .set("Authorization", `Bearer ${testAdminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.sessions)).toBe(true);
    });

    it("should support logout from all sessions and invalidate tokens", async () => {
      const res = await request(app)
        .post("/api/auth/logout-all")
        .set("Authorization", `Bearer ${testAdminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      // Verify user tokenVersion was incremented
      const updatedAdmin = await User.findById(testAdmin._id);
      expect(updatedAdmin.tokenVersion).toBeGreaterThan(0);
    });
  });

  describe("Two-Factor Authentication (TOTP) Workflow", () => {
    let setupSecret;
    let backupCodes;

    it("should generate 2FA setup details (secret, QR code, recovery codes)", async () => {
      // Re-fetch admin token after tokenVersion increment
      const freshAdminToken = generateToken(testAdmin._id, { tokenVersion: 10 });
      await User.findByIdAndUpdate(testAdmin._id, { tokenVersion: 10 });

      const res = await request(app)
        .post("/api/auth/2fa/setup")
        .set("Authorization", `Bearer ${freshAdminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.secret).toBeDefined();
      expect(res.body.qrCode).toMatch(/^data:image\/png;base64,/);
      expect(res.body.recoveryCodes).toHaveLength(8);

      setupSecret = res.body.secret;
      backupCodes = res.body.recoveryCodes;
    });

    it("should reject 2FA enable with invalid 6-digit code", async () => {
      const freshAdminToken = generateToken(testAdmin._id, { tokenVersion: 10 });

      const res = await request(app)
        .post("/api/auth/2fa/verify-setup")
        .set("Authorization", `Bearer ${freshAdminToken}`)
        .send({ code: "000000" });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/invalid verification code/i);
    });

    it("should successfully enable 2FA with valid TOTP code", async () => {
      const freshAdminToken = generateToken(testAdmin._id, { tokenVersion: 10 });
      const validCode = generateSync({ secret: setupSecret });

      const res = await request(app)
        .post("/api/auth/2fa/verify-setup")
        .set("Authorization", `Bearer ${freshAdminToken}`)
        .send({ code: validCode });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.twoFactorEnabled).toBe(true);

      const adminInDb = await User.findById(testAdmin._id);
      expect(adminInDb.twoFactorEnabled).toBe(true);
    });

    it("should require 2FA challenge on login when 2FA is enabled", async () => {
      const loginRes = await request(app)
        .post("/api/auth/login")
        .send({
          email: "sec_suite_admin@furniva.com",
          password: "OldPassword@123",
        });

      expect(loginRes.status).toBe(200);
      expect(loginRes.body.require2FA).toBe(true);
      expect(loginRes.body.tempToken).toBeDefined();
      expect(loginRes.body.token).toBeUndefined(); // Crucial: full auth token is NOT exposed yet!

      // Complete login challenge with valid code
      const validCode = generateSync({ secret: setupSecret });
      const challengeRes = await request(app)
        .post("/api/auth/2fa/validate-login")
        .send({
          tempToken: loginRes.body.tempToken,
          code: validCode,
        });

      expect(challengeRes.status).toBe(200);
      expect(challengeRes.body.token).toBeDefined();
      expect(challengeRes.body.twoFactorEnabled).toBe(true);
    });

    it("should allow login via backup recovery code", async () => {
      const loginRes = await request(app)
        .post("/api/auth/login")
        .send({
          email: "sec_suite_admin@furniva.com",
          password: "OldPassword@123",
        });

      expect(loginRes.body.require2FA).toBe(true);

      const challengeRes = await request(app)
        .post("/api/auth/2fa/validate-login")
        .send({
          tempToken: loginRes.body.tempToken,
          recoveryCode: backupCodes[0],
        });

      expect(challengeRes.status).toBe(200);
      expect(challengeRes.body.token).toBeDefined();
    });
  });
});
