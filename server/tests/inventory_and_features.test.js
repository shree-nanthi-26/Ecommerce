import request from "supertest";
import app from "../app.js";
import Product from "../models/Product.js";
import User from "../models/User.js";
import InventoryHistory from "../models/InventoryHistory.js";
import Wishlist from "../models/Wishlist.js";
import Cart from "../models/Cart.js";
import generateToken from "../utils/generateToken.js";

describe("Inventory, Analytics & Delivery Features", () => {
  let adminUser;
  let adminToken;
  let customerUser;
  let customerToken;
  let product1;
  let product2;

  beforeAll(async () => {
    await User.deleteMany({});
    adminUser = await User.create({
      name: "Super Admin",
      email: "admin_inv@example.com",
      password: "password123",
      role: "admin",
    });
    adminToken = generateToken(adminUser._id);

    customerUser = await User.create({
      name: "Test Customer",
      email: "cust_inv@example.com",
      password: "password123",
      role: "customer",
    });
    customerToken = generateToken(customerUser._id);
  });

  beforeEach(async () => {
    await Product.deleteMany({});
    await InventoryHistory.deleteMany({});
    await Wishlist.deleteMany({});
    await Cart.deleteMany({});

    product1 = await Product.create({
      name: "Nordic Velvet Armchair",
      sku: "FUR-ARM-001",
      category: "Living Room",
      price: 15999,
      oldPrice: 18999,
      stock: 12,
      lowStockThreshold: 5,
    });

    product2 = await Product.create({
      name: "Minimalist Oak Coffee Table",
      sku: "FUR-TBL-002",
      category: "Tables",
      price: 8999,
      stock: 2,
      lowStockThreshold: 5,
    });
  });

  describe("Admin Inventory Management", () => {
    it("should fetch inventory items with computed health statuses", async () => {
      const res = await request(app)
        .get("/api/admin/inventory")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.summary.healthyCount).toBe(1); // product1 stock 12 > 5
      expect(res.body.summary.criticalCount).toBe(1); // product2 stock 2 <= 2
      expect(res.body.data.length).toBe(2);
    });

    it("should adjust stock and log to InventoryHistory", async () => {
      const res = await request(app)
        .post("/api/admin/inventory/adjust")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          productId: product1._id,
          type: "add",
          value: 8,
          reason: "Restock",
          notes: "Fresh shipment arrived at Bangalore warehouse",
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.product.stock).toBe(20);

      // Verify audit history created
      const history = await InventoryHistory.find({ product: product1._id });
      expect(history.length).toBe(1);
      expect(history[0].previousStock).toBe(12);
      expect(history[0].newStock).toBe(20);
      expect(history[0].quantityChange).toBe(8);
      expect(history[0].reason).toBe("Restock");
    });

    it("should prevent negative stock adjustment", async () => {
      const res = await request(app)
        .post("/api/admin/inventory/adjust")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          productId: product2._id,
          type: "subtract",
          value: 10,
          reason: "Damaged / Defect",
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain("Current stock is only 2 units");
    });

    it("should fetch inventory history logs", async () => {
      await InventoryHistory.create({
        product: product1._id,
        quantityChange: 5,
        previousStock: 7,
        newStock: 12,
        reason: "Restock",
      });

      const res = await request(app)
        .get("/api/admin/inventory/history")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].reason).toBe("Restock");
    });
  });

  describe("Admin Analytics Dashboard", () => {
    it("should return comprehensive analytics and timeframe data", async () => {
      const res = await request(app)
        .get("/api/admin/dashboard?timeframe=7d")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.metrics).toBeDefined();
      expect(res.body.metrics.totalProducts).toBe(2);
      expect(res.body.salesTimeline).toBeDefined();
      expect(res.body.lowStockProducts.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe("Delivery Availability Checker", () => {
    it("should validate and return delivery estimates for valid Indian pincode", async () => {
      const res = await request(app)
        .get(`/api/products/${product1._id}/delivery-check?pincode=560001`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.serviceable).toBe(true);
      expect(res.body.region).toContain("South");
      expect(res.body.estimatedDeliveryRange).toBeDefined();
      expect(res.body.isFreeDelivery).toBe(true); // 15999 >= 999
    });

    it("should reject invalid Indian pincode", async () => {
      const res = await request(app)
        .get(`/api/products/${product1._id}/delivery-check?pincode=01234`);

      expect(res.status).toBe(400);
      expect(res.body.serviceable).toBe(false);
    });
  });

  describe("Wishlist Upgrade & Notification Consent", () => {
    it("should track priceWhenAdded and update notification consent preferences", async () => {
      // Add product1 to wishlist
      await request(app)
        .post("/api/wishlist/products")
        .set("Authorization", `Bearer ${customerToken}`)
        .send({ productId: product1._id });

      // Update consent
      const consentRes = await request(app)
        .put(`/api/wishlist/notifications/${product1._id}`)
        .set("Authorization", `Bearer ${customerToken}`)
        .send({ notifyOnPriceDrop: true, notifyOnRestock: true });

      expect(consentRes.status).toBe(200);
      expect(consentRes.body.success).toBe(true);
      expect(consentRes.body.data.items[0].notifyOnPriceDrop).toBe(true);
      expect(consentRes.body.data.items[0].notifyOnRestock).toBe(true);
    });

    it("should move item directly from wishlist to cart", async () => {
      await request(app)
        .post("/api/wishlist/products")
        .set("Authorization", `Bearer ${customerToken}`)
        .send({ productId: product1._id });

      const moveRes = await request(app)
        .post(`/api/wishlist/move-to-cart/${product1._id}`)
        .set("Authorization", `Bearer ${customerToken}`);

      expect(moveRes.status).toBe(200);
      expect(moveRes.body.success).toBe(true);
      expect(moveRes.body.wishlist.items.length).toBe(0);

      // Verify cart now has item
      const cart = await Cart.findOne({ user: customerUser._id });
      expect(cart.items.length).toBe(1);
      expect(cart.items[0].product.toString()).toBe(product1._id.toString());
    });
  });
});
