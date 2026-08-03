import Wishlist from "../models/Wishlist.js";
import Product from "../models/Product.js";

export async function getWishlist(req, res, next) {
  try {
    const wishlist = await Wishlist.findOne({ user: req.user._id }).populate("products");
    if (!wishlist) {
      return res.json({ products: [] });
    }
    res.json(wishlist);
  } catch (error) {
    next(error);
  }
}

export async function syncWishlist(req, res, next) {
  try {
    const { productIds = [] } = req.body;
    const products = await Product.find({ _id: { $in: productIds } });
    const productSet = products.map((product) => product._id);

    const wishlist = await Wishlist.findOneAndUpdate(
      { user: req.user._id },
      { products: productSet },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    ).populate("products");

    res.json(wishlist);
  } catch (error) {
    next(error);
  }
}

export async function addProduct(req, res, next) {
  try {
    const { productId } = req.body;
    const product = await Product.findById(productId);
    if (!product) {
      res.status(404);
      throw new Error("Product not found");
    }

    let wishlist = await Wishlist.findOne({ user: req.user._id });
    if (!wishlist) {
      wishlist = await Wishlist.create({ user: req.user._id, products: [product._id] });
    } else if (!wishlist.products.some((id) => id.toString() === productId)) {
      wishlist.products.push(product._id);
      await wishlist.save();
    }

    await wishlist.populate("products");
    res.json(wishlist);
  } catch (error) {
    next(error);
  }
}

export async function removeProduct(req, res, next) {
  try {
    const { productId } = req.params;
    const wishlist = await Wishlist.findOne({ user: req.user._id });
    if (!wishlist) {
      res.status(404);
      throw new Error("Wishlist not found");
    }

    wishlist.products = wishlist.products.filter((id) => id.toString() !== productId);
    await wishlist.save();
    await wishlist.populate("products");
    res.json(wishlist);
  } catch (error) {
    next(error);
  }
}

export async function clearWishlist(req, res, next) {
  try {
    const wishlist = await Wishlist.findOneAndUpdate(
      { user: req.user._id },
      { products: [] },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    ).populate("products");

    res.json(wishlist);
  } catch (error) {
    next(error);
  }
}
