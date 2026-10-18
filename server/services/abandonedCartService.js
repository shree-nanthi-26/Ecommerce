import crypto from "crypto";
import Cart from "../models/Cart.js";
import User from "../models/User.js";
import { sendEmail } from "../utils/sendEmail.js";
import { abandonedCartTemplate } from "../emailTemplates/abandonedCartTemplate.js";
import { createInAppNotification } from "./notificationService.js";

/**
 * Default configurations (Configurable via environment variables)
 */
export const DEFAULT_INACTIVITY_HOURS = 2; // Default 2 hours of cart inactivity
export const DEFAULT_MAX_REMINDERS = 1;     // Prevent spam: 1 reminder per abandoned session
export const DEFAULT_COOLDOWN_HOURS = 24;   // Minimum 24 hours between reminders if multi-step

export function getInactivityThresholdMs(customHours = null) {
  const hours =
    customHours !== null && customHours !== undefined
      ? Number(customHours)
      : Number(process.env.ABANDONED_CART_THRESHOLD_HOURS || DEFAULT_INACTIVITY_HOURS);
  return Math.max(1, hours) * 60 * 60 * 1000;
}

export function getMaxReminders() {
  return Number(process.env.MAX_ABANDONED_CART_REMINDERS || DEFAULT_MAX_REMINDERS);
}

export function getCooldownMs() {
  const hours = Number(process.env.ABANDONED_CART_COOLDOWN_HOURS || DEFAULT_COOLDOWN_HOURS);
  return hours * 60 * 60 * 1000;
}

/**
 * Detect abandoned carts based on inactivity threshold, reminder limits, and opt-out preferences
 */
export async function findAbandonedCarts({
  thresholdHours = null,
  maxReminders = null,
  limit = 100,
} = {}) {
  const thresholdMs = getInactivityThresholdMs(thresholdHours);
  const maxLimit = maxReminders !== null ? maxReminders : getMaxReminders();
  const cooldownMs = getCooldownMs();
  const cutoffDate = new Date(Date.now() - thresholdMs);

  // Find non-empty carts with inactivity past threshold and reminder count below max
  const query = {
    "items.0": { $exists: true },
    lastActivityAt: { $lte: cutoffDate },
    reminderCount: { $lt: maxLimit },
  };

  const candidateCarts = await Cart.find(query)
    .populate("user", "name email role emailPreferences unsubscribeToken")
    .populate("items.product", "name price images stock category brand")
    .sort({ lastActivityAt: 1 })
    .limit(limit);

  const eligibleCarts = [];
  let skippedOptOut = 0;
  let skippedCooldown = 0;

  for (const cart of candidateCarts) {
    if (!cart.user || !cart.user.email) continue;

    // 1. Opt-out check: Skip if user opted out of abandoned cart or marketing emails
    const prefs = cart.user.emailPreferences || {};
    if (prefs.abandonedCartEmails === false || prefs.marketingEmails === false) {
      skippedOptOut++;
      continue;
    }

    // 2. Cooldown check: Prevent excessive reminders
    if (cart.lastReminderSentAt) {
      const timeSinceLast = Date.now() - new Date(cart.lastReminderSentAt).getTime();
      if (timeSinceLast < cooldownMs) {
        skippedCooldown++;
        continue;
      }
    }

    eligibleCarts.push(cart);
  }

  return {
    candidateCount: candidateCarts.length,
    eligibleCarts,
    skippedOptOut,
    skippedCooldown,
    cutoffDate,
    thresholdMs,
  };
}

/**
 * Process abandoned cart reminders: sends email & records audit/tracking state
 */
