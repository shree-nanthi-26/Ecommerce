import request from "supertest";
import app from "../app.js";
import Address from "../models/Address.js";
import User from "../models/User.js";
import generateToken from "../utils/generateToken.js";

describe("Address Endpoints & Business Logic", () => {
  let user1;
  let user1Token;
  let user2;
  let user2Token;

  beforeAll(async () => {
    await User.deleteMany({});
    user1 = await User.create({
      name: "Rohan Sharma",
      email: "rohan@example.com",
      password: "password123",
    });
    user1Token = generateToken(user1._id);

    user2 = await User.create({
      name: "Priya Patel",
      email: "priya@example.com",
      password: "password123",
    });
    user2Token = generateToken(user2._id);
  });

  beforeEach(async () => {
    await Address.deleteMany({});
  });

  describe("POST /api/addresses (Create Address)", () => {
    it("should create an address and auto-set it as default for the first address", async () => {
      const res = await request(app)
        .post("/api/addresses")
        .set("Authorization", `Bearer ${user1Token}`)
        .send({
          fullName: "Rohan Sharma",
          phone: "9876543210",
          addressLine1: "Flat 402, Green Glen Layout",
          addressLine2: "Bellandur Outer Ring Road",
          city: "Bengaluru",
          state: "Karnataka",
          postalCode: "560103",
          country: "India",
          addressType: "Home",
          isDefault: false, // first address should become default automatically
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.fullName).toBe("Rohan Sharma");
      expect(res.body.data.isDefault).toBe(true);
      expect(res.body.data.addressType).toBe("Home");
    });

    it("should reject invalid Indian phone number", async () => {
      const res = await request(app)
        .post("/api/addresses")
        .set("Authorization", `Bearer ${user1Token}`)
        .send({
          fullName: "Rohan Sharma",
          phone: "1234567890", // invalid first digit
          addressLine1: "Flat 402",
          city: "Bengaluru",
          state: "Karnataka",
          postalCode: "560103",
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/valid 10-digit Indian mobile number/i);
    });

    it("should reject invalid Indian PIN code", async () => {
      const res = await request(app)
        .post("/api/addresses")
        .set("Authorization", `Bearer ${user1Token}`)
        .send({
          fullName: "Rohan Sharma",
          phone: "9876543210",
          addressLine1: "Flat 402",
          city: "Bengaluru",
          state: "Karnataka",
          postalCode: "056010", // starts with 0
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/valid 6-digit Indian PIN code/i);
    });

    it("should allow creating a second default address and unmark the first address as default", async () => {
      // 1st address
      await request(app)
        .post("/api/addresses")
        .set("Authorization", `Bearer ${user1Token}`)
        .send({
          fullName: "Rohan Sharma (Home)",
          phone: "9876543210",
          addressLine1: "Home Address",
          city: "Bengaluru",
          state: "Karnataka",
          postalCode: "560103",
          addressType: "Home",
        });

      // 2nd address with isDefault: true
      const res2 = await request(app)
        .post("/api/addresses")
        .set("Authorization", `Bearer ${user1Token}`)
        .send({
          fullName: "Rohan Sharma (Work)",
          phone: "9876543210",
          addressLine1: "Office Tech Park",
          city: "Bengaluru",
          state: "Karnataka",
          postalCode: "560037",
          addressType: "Work",
          isDefault: true,
        });

      expect(res2.status).toBe(201);
      expect(res2.body.data.isDefault).toBe(true);

      const allAddresses = await Address.find({ user: user1._id });
      const defaultAddresses = allAddresses.filter((a) => a.isDefault);
      expect(defaultAddresses.length).toBe(1);
      expect(defaultAddresses[0].addressType).toBe("Work");
    });
  });

  describe("GET /api/addresses (Read Addresses)", () => {
    it("should return only the addresses belonging to the authenticated user", async () => {
      await Address.create({
        user: user1._id,
        fullName: "Rohan Sharma",
        phone: "9876543210",
        addressLine1: "Address 1",
        city: "Bengaluru",
        state: "Karnataka",
        postalCode: "560103",
        addressType: "Home",
        isDefault: true,
      });

      await Address.create({
        user: user2._id,
        fullName: "Priya Patel",
        phone: "9876543211",
        addressLine1: "Address 2",
        city: "Mumbai",
        state: "Maharashtra",
        postalCode: "400001",
        addressType: "Home",
        isDefault: true,
      });

      const res = await request(app)
        .get("/api/addresses")
        .set("Authorization", `Bearer ${user1Token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].fullName).toBe("Rohan Sharma");
    });
  });

  describe("PUT & PATCH /api/addresses (Update & Set Default)", () => {
    it("should update address fields successfully", async () => {
      const addr = await Address.create({
        user: user1._id,
        fullName: "Rohan Sharma",
        phone: "9876543210",
        addressLine1: "Old Address Line",
        city: "Bengaluru",
        state: "Karnataka",
        postalCode: "560103",
        addressType: "Home",
        isDefault: true,
      });

      const res = await request(app)
        .put(`/api/addresses/${addr._id}`)
        .set("Authorization", `Bearer ${user1Token}`)
        .send({
          addressLine1: "Updated New Villa",
          addressType: "Other",
        });

      expect(res.status).toBe(200);
      expect(res.body.data.addressLine1).toBe("Updated New Villa");
      expect(res.body.data.addressType).toBe("Other");
    });

    it("should not allow user2 to update user1 address", async () => {
      const addr = await Address.create({
        user: user1._id,
        fullName: "Rohan Sharma",
        phone: "9876543210",
        addressLine1: "Rohan Villa",
        city: "Bengaluru",
        state: "Karnataka",
        postalCode: "560103",
      });

      const res = await request(app)
        .put(`/api/addresses/${addr._id}`)
        .set("Authorization", `Bearer ${user2Token}`)
        .send({
          addressLine1: "Hacked Address",
        });

      expect(res.status).toBe(403);
    });

    it("should set an address as default using PATCH /api/addresses/:id/default", async () => {
      const addr1 = await Address.create({
        user: user1._id,
        fullName: "Rohan Sharma",
        phone: "9876543210",
        addressLine1: "Address 1",
        city: "Bengaluru",
        state: "Karnataka",
        postalCode: "560103",
        isDefault: true,
      });

      const addr2 = await Address.create({
        user: user1._id,
        fullName: "Rohan Sharma",
        phone: "9876543210",
        addressLine1: "Address 2",
        city: "Bengaluru",
        state: "Karnataka",
        postalCode: "560037",
        isDefault: false,
      });

      const res = await request(app)
        .patch(`/api/addresses/${addr2._id}/default`)
        .set("Authorization", `Bearer ${user1Token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.isDefault).toBe(true);

      const refreshedAddr1 = await Address.findById(addr1._id);
      expect(refreshedAddr1.isDefault).toBe(false);
    });
  });

  describe("DELETE /api/addresses/:id (Delete & Auto-promote default)", () => {
    it("should delete an address and promote the remaining address to default if default was deleted", async () => {
      const addr1 = await Address.create({
        user: user1._id,
        fullName: "Rohan Sharma",
        phone: "9876543210",
        addressLine1: "Address 1",
        city: "Bengaluru",
        state: "Karnataka",
        postalCode: "560103",
        isDefault: true,
      });

      const addr2 = await Address.create({
        user: user1._id,
        fullName: "Rohan Sharma",
        phone: "9876543210",
        addressLine1: "Address 2",
        city: "Bengaluru",
        state: "Karnataka",
        postalCode: "560037",
        isDefault: false,
      });

      const res = await request(app)
        .delete(`/api/addresses/${addr1._id}`)
        .set("Authorization", `Bearer ${user1Token}`);

      expect(res.status).toBe(200);

      const remaining = await Address.findById(addr2._id);
      expect(remaining.isDefault).toBe(true);
    });
  });
});
