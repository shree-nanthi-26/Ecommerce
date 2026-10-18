import request from "supertest";
import app from "../app.js";
import User from "../models/User.js";
import Product from "../models/Product.js";
import Cart from "../models/Cart.js";
import generateToken from "../utils/generateToken.js";
import {
  findAbandonedCarts,
  processAbandonedCarts,
  optOutByToken,
} from "../services/abandonedCartService.js";

describe("Abandoned Cart & Advanced Product Search Suite", () => {
  let customerUser;
  let customerToken;
  let product1;
  let product2;

  beforeAll(async () => {
    await User.deleteMany({});
    await Product.deleteMany({});
    await Cart.deleteMany({});

    customerUser = await User.create({
      name: "Sophia Anderson",
      email: "sophia.anderson@example.com",
      password: "password123",
      emailPreferences: {
        marketingEmails: true,
        abandonedCartEmails: true,
      },
      unsubscribeToken: "test-secure-token-12345",
    });
    customerToken = generateToken(customerUser._id);

    product1 = await Product.create({
      name: "Nordic Minimalist Oak Dining Table",
      category: "Dining Furniture",
      brand: "NordicCraft",
      price: 34999,
      oldPrice: 42999,
      stock: 8,
      rating: 4.8,
      reviews: 24,
      specs: {
        material: "Solid Oak Wood",
        roomType: "Dining Room",
        style: "Scandinavian",
        color: "Natural Oak",
      },
      description: "Handcrafted Scandinavian solid oak dining table designed for modern homes.",
    });

    product2 = await Product.create({
      name: "Milan Velvet Accent Armchair",
      category: "Sofas & Seating",
      brand: "MilanStudio",
      price: 18499,
      oldPrice: 22999,
      stock: 5,
      rating: 4.9,
      reviews: 42,
      specs: {
        material: "Plush Velvet",
        roomType: "Living Room",
        style: "Modern Luxury",
        color: "Emerald Green",
      },
      description: "Luxurious emerald green velvet accent chair with brass gold metal legs.",
    });
  });

  afterAll(async () => {
    await User.deleteMany({});
    await Product.deleteMany({});
    await Cart.deleteMany({});
  });

  describe("1. Cart Inactivity Timestamp Tracking", () => {
    it("should initialize lastActivityAt and reminderCount when user adds an item", async () => {
      const res = await request(app)
        .post("/api/cart/items")
        .set("Authorization", `Bearer ${customerToken}`)
        .send({ productId: product1._id.toString(), quantity: 1 });

      expect(res.status).toBe(200);

      const cart = await Cart.findOne({ user: customerUser._id });
      expect(cart).toBeDefined();
      expect(cart.lastActivityAt).toBeInstanceOf(Date);
      expect(cart.reminderCount).toBe(0);
      expect(cart.isAbandoned).toBe(false);
    });

    it("should refresh lastActivityAt and reset reminderCount when user updates cart quantity", async () => {
      // Simulate cart having older activity and prior reminder
      await Cart.updateOne(
        { user: customerUser._id },
        {
          lastActivityAt: new Date(Date.now() - 5 * 60 * 60 * 1000), // 5 hours ago
          reminderCount: 1,
          isAbandoned: true,
        }
      );

      const res = await request(app)
        .put(`/api/cart/items/${product1._id}`)
        .set("Authorization", `Bearer ${customerToken}`)
        .send({ quantity: 2 });

      expect(res.status).toBe(200);

      const updatedCart = await Cart.findOne({ user: customerUser._id });
      // Should have been refreshed to recent timestamp
      const ageMs = Date.now() - new Date(updatedCart.lastActivityAt).getTime();
      expect(ageMs).toBeLessThan(10000); // within 10 seconds
      expect(updatedCart.reminderCount).toBe(0);
      expect(updatedCart.isAbandoned).toBe(false);
    });
  });

  describe("2. Abandoned Cart Detection & Inactivity Threshold", () => {
    it("should NOT detect carts as abandoned if inactivity is below threshold", async () => {
      // Set activity to 30 minutes ago (below default 2 hours threshold)
      await Cart.updateOne(
        { user: customerUser._id },
        {
          lastActivityAt: new Date(Date.now() - 30 * 60 * 1000),
          reminderCount: 0,
        }
      );

      const result = await findAbandonedCarts({ thresholdHours: 2 });
      expect(result.eligibleCarts.some((c) => c.user._id.toString() === customerUser._id.toString())).toBe(false);
    });

    it("should detect carts as abandoned once inactivity exceeds threshold", async () => {
      // Set activity to 3 hours ago (past 2 hours threshold)
      await Cart.updateOne(
        { user: customerUser._id },
        {
          lastActivityAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
          reminderCount: 0,
        }
      );

      const result = await findAbandonedCarts({ thresholdHours: 2 });
      const found = result.eligibleCarts.find((c) => c.user._id.toString() === customerUser._id.toString());
      expect(found).toBeDefined();
      expect(found.items).toHaveLength(1);
    });
  });

  describe("3. Excessive Email Prevention & Reminders Processing", () => {
    it("should process abandoned cart reminder, update reminderCount, and record lastReminderSentAt", async () => {
      // Set cart inactive by 3 hours
      await Cart.updateOne(
        { user: customerUser._id },
        {
          lastActivityAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
          reminderCount: 0,
          lastReminderSentAt: null,
        }
      );

      const processResult = await processAbandonedCarts({ thresholdHours: 2, maxReminders: 1 });
      expect(processResult.success).toBe(true);
      expect(processResult.remindersSent).toBeGreaterThanOrEqual(1);

      const cart = await Cart.findOne({ user: customerUser._id });
      expect(cart.reminderCount).toBe(1);
      expect(cart.isAbandoned).toBe(true);
      expect(cart.lastReminderSentAt).toBeInstanceOf(Date);
    });

    it("should PREVENT duplicate emails when reminderCount reached maxReminders limit", async () => {
      // Cart already has reminderCount = 1 and maxReminders = 1
      const processResult = await processAbandonedCarts({ thresholdHours: 2, maxReminders: 1 });
      const foundInSent = processResult.processedCarts.some((c) => c.cartId.toString() === customerUser._id.toString());
      expect(foundInSent).toBe(false);
    });

    it("should enforce cooldown period between reminders", async () => {
      // Allow max 2 reminders, but reminder sent 10 minutes ago
      await Cart.updateOne(
        { user: customerUser._id },
        {
          lastActivityAt: new Date(Date.now() - 5 * 60 * 60 * 1000),
          reminderCount: 1,
          lastReminderSentAt: new Date(Date.now() - 10 * 60 * 1000), // only 10m ago
        }
      );

      const check = await findAbandonedCarts({ thresholdHours: 2, maxReminders: 2 });
      expect(check.skippedCooldown).toBeGreaterThanOrEqual(1);
      expect(check.eligibleCarts.some((c) => c.user._id.toString() === customerUser._id.toString())).toBe(false);
    });
  });

  describe("4. Email Opt-Out & Preferences (Security & Privacy)", () => {
    it("should opt-out user via secure unsubscribe token without exposing cart information", async () => {
      const res = await request(app)
        .post("/api/auth/unsubscribe")
        .send({
          token: "test-secure-token-12345",
          type: "abandonedCart",
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      // Verify cart information is not leaked in response
      expect(res.body.cart).toBeUndefined();
      expect(res.body.items).toBeUndefined();

      const user = await User.findById(customerUser._id);
      expect(user.emailPreferences.abandonedCartEmails).toBe(false);
    });

    it("should skip sending reminder when user has opted out", async () => {
      await Cart.updateOne(
        { user: customerUser._id },
        {
          lastActivityAt: new Date(Date.now() - 5 * 60 * 60 * 1000),
          reminderCount: 0,
          lastReminderSentAt: null,
        }
      );

      const check = await findAbandonedCarts({ thresholdHours: 2, maxReminders: 1 });
      expect(check.skippedOptOut).toBeGreaterThanOrEqual(1);
      expect(check.eligibleCarts.some((c) => c.user._id.toString() === customerUser._id.toString())).toBe(false);
    });

    it("should allow authenticated user to manage preferences via /api/auth/preferences", async () => {
      // Re-enable abandoned cart emails
      const updateRes = await request(app)
        .put("/api/auth/preferences")
        .set("Authorization", `Bearer ${customerToken}`)
        .send({
          abandonedCartEmails: true,
          marketingEmails: false,
        });

      expect(updateRes.status).toBe(200);
      expect(updateRes.body.emailPreferences.abandonedCartEmails).toBe(true);
      expect(updateRes.body.emailPreferences.marketingEmails).toBe(false);

      const getRes = await request(app)
        .get("/api/auth/preferences")
        .set("Authorization", `Bearer ${customerToken}`);

      expect(getRes.status).toBe(200);
      expect(getRes.body.emailPreferences.abandonedCartEmails).toBe(true);
      expect(getRes.body.emailPreferences.marketingEmails).toBe(false);
    });
  });

  describe("5. Upgraded Product Search & Autocomplete Suggestions", () => {
    it("should return popular searches and categories when search query is empty", async () => {
      const res = await request(app).get("/api/products/search/suggestions?q=");

      expect(res.status).toBe(200);
      expect(res.body.popular).toBeDefined();
      expect(Array.isArray(res.body.popular)).toBe(true);
      expect(res.body.popular.length).toBeGreaterThan(0);
      expect(Array.isArray(res.body.categories)).toBe(true);
    });

    it("should return matching products, categories, and brands while typing", async () => {
      const res = await request(app).get("/api/products/search/suggestions?q=oak");

      expect(res.status).toBe(200);
      expect(res.body.products).toBeDefined();
      expect(res.body.products.length).toBeGreaterThanOrEqual(1);
      expect(res.body.products[0].name).toContain("Oak");
    });

    it("should match relevant attributes like material (Velvet)", async () => {
      const res = await request(app).get("/api/products/search/suggestions?q=velvet");

      expect(res.status).toBe(200);
      expect(res.body.products.length).toBeGreaterThanOrEqual(1);
      expect(res.body.products[0].name).toContain("Velvet");
    });

    it("should match brand names (NordicCraft)", async () => {
      const res = await request(app).get("/api/products/search/suggestions?q=NordicCraft");

      expect(res.status).toBe(200);
      expect(res.body.brands).toContain("NordicCraft");
    });

    it("should return recommendations when search query yields 0 results", async () => {
      const res = await request(app).get("/api/products/search/suggestions?q=nonexistentproductxyz987");

      expect(res.status).toBe(200);
      expect(res.body.products).toHaveLength(0);
      expect(res.body.recommendations).toBeDefined();
      expect(res.body.recommendations.length).toBeGreaterThan(0);
    });

    it("should support full catalog search by multi-attribute in /api/products", async () => {
      const res = await request(app).get("/api/products?q=Scandinavian");

      expect(res.status).toBe(200);
      expect(res.body.products.length).toBeGreaterThanOrEqual(1);
      expect(res.body.products[0].specs.style).toBe("Scandinavian");
    });
  });
});
