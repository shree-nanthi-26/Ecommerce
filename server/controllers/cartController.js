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

    const cart = await Cart.findOneAndUpdate(
      { user: req.user._id },
      { items: updatedItems },
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

    let cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      cart = await Cart.create({
        user: req.user._id,
        items: [{ product: product._id, quantity, price: product.price }],
      });
    } else {
      const existing = cart.items.find((item) => item.product.toString() === productId);
      if (existing) {
        existing.quantity += quantity;
        existing.price = product.price;
      } else {
        cart.items.push({ product: product._id, quantity, price: product.price });
      }
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
      { items: [] },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    ).populate("items.product");

    res.json(cart);
  } catch (error) {
    next(error);
  }
}
