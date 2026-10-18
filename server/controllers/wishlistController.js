import Wishlist from "../models/Wishlist.js";
import Product from "../models/Product.js";
import Cart from "../models/Cart.js";

function formatWishlistResponse(wishlistDoc) {
  if (!wishlistDoc) {
    return { products: [], items: [] };
  }

  const items = [];
  const products = [];

  if (wishlistDoc.items && wishlistDoc.items.length > 0) {
    for (const item of wishlistDoc.items) {
      if (item.product) {
        const prodObj = item.product._id ? item.product.toObject() : item.product;
        const currentPrice = prodObj.price || 0;
        const priceWhenAdded = item.priceWhenAdded || currentPrice;
        const priceDrop = currentPrice < priceWhenAdded ? priceWhenAdded - currentPrice : 0;

        const enhancedItem = {
          ...prodObj,
          priceWhenAdded,
          priceDrop,
          notifyOnPriceDrop: Boolean(item.notifyOnPriceDrop),
          notifyOnRestock: Boolean(item.notifyOnRestock),
          addedAt: item.addedAt || wishlistDoc.createdAt,
        };

        items.push(enhancedItem);
        products.push(enhancedItem);
      }
    }
  } else if (wishlistDoc.products && wishlistDoc.products.length > 0) {
    // Migration fallback for legacy documents
    for (const prod of wishlistDoc.products) {
      if (prod) {
        const prodObj = prod._id ? prod.toObject() : prod;
        const enhancedItem = {
          ...prodObj,
          priceWhenAdded: prodObj.price || 0,
          priceDrop: 0,
          notifyOnPriceDrop: false,
          notifyOnRestock: false,
          addedAt: wishlistDoc.createdAt,
        };
        items.push(enhancedItem);
        products.push(enhancedItem);
      }
    }
  }

  return {
    _id: wishlistDoc._id,
    user: wishlistDoc.user,
    items,
    products,
    updatedAt: wishlistDoc.updatedAt,
  };
}

export async function getWishlist(req, res, next) {
  try {
    const wishlist = await Wishlist.findOne({ user: req.user._id })
      .populate("items.product")
      .populate("products");

    if (!wishlist) {
      return res.json({ products: [], items: [] });
    }

    res.json(formatWishlistResponse(wishlist));
  } catch (error) {
    next(error);
  }
}

export async function syncWishlist(req, res, next) {
  try {
    const { productIds = [] } = req.body;
    const products = await Product.find({ _id: { $in: productIds } });

    const newItems = products.map((p) => ({
      product: p._id,
      priceWhenAdded: p.price,
      notifyOnPriceDrop: false,
      notifyOnRestock: false,
      addedAt: new Date(),
    }));

    const productSet = products.map((product) => product._id);

    const wishlist = await Wishlist.findOneAndUpdate(
      { user: req.user._id },
      { items: newItems, products: productSet },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    )
      .populate("items.product")
      .populate("products");

    res.json(formatWishlistResponse(wishlist));
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
      wishlist = await Wishlist.create({
        user: req.user._id,
        items: [
          {
            product: product._id,
            priceWhenAdded: product.price,
            notifyOnPriceDrop: false,
            notifyOnRestock: false,
            addedAt: new Date(),
          },
        ],
        products: [product._id],
      });
    } else {
      const existingItemIndex = wishlist.items.findIndex(
        (it) => it.product.toString() === productId
      );

      if (existingItemIndex === -1) {
        wishlist.items.push({
          product: product._id,
          priceWhenAdded: product.price,
          notifyOnPriceDrop: false,
          notifyOnRestock: false,
          addedAt: new Date(),
        });
      }

      if (!wishlist.products.some((id) => id.toString() === productId)) {
        wishlist.products.push(product._id);
      }

      await wishlist.save();
    }

    await wishlist.populate("items.product");
    await wishlist.populate("products");

    res.json(formatWishlistResponse(wishlist));
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

    wishlist.items = wishlist.items.filter((it) => it.product.toString() !== productId);
    wishlist.products = wishlist.products.filter((id) => id.toString() !== productId);

    await wishlist.save();
    await wishlist.populate("items.product");
    await wishlist.populate("products");

    res.json(formatWishlistResponse(wishlist));
  } catch (error) {
    next(error);
  }
}

export async function clearWishlist(req, res, next) {
  try {
    const wishlist = await Wishlist.findOneAndUpdate(
      { user: req.user._id },
      { items: [], products: [] },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    res.json(formatWishlistResponse(wishlist));
  } catch (error) {
    next(error);
  }
}

/**
 * @desc    Toggle user notification consent preferences for price drops / restock
 * @route   PUT /api/wishlist/notifications/:productId
 * @access  Private
 */
export async function updateNotificationPreferences(req, res, next) {
  try {
    const { productId } = req.params;
    const { notifyOnPriceDrop, notifyOnRestock } = req.body;

    const wishlist = await Wishlist.findOne({ user: req.user._id });
    if (!wishlist) {
      res.status(404);
      throw new Error("Wishlist not found");
    }

    const item = wishlist.items.find((it) => it.product.toString() === productId);
    if (!item) {
      res.status(404);
      throw new Error("Product is not in your wishlist");
    }

    if (notifyOnPriceDrop !== undefined) item.notifyOnPriceDrop = Boolean(notifyOnPriceDrop);
    if (notifyOnRestock !== undefined) item.notifyOnRestock = Boolean(notifyOnRestock);

    await wishlist.save();
    await wishlist.populate("items.product");
    await wishlist.populate("products");

    res.status(200).json({
      success: true,
      message: "Notification preferences updated with your consent.",
      data: formatWishlistResponse(wishlist),
    });
  } catch (error) {
    next(error);
  }
}

/**
 * @desc    Move item directly from wishlist to user cart
 * @route   POST /api/wishlist/move-to-cart/:productId
 * @access  Private
 */
export async function moveToCart(req, res, next) {
  try {
    const { productId } = req.params;

    const product = await Product.findById(productId);
    if (!product) {
      res.status(404);
      throw new Error("Product not found");
    }

    if (product.stock <= 0) {
      res.status(400);
      throw new Error(`"${product.name}" is currently out of stock`);
    }

    // Add to cart
    let cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      cart = await Cart.create({
        user: req.user._id,
        items: [{ product: product._id, quantity: 1, price: product.price }],
      });
    } else {
      const existingItem = cart.items.find((it) => it.product.toString() === productId);
      if (existingItem) {
        if (existingItem.quantity < product.stock) {
          existingItem.quantity += 1;
        }
      } else {
        cart.items.push({ product: product._id, quantity: 1, price: product.price });
      }
      await cart.save();
    }

    // Remove from wishlist
    const wishlist = await Wishlist.findOne({ user: req.user._id });
    if (wishlist) {
      wishlist.items = wishlist.items.filter((it) => it.product.toString() !== productId);
      wishlist.products = wishlist.products.filter((id) => id.toString() !== productId);
      await wishlist.save();
      await wishlist.populate("items.product");
      await wishlist.populate("products");
    }

    res.status(200).json({
      success: true,
      message: `"${product.name}" moved to cart successfully!`,
      wishlist: formatWishlistResponse(wishlist),
    });
  } catch (error) {
    next(error);
  }
}
