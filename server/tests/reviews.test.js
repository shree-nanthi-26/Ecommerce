import request from "supertest";
import app from "../app.js";
import Product from "../models/Product.js";
import User from "../models/User.js";
import Order from "../models/Order.js";
import Review from "../models/Review.js";
import generateToken from "../utils/generateToken.js";

describe("Review System Endpoints", () => {
  let customerUser;
  let customerToken;
  let otherUser;
  let otherToken;
  let testProduct;

  beforeAll(async () => {
    await User.deleteMany({});
    await Product.deleteMany({});
    await Order.deleteMany({});
    await Review.deleteMany({});

    customerUser = await User.create({
      name: "Saanvi Sharma",
      email: "saanvi@example.com",
      password: "password123",
      role: "customer",
    });
    customerToken = generateToken(customerUser._id);

    otherUser = await User.create({
      name: "Aarav Patel",
      email: "aarav@example.com",
      password: "password123",
      role: "customer",
    });
    otherToken = generateToken(otherUser._id);

    testProduct = await Product.create({
      name: "Oslo 3-Seater Fabric Sofa",
      category: "Sofas & Seating",
      price: 28999,
      stock: 15,
      rating: 0,
      reviews: 0,
      brand: "Furniva Atelier",
    });

    // Create a completed order for customerUser so verifiedPurchase becomes true
    await Order.create({
      user: customerUser._id,
      items: [
        {
          product: testProduct._id,
          name: testProduct.name,
          price: testProduct.price,
          quantity: 1,
        },
      ],
      shippingAddress: {
        fullName: "Saanvi Sharma",
        phone: "9876543210",
        addressLine1: "123 Green Avenue",
        city: "Bengaluru",
        state: "Karnataka",
        pincode: "560001",
      },
      paymentMethod: "ONLINE",
      totalAmount: 28999,
      status: "Delivered",
      isPaid: true,
    });
  });

  afterAll(async () => {
    await Review.deleteMany({});
    await Order.deleteMany({});
    await Product.deleteMany({});
    await User.deleteMany({});
  });

  it("should check review eligibility and detect verified purchase from order history", async () => {
    const res = await request(app)
      .get(`/api/reviews/product/${testProduct._id}/eligibility`)
      .set("Authorization", `Bearer ${customerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.canReview).toBe(true);
    expect(res.body.hasReviewed).toBe(false);
    expect(res.body.isVerifiedPurchase).toBe(true);
  });

  it("should create a verified review with images and update product average rating", async () => {
    const res = await request(app)
      .post(`/api/reviews/product/${testProduct._id}`)
      .set("Authorization", `Bearer ${customerToken}`)
      .send({
        rating: 5,
        title: "Flawless Craftsmanship & Comfort",
        comment: "This Oslo sofa completely transformed our living room. Soft linen fabric and excellent lumbar support.",
        images: [
          { url: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc", publicId: "test-img-1" },
        ],
      });

    expect(res.status).toBe(201);
    expect(res.body.review).toHaveProperty("_id");
    expect(res.body.review.rating).toBe(5);
    expect(res.body.review.verifiedPurchase).toBe(true);
    expect(res.body.review.images).toHaveLength(1);

    // Verify Product model rating was updated
    const updatedProd = await Product.findById(testProduct._id);
    expect(updatedProd.rating).toBe(5);
    expect(updatedProd.reviews).toBe(1);
  });

  it("should prevent duplicate reviews for the same product by the same user", async () => {
    const res = await request(app)
      .post(`/api/reviews/product/${testProduct._id}`)
      .set("Authorization", `Bearer ${customerToken}`)
      .send({
        rating: 4,
        title: "Trying duplicate",
        comment: "This should be blocked as duplicate review.",
      });

    expect(res.status).toBe(400);
  });

  it("should fetch reviews list with 5-star distribution breakdown", async () => {
    const res = await request(app).get(`/api/reviews/product/${testProduct._id}`);

    expect(res.status).toBe(200);
    expect(res.body.reviews).toHaveLength(1);
    expect(res.body.stats.totalReviews).toBe(1);
    expect(res.body.stats.averageRating).toBe(5);
    expect(res.body.stats.distribution["5"]).toBe(1);
  });

  it("should toggle helpful vote on a review", async () => {
    const review = await Review.findOne({ product: testProduct._id });

    // Other user votes helpful
    const res1 = await request(app)
      .post(`/api/reviews/${review._id}/helpful`)
      .set("Authorization", `Bearer ${otherToken}`);

    expect(res1.status).toBe(200);
    expect(res1.body.helpfulCount).toBe(1);
    expect(res1.body.isHelpful).toBe(true);

    // Other user toggles helpful off
    const res2 = await request(app)
      .post(`/api/reviews/${review._id}/helpful`)
      .set("Authorization", `Bearer ${otherToken}`);

    expect(res2.status).toBe(200);
    expect(res2.body.helpfulCount).toBe(0);
    expect(res2.body.isHelpful).toBe(false);
  });

  it("should allow user to update their review", async () => {
    const review = await Review.findOne({ product: testProduct._id });

    const res = await request(app)
      .put(`/api/reviews/${review._id}`)
      .set("Authorization", `Bearer ${customerToken}`)
      .send({
        rating: 4,
        title: "Updated: Great after 1 month of use",
        comment: "Still very comfortable, minor cushion settling as expected with natural filling.",
      });

    expect(res.status).toBe(200);
    expect(res.body.review.rating).toBe(4);

    const updatedProd = await Product.findById(testProduct._id);
    expect(updatedProd.rating).toBe(4);
  });
});
