import Wishlist from "../models/Wishlist.js";
import User from "../models/User.js";
import Notification from "../models/Notification.js";
import { sendEmail } from "../utils/sendEmail.js";
import {
  wishlistPriceDropTemplate,
  wishlistRestockTemplate,
} from "../emailTemplates/wishlistAlertTemplate.js";

/**
 * Create a persistent in-app notification for a specific user
 */
export async function createInAppNotification({
  userId,
  type,
  title,
  message,
  link = null,
  metadata = {},
}) {
  if (!userId || !type || !title || !message) {
    return null;
  }

  try {
    const notification = await Notification.create({
      user: userId,
      type,
      title,
      message,
      link,
      metadata,
    });
    return notification;
  } catch (err) {
    console.error("Failed to create in-app notification:", err);
    return null;
  }
}

/**
 * Broadcast an in-app notification to all active users (e.g., for New Deals or store announcements)
 */
export async function createBroadcastNotification({
  type = "new_deals",
  title,
  message,
  link = "/deals",
  metadata = {},
}) {
  try {
    const users = await User.find({}).select("_id");
    if (!users || users.length === 0) return [];

    const docs = users.map((u) => ({
      user: u._id,
      type,
      title,
      message,
      link,
      metadata,
    }));

    return await Notification.insertMany(docs);
  } catch (err) {
    console.error("Failed to broadcast notification:", err);
    return [];
  }
}

/**
 * Notify users who opted in when a product drops in price (email + in-app)
 */
export async function notifyWishlistPriceDrop(product, oldPrice, newPrice) {
  if (newPrice >= oldPrice) return;

  try {
    const discount = Math.round(((oldPrice - newPrice) / oldPrice) * 100);
    const wishlists = await Wishlist.find({
      "items.product": product._id,
      "items.notifyOnPriceDrop": true,
    }).populate("user", "name email");

    for (const wl of wishlists) {
      if (wl.user && wl.user._id) {
        const item = wl.items.find((it) => it.product.toString() === product._id.toString());
        if (item && item.notifyOnPriceDrop) {
          // 1. In-App Notification
          await createInAppNotification({
            userId: wl.user._id,
            type: "price_drop",
            title: `Price Drop: ${product.name}`,
            message: `Good news! ${product.name} is now ₹${newPrice.toLocaleString("en-IN")} (was ₹${oldPrice.toLocaleString("en-IN")}). Save ${discount}%!`,
            link: `/products/${product._id}`,
            metadata: {
              productId: product._id,
              productName: product.name,
              oldPrice,
              newPrice,
              discountPercent: discount,
            },
          });

          // 2. Email Notification
          if (wl.user.email) {
            const html = wishlistPriceDropTemplate(wl.user, product, oldPrice, newPrice);
            await sendEmail(
              wl.user.email,
              `Price Drop Alert: ${product.name} is now ₹${newPrice.toLocaleString("en-IN")}`,
              html
            ).catch((err) => console.error(`Failed to send price drop email to ${wl.user.email}:`, err));
          }
        }
      }
    }
  } catch (err) {
    console.error("Error dispatching price drop alerts:", err);
  }
}

/**
 * Notify users who opted in when a product is restocked (previous stock == 0 and new stock > 0)
 */
export async function notifyWishlistRestock(product, previousStock, newStock) {
  if (previousStock > 0 || newStock <= 0) return;

  try {
    const wishlists = await Wishlist.find({
      "items.product": product._id,
      "items.notifyOnRestock": true,
    }).populate("user", "name email");

    for (const wl of wishlists) {
      if (wl.user && wl.user._id) {
        const item = wl.items.find((it) => it.product.toString() === product._id.toString());
        if (item && item.notifyOnRestock) {
          // 1. In-App Notification
          await createInAppNotification({
            userId: wl.user._id,
            type: "back_in_stock",
            title: `Back in Stock: ${product.name}`,
            message: `Hooray! ${product.name} is back in stock with ${newStock} units available. Grab yours now before it sells out!`,
            link: `/products/${product._id}`,
            metadata: {
              productId: product._id,
              productName: product.name,
              stock: newStock,
            },
          });

          // 2. Email Notification
          if (wl.user.email) {
            const html = wishlistRestockTemplate(wl.user, product);
            await sendEmail(
              wl.user.email,
              `Back in Stock: ${product.name} is now available!`,
              html
            ).catch((err) => console.error(`Failed to send restock email to ${wl.user.email}:`, err));
          }
        }
      }
    }
  } catch (err) {
    console.error("Error dispatching restock alerts:", err);
  }
}
