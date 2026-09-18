import request from "supertest";
import app from "../app.js";
import Cart from "../models/Cart.js";
import Product from "../models/Product.js";
import User from "../models/User.js";
import generateToken from "../utils/generateToken.js";

describe("Cart Endpoints", () => {
  let customerToken;
  let productId;

  beforeAll(async () => {
    await User.deleteMany({});
    const user = await User.create({
      name: "Test Customer",
      email: "customer@example.com",
      password: "password123",
    });
    customerToken = generateToken(user._id);
  });

  beforeEach(async () => {
    await Product.deleteMany({});
    await Cart.deleteMany({});

    const p = await Product.create({
      name: "Oslo 3-Seater Fabric Sofa",
      category: "Sofas & Seating",
      price: 28999,
      stock: 10,
    });
    productId = p._id.toString();
  });

  it("should add an item to the cart", async () => {
    const res = await request(app)
      .post("/api/cart/items")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({
        productId,
        quantity: 2,
      });

    expect(res.status).toBe(200);
    expect(res.body.items).toHaveLength(1);
    expect(res.body.items[0].product.name).toBe("Oslo 3-Seater Fabric Sofa");
    expect(res.body.items[0].quantity).toBe(2);
  });

  it("should update item quantity in cart", async () => {
    const user = await User.findOne({ email: "customer@example.com" });
    await Cart.create({
      user: user._id,
      items: [{ product: productId, quantity: 1, price: 28999 }],
    });

    const res = await request(app)
      .put(`/api/cart/items/${productId}`)
      .set("Authorization", `Bearer ${customerToken}`)
      .send({
        quantity: 3,
      });

    expect(res.status).toBe(200);
    expect(res.body.items[0].quantity).toBe(3);
  });

  it("should remove an item from the cart", async () => {
    const user = await User.findOne({ email: "customer@example.com" });
    await Cart.create({
      user: user._id,
      items: [{ product: productId, quantity: 1, price: 80000 }],
    });

    const res = await request(app)
      .delete(`/api/cart/items/${productId}`)
      .set("Authorization", `Bearer ${customerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.items).toHaveLength(0);
  });
});
