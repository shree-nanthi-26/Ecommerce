import Cart from "../models/Cart.js";
import Product from "../models/Product.js";

export async function getCart(req, res, next) {
  try {
    const cart = await Cart.findOne({ user: req.user._id }).populate("items.product");
    if (!cart) {
      return res.json({ items: [] });
    }
    res.json(cart);
  } catch (error) {
    next(error);
  }
}

export async function syncCart(req, res, next) {
  try {
    const { items = [] } = req.body;

    const updatedItems = [];
    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product) continue;
      updatedItems.push({
        product: product._id,
        quantity: item.quantity,
        price: product.price,
      });
    }

    const now = new Date();
    const cart = await Cart.findOneAndUpdate(
      { user: req.user._id },
      {
        items: updatedItems,
        lastActivityAt: now,
        isAbandoned: false,
        reminderCount: 0,
        lastReminderSentAt: null,
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    ).populate("items.product");

    res.json(cart);
  } catch (error) {
    next(error);
  }
}

export async function addItem(req, res, next) {
  try {
    const { productId, quantity = 1 } = req.body;
    const product = await Product.findById(productId);
    if (!product) {
      res.status(404);
      throw new Error("Product not found");
    }

    const now = new Date();
    let cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      cart = await Cart.create({
        user: req.user._id,
        items: [{ product: product._id, quantity, price: product.price }],
        lastActivityAt: now,
        isAbandoned: false,
        reminderCount: 0,
        lastReminderSentAt: null,
      });
    } else {
      const existing = cart.items.find((item) => item.product.toString() === productId);
      if (existing) {
        existing.quantity += quantity;
        existing.price = product.price;
      } else {
        cart.items.push({ product: product._id, quantity, price: product.price });
      }
      cart.lastActivityAt = now;
      cart.isAbandoned = false;
      cart.reminderCount = 0;
      cart.lastReminderSentAt = null;
      await cart.save();
    }

    await cart.populate("items.product");
    res.json(cart);
  } catch (error) {
    next(error);
  }
}

export async function updateItem(req, res, next) {
  try {
    const { productId } = req.params;
    const { quantity } = req.body;
    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      res.status(404);
      throw new Error("Cart not found");
    }

    const item = cart.items.find((i) => i.product.toString() === productId);
    if (!item) {
      res.status(404);
      throw new Error("Cart item not found");
    }

    if (quantity < 1) {
      cart.items = cart.items.filter((i) => i.product.toString() !== productId);
    } else {
      item.quantity = quantity;
      const product = await Product.findById(productId);
      item.price = product ? product.price : item.price;
    }

    cart.lastActivityAt = new Date();
    cart.isAbandoned = false;
    cart.reminderCount = 0;
    cart.lastReminderSentAt = null;
    await cart.save();
    await cart.populate("items.product");
    res.json(cart);
  } catch (error) {
    next(error);
  }
}

export async function removeItem(req, res, next) {
  try {
    const { productId } = req.params;
    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      res.status(404);
      throw new Error("Cart not found");
    }

    cart.items = cart.items.filter((i) => i.product.toString() !== productId);
    cart.lastActivityAt = new Date();
    cart.isAbandoned = false;
    cart.reminderCount = 0;
    cart.lastReminderSentAt = null;
    await cart.save();
    await cart.populate("items.product");
    res.json(cart);
  } catch (error) {
    next(error);
  }
}

export async function clearCart(req, res, next) {
  try {
    const cart = await Cart.findOneAndUpdate(
      { user: req.user._id },
      {
        items: [],
        lastActivityAt: new Date(),
        isAbandoned: false,
        reminderCount: 0,
        lastReminderSentAt: null,
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    ).populate("items.product");

    res.json(cart);
  } catch (error) {
    next(error);
  }
}