export async function processAbandonedCarts({
  thresholdHours = null,
  maxReminders = null,
  dryRun = false,
  clientUrl = null,
} = {}) {
  const baseUrl = clientUrl || process.env.CLIENT_URL || "http://localhost:5173";
  const {
    candidateCount,
    eligibleCarts,
    skippedOptOut,
    skippedCooldown,
    cutoffDate,
  } = await findAbandonedCarts({ thresholdHours, maxReminders });

  let sentCount = 0;
  const errors = [];
  const processedCarts = [];

  for (const cart of eligibleCarts) {
    const user = cart.user;
    try {
      // Ensure user has a persistent secure unsubscribe token
      if (!user.unsubscribeToken) {
        user.unsubscribeToken = crypto.randomBytes(24).toString("hex");
        await user.save();
      }

      const unsubscribeUrl = `${baseUrl}/unsubscribe?token=${user.unsubscribeToken}&type=abandonedCart`;
      const html = abandonedCartTemplate(user, cart, baseUrl, unsubscribeUrl);
      const subject = "You left handcrafted furniture in your Furniva cart 🛋️";

      if (!dryRun) {
        // 1. Send Nodemailer email
        await sendEmail(user.email, subject, html);

        // 2. In-App Notification (also notifies within the web app)
        const itemCount = cart.items.length;
        await createInAppNotification({
          userId: user._id,
          type: "new_deals",
          title: "Items waiting in your cart",
          message: `You have ${itemCount} item${itemCount > 1 ? "s" : ""} waiting in your cart. Complete your order before items run out!`,
          link: "/cart",
          metadata: {
            cartItemsCount: itemCount,
            type: "abandoned_cart_reminder",
          },
        }).catch((err) => console.error("In-app abandoned cart notification error:", err));

        // 3. Update cart reminder timestamps & flags to prevent duplicate emails
        cart.reminderCount = (cart.reminderCount || 0) + 1;
        cart.lastReminderSentAt = new Date();
        cart.isAbandoned = true;
        await cart.save();
      }

      sentCount++;
      processedCarts.push({
        cartId: cart._id,
        userEmail: user.email,
        itemsCount: cart.items.length,
        reminderNumber: (cart.reminderCount || 0) + (dryRun ? 0 : 0),
      });
    } catch (err) {
      console.error(`Failed to send abandoned cart reminder to ${user.email}:`, err);
      errors.push({
        cartId: cart._id,
        email: user.email,
        error: err.message,
      });
    }
  }

  return {
    success: true,
    dryRun,
    cutoffDate,
    scanned: candidateCount,
    eligible: eligibleCarts.length,
    remindersSent: sentCount,
    skippedOptOut,
    skippedCooldown,
    processedCarts,
    errors,
  };
}

/**
 * Opt-out a user by their secure unsubscribeToken without requiring login
 */
export async function optOutByToken(token, preferenceType = "abandonedCart") {
  if (!token || typeof token !== "string") {
    throw new Error("Invalid or missing unsubscribe token");
  }

  const user = await User.findOne({ unsubscribeToken: token });
  if (!user) {
    throw new Error("Unsubscribe link is invalid or has expired");
  }

  if (!user.emailPreferences) {
    user.emailPreferences = {};
  }

  if (preferenceType === "all" || preferenceType === "marketing") {
    user.emailPreferences.marketingEmails = false;
    user.emailPreferences.abandonedCartEmails = false;
  } else {
    // Specifically abandonedCart
    user.emailPreferences.abandonedCartEmails = false;
  }

  await user.save();

  return {
    success: true,
    email: user.email,
    name: user.name,
    emailPreferences: user.emailPreferences,
    message: "You have been successfully unsubscribed from reminder emails.",
  };
}

/**
 * Update authenticated user's email preferences
 */
export async function updateUserEmailPreferences(userId, { marketingEmails, abandonedCartEmails }) {
  const user = await User.findById(userId);
  if (!user) {
    throw new Error("User not found");
  }

  if (!user.emailPreferences) {
    user.emailPreferences = {};
  }

  if (marketingEmails !== undefined) {
    user.emailPreferences.marketingEmails = Boolean(marketingEmails);
  }
  if (abandonedCartEmails !== undefined) {
    user.emailPreferences.abandonedCartEmails = Boolean(abandonedCartEmails);
  }

  await user.save();

  return {
    success: true,
    emailPreferences: user.emailPreferences,
  };
}
