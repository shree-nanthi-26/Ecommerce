import request from "supertest";
import crypto from "crypto";
import app from "../app.js";
import User from "../models/User.js";
import Product from "../models/Product.js";
import Order from "../models/Order.js";
import Coupon from "../models/Coupon.js";
import Address from "../models/Address.js";
import Cart from "../models/Cart.js";
import Wishlist from "../models/Wishlist.js";
import generateToken from "../utils/generateToken.js";

describe("STEP 3: Complete End-to-End Customer Journey Lifecycle", () => {
  let customerUser;
  let customerToken;
  let secondUser;
  let secondUserToken;
  let adminUser;
  let adminToken;
  let featuredProduct;
  let testCoupon;
  let placedOrderId;
  let savedAddressId;

  const testKeySecret = process.env.RAZORPAY_KEY_SECRET || "mock_secret";

  beforeAll(async () => {
    // Clear test collections
    await User.deleteMany({});
    await Product.deleteMany({});
    await Order.deleteMany({});
    await Coupon.deleteMany({});
    await Address.deleteMany({});
    await Cart.deleteMany({});
    await Wishlist.deleteMany({});

    // Seed an admin user
    adminUser = await User.create({
      name: "Admin Manager",
      email: "admin_e2e@furniva.com",
      password: "AdminPassword123!",
      role: "admin",
    });
    adminToken = generateToken(adminUser._id);

    // Seed a catalog product
    featuredProduct = await Product.create({
      name: "Nordic Luxury Armchair",
      category: "Chairs",
      price: 14999,
      oldPrice: 18999,
      stock: 10,
      description: "Ergonomic oak frame upholstered in premium textured linen.",
      images: [
        { url: "https://images.unsplash.com/photo-armchair-1.jpg", publicId: "armchair_1" },
        { url: "https://images.unsplash.com/photo-armchair-2.jpg", publicId: "armchair_2" },
      ],
      rating: 4.8,
      numReviews: 12,
    });

    // Seed a valid coupon
    testCoupon = await Coupon.create({
      code: "JOURNEY20",
      discountType: "percentage",
      discountValue: 20,
      minOrderValue: 2000,
      maxDiscountAmount: 5000,
      isActive: true,
    });
  });

  afterAll(async () => {
    await User.deleteMany({});
    await Product.deleteMany({});
    await Order.deleteMany({});
    await Coupon.deleteMany({});
    await Address.deleteMany({});
    await Cart.deleteMany({});
    await Wishlist.deleteMany({});
  });

  // ── 1. Homepage & Product Listings ──────────────────────────────────────────
  it("Stage 1: Visitor can browse homepage and product catalog", async () => {
    const res = await request(app).get("/api/products");
    expect(res.status).toBe(200);
    expect(res.body.products).toBeDefined();
    expect(Array.isArray(res.body.products)).toBe(true);
    expect(res.body.products.length).toBeGreaterThanOrEqual(1);

    const found = res.body.products.find((p) => p._id === featuredProduct._id.toString());
    expect(found).toBeDefined();
    expect(found.name).toBe("Nordic Luxury Armchair");
    expect(found.price).toBe(14999);
  });

  // ── 2. Product Details & Images ─────────────────────────────────────────────
  it("Stage 2: Visitor can inspect product specifications and media", async () => {
    const res = await request(app).get(`/api/products/${featuredProduct._id}`);
    expect(res.status).toBe(200);
    expect(res.body._id).toBe(featuredProduct._id.toString());
    expect(res.body.images).toHaveLength(2);
    expect(res.body.images[0].url).toContain("photo-armchair-1");
    expect(res.body.stock).toBe(10);
    expect(res.body.rating).toBe(4.8);
  });

  // ── 3. Customer Registration & Authentication ───────────────────────────────
  it("Stage 3: Customer can register and log in to obtain JWT session", async () => {
    // 3a. Register
    const regRes = await request(app)
      .post("/api/auth/register")
      .send({
        name: "Aarav Sharma",
        email: "aarav.sharma@example.com",
        password: "SecurePassword123!",
      });

    expect(regRes.status).toBe(201);
    expect(regRes.body.token).toBeDefined();
    expect(regRes.body.email).toBe("aarav.sharma@example.com");

    customerToken = regRes.body.token;
    customerUser = regRes.body;

    // 3b. Login
    const loginRes = await request(app)
      .post("/api/auth/login")
      .send({
        email: "aarav.sharma@example.com",
        password: "SecurePassword123!",
      });

    expect(loginRes.status).toBe(200);
    expect(loginRes.body.token).toBeDefined();
    expect(loginRes.body._id).toBe(customerUser._id);

    // 3c. Protected profile verification
    const profileRes = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${customerToken}`);

    expect(profileRes.status).toBe(200);
    expect(profileRes.body.name).toBe("Aarav Sharma");
  });

  // ── 4. Cart & Wishlist ───────────────────────────────────────────────────────
  it("Stage 4: Customer can manage wishlist items and shopping cart", async () => {
    // 4a. Add to Wishlist
    const wishRes = await request(app)
      .post("/api/wishlist/products")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ productId: featuredProduct._id });

    expect(wishRes.status).toBe(200);
    expect(wishRes.body.products).toBeDefined();

    // 4b. Add to Cart with quantity 2
    const cartRes = await request(app)
      .post("/api/cart/items")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({
        productId: featuredProduct._id,
        quantity: 2,
      });

    expect(cartRes.status).toBe(200);
    expect(cartRes.body.items).toBeDefined();
    expect(cartRes.body.items.length).toBeGreaterThanOrEqual(1);

    const cartItem = cartRes.body.items.find(
      (item) => (item.product._id || item.product).toString() === featuredProduct._id.toString()
    );
    expect(cartItem).toBeDefined();
    expect(cartItem.quantity).toBe(2);
  });

  // ── 5. Delivery Address & Shipping Selection ────────────────────────────────
  it("Stage 5: Customer can save verified delivery address and check pincode", async () => {
    // 5a. Check delivery eligibility for Bangalore pincode
    const deliveryCheckRes = await request(app)
      .get(`/api/products/${featuredProduct._id}/delivery-check?pincode=560001`);

    expect(deliveryCheckRes.status).toBe(200);
    expect(deliveryCheckRes.body.success).toBe(true);
    expect(deliveryCheckRes.body.serviceable).toBe(true);

    // 5b. Save delivery address
    const addrRes = await request(app)
      .post("/api/addresses")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({
        fullName: "Aarav Sharma",
        phone: "9876543210",
        addressLine1: "Flat 402, Pine Wood Apartments",
        addressLine2: "12th Main Road, Indiranagar",
        city: "Bengaluru",
        state: "Karnataka",
        pincode: "560001",
        type: "home",
        isDefault: true,
      });

    expect(addrRes.status).toBe(201);
    expect(addrRes.body.data._id).toBeDefined();
    expect(addrRes.body.data.postalCode).toBe("560001");
    savedAddressId = addrRes.body.data._id;
  });

  // ── 6. Coupon Validation & Server-Side Total Calculation ─────────────────────
  it("Stage 6: Server verifies coupon eligibility and computes definitive pricing", async () => {
    const calcRes = await request(app)
      .post("/api/orders/calculate")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({
        items: [{ product: featuredProduct._id, quantity: 2 }],
        couponCode: "JOURNEY20",
        deliverySpeed: "express",
      });

    expect(calcRes.status).toBe(200);
    expect(calcRes.body.success).toBe(true);
    const { itemsTotal, discountAmount, deliveryFee, totalAmount } = calcRes.body.data;

    // 14999 * 2 = 29998
    expect(itemsTotal).toBe(29998);
    // 20% of 29998 = 5999.6, capped at maxDiscountAmount (5000)
    expect(discountAmount).toBe(5000);
    // Express delivery fee is 199 (itemsTotal > 999 free standard + 199 express)
    expect(deliveryFee).toBe(199);
    // Total = 29998 - 5000 + 199 = 25197
    expect(totalAmount).toBe(25197);
  });

  // ── 7. Checkout & Order Creation ────────────────────────────────────────────
  it("Stage 7: Customer places order with COD and server enforces live stock/price", async () => {
    const orderRes = await request(app)
      .post("/api/orders")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({
        items: [{ product: featuredProduct._id, quantity: 2 }],
        shippingAddress: {
          fullName: "Aarav Sharma",
          phone: "9876543210",
          addressLine1: "Flat 402, Pine Wood Apartments",
          city: "Bengaluru",
          state: "Karnataka",
          pincode: "560001",
        },
        paymentMethod: "COD",
        couponCode: "JOURNEY20",
        deliverySpeed: "express",
      });

    expect(orderRes.status).toBe(201);
    expect(orderRes.body._id).toBeDefined();
    expect(orderRes.body.totalAmount).toBe(25197);
    expect(orderRes.body.paymentMethod).toBe("COD");
    expect(orderRes.body.status).toBe("Placed");

    placedOrderId = orderRes.body._id;
  });

  // ── 8. Payment Verification in Test Mode ────────────────────────────────────
  it("Stage 8: Online payment verification enforces authentic HMAC signature", async () => {
    // Wait 3.1s to respect the recent duplicate order rate limit protection
    await new Promise((r) => setTimeout(r, 3100));

    const fakeOrderId = "order_test_rzp_98765";
    const fakePaymentId = "pay_test_rzp_54321";

    // 8a. Tampered signature should be rejected with 400
    const tamperedRes = await request(app)
      .post("/api/orders")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({
        items: [{ product: featuredProduct._id, quantity: 1 }],
        shippingAddress: {
          fullName: "Aarav Sharma",
          phone: "9876543210",
          addressLine1: "Flat 402",
          city: "Bengaluru",
          state: "Karnataka",
          pincode: "560001",
        },
        paymentMethod: "ONLINE",
        razorpayOrderId: fakeOrderId,
        razorpayPaymentId: fakePaymentId,
        razorpaySignature: "invalid_forged_signature_hex",
      });

    expect(tamperedRes.status).toBe(400);
    expect(tamperedRes.body.message).toMatch(/signature/i);

    // 8b. Valid cryptographic HMAC signature passes signature verification
    const validSignature = crypto
      .createHmac("sha256", testKeySecret)
      .update(`${fakeOrderId}|${fakePaymentId}`)
      .digest("hex");

    // Standalone payment verification endpoint test
    const verifyRes = await request(app)
      .post("/api/payment/verify")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({
        razorpay_order_id: fakeOrderId,
        razorpay_payment_id: fakePaymentId,
        razorpay_signature: validSignature,
      });

    expect(verifyRes.status).toBe(200);
    expect(verifyRes.body.success).toBe(true);
    expect(verifyRes.body.message).toContain("verified");
  });

  // ── 9. Order Tracking & Inventory Updates ───────────────────────────────────
  it("Stage 9: Stock is decremented and customer can track order status", async () => {
    // 9a. Inventory verification (initial 10 - 2 purchased = 8 left)
    const productAfter = await Product.findById(featuredProduct._id);
    expect(productAfter.stock).toBe(8);

    // 9b. Customer can fetch order details by ID
    const trackRes = await request(app)
      .get(`/api/orders/${placedOrderId}`)
      .set("Authorization", `Bearer ${customerToken}`);

    expect(trackRes.status).toBe(200);
    expect(trackRes.body._id).toBe(placedOrderId);
    expect(trackRes.body.totalAmount).toBe(25197);

    // 9c. Order list for customer
    const myOrdersRes = await request(app)
      .get("/api/orders/my")
      .set("Authorization", `Bearer ${customerToken}`);

    expect(myOrdersRes.status).toBe(200);
    expect(myOrdersRes.body.some((o) => o._id === placedOrderId)).toBe(true);
  });

  // ── 10. Admin Authorization & Customer Data Isolation ──────────────────────
  it("Stage 10: Enforces data isolation between customers and protects admin endpoints", async () => {
    // 10a. Register User B
    const userBRes = await request(app)
      .post("/api/auth/register")
      .send({
        name: "Priya Patel",
        email: "priya.patel@example.com",
        password: "SecurePassword123!",
      });

    secondUser = userBRes.body;
    secondUserToken = userBRes.body.token;

    // 10b. User B attempts to access User A's order -> 403 Forbidden!
    const unauthorizedOrderRes = await request(app)
      .get(`/api/orders/${placedOrderId}`)
      .set("Authorization", `Bearer ${secondUserToken}`);

    expect(unauthorizedOrderRes.status).toBe(403);
    expect(unauthorizedOrderRes.body.message).toMatch(/not authorized/i);

    // 10c. Customer (non-admin) attempts to access admin dashboard -> 403 Forbidden
    const unauthAdminRes = await request(app)
      .get("/api/admin/dashboard")
      .set("Authorization", `Bearer ${customerToken}`);

    expect(unauthAdminRes.status).toBe(403);

    // 10d. Admin can access admin endpoints and manage the order
    const adminOrdersRes = await request(app)
      .get("/api/admin/orders")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(adminOrdersRes.status).toBe(200);
    expect(Array.isArray(adminOrdersRes.body)).toBe(true);
    expect(adminOrdersRes.body.some((o) => o._id === placedOrderId)).toBe(true);

    // Admin updates order status to "Shipped"
    const updateStatusRes = await request(app)
      .put(`/api/admin/orders/${placedOrderId}/status`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ status: "Shipped" });

    expect(updateStatusRes.status).toBe(200);
    expect(updateStatusRes.body.status).toBe("Shipped");
  });
});
