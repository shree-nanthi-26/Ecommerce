import request from "supertest";
import app from "../app.js";
import Product from "../models/Product.js";
import { extractQueryCriteria } from "../services/aiShoppingAssistantService.js";

describe("AI Shopping Assistant Endpoints & Grounding Engine", () => {
  beforeAll(async () => {
    // Seed test products matching various criteria if not already present
    await Product.deleteMany({ name: { $in: ["Test Oslo Sofa", "Test Luxury Couch", "Test Compact Dining Table"] } });

    await Product.create([
      {
        name: "Test Oslo Sofa",
        category: "Sofas & Seating",
        price: 24999,
        oldPrice: 29999,
        description: "Compact Scandinavian modern sofa ideal for small living rooms.",
        rating: 4.8,
        reviews: 120,
        stock: 12,
        specs: {
          material: "Solid Pine & Fabric",
          color: "Oatmeal Beige",
          dimensions: "195 × 85 × 80 cm",
          roomType: "Living Room",
          style: "Modern",
          seatingCapacity: "3",
        },
      },
      {
        name: "Test Luxury Couch",
        category: "Sofas & Seating",
        price: 55000,
        oldPrice: 65000,
        description: "Large luxury leather couch for grand spaces.",
        rating: 4.9,
        reviews: 210,
        stock: 5,
        specs: {
          material: "Italian Leather",
          color: "Dark Brown",
          dimensions: "260 × 100 × 90 cm",
          roomType: "Living Room",
          style: "Luxury",
          seatingCapacity: "4",
        },
      },
      {
        name: "Test Compact Dining Table",
        category: "Dining Tables",
        price: 18999,
        description: "Minimalist solid wood 4-seater dining table for cozy dining spaces.",
        rating: 4.7,
        reviews: 80,
        stock: 8,
        specs: {
          material: "Solid Sheesham Wood",
          color: "Honey Oak",
          dimensions: "120 × 80 × 75 cm",
          roomType: "Dining Room",
          style: "Modern",
          seatingCapacity: "4",
        },
      },
    ]);
  });

  afterAll(async () => {
    await Product.deleteMany({ name: { $in: ["Test Oslo Sofa", "Test Luxury Couch", "Test Compact Dining Table"] } });
  });

  describe("Query Criteria Extractor", () => {
    it("should extract budget, category, room type, style, and space constraints accurately", () => {
      const query = "I need a modern sofa for a small living room under ₹30,000";
      const criteria = extractQueryCriteria(query);

      expect(criteria.maxPrice).toBe(30000);
      expect(criteria.category).toBe("Sofas & Seating");
      expect(criteria.roomType).toBe("Living Room");
      expect(criteria.style).toBe("Modern");
      expect(criteria.spaceConstraint).toBe("small");
    });

    it("should parse 'below 25k' and material and color keywords", () => {
      const query = "Show beige fabric armchairs below 25k";
      const criteria = extractQueryCriteria(query);

      expect(criteria.maxPrice).toBe(25000);
      expect(criteria.category).toBe("Chairs");
      expect(criteria.material).toBe("Fabric");
      expect(criteria.color).toBe("Beige");
    });
  });

  describe("Shopping Assistant Chat API (POST /api/assistant/chat)", () => {
    it("should reject empty requests with 400", async () => {
      const res = await request(app)
        .post("/api/assistant/chat")
        .send({ message: "" });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it("should answer 'I need a modern sofa for a small living room under ₹30,000' with REAL database products", async () => {
      const res = await request(app)
        .post("/api/assistant/chat")
        .send({ message: "I need a modern sofa for a small living room under ₹30,000" });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBeDefined();
      expect(Array.isArray(res.body.products)).toBe(true);
      expect(res.body.products.length).toBeGreaterThan(0);

      // Verify Grounding & Zero-Hallucination:
      for (const product of res.body.products) {
        expect(product._id).toBeDefined();
        // Price MUST strictly respect the user's <= 30000 constraint
        expect(product.price).toBeLessThanOrEqual(30000);
        // Category must match Sofas & Seating
        expect(product.category).toMatch(/Sofa/i);

        // Verify product genuinely exists in MongoDB
        const dbProduct = await Product.findById(product._id);
        expect(dbProduct).not.toBeNull();
        expect(dbProduct.name).toBe(product.name);
        expect(dbProduct.price).toBe(product.price);
        expect(dbProduct.stock).toBe(product.stock);
      }
    });

    it("should provide suggested questions and parsed filter tags in the response", async () => {
      const res = await request(app)
        .post("/api/assistant/chat")
        .send({ message: "Show wooden dining tables under 25000" });

      expect(res.status).toBe(200);
      expect(res.body.parsedFilters).toBeDefined();
      expect(res.body.parsedFilters.category).toBe("Dining Tables");
      expect(Array.isArray(res.body.suggestedQuestions)).toBe(true);
      expect(res.body.suggestedQuestions.length).toBeGreaterThan(0);
    });
  });

  describe("Assistant Suggestions API (GET /api/assistant/suggestions)", () => {
    it("should return starter conversation prompts", async () => {
      const res = await request(app).get("/api/assistant/suggestions");

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.suggestions)).toBe(true);
      expect(res.body.suggestions.length).toBeGreaterThan(0);
      expect(res.body.suggestions[0]).toMatch(/sofa/i);
    });
  });
});
