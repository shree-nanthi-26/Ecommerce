import React from "react";
import {
  FiPackage,
  FiCheckCircle,
  FiTruck,
  FiMapPin,
  FiHome,
  FiRefreshCw,
  FiTrendingDown,
  FiLayers,
  FiTag,
  FiBell,
} from "react-icons/fi";

export const NOTIFICATION_TYPES = {
  ORDER_PLACED: "order_placed",
  ORDER_CONFIRMED: "order_confirmed",
  ORDER_SHIPPED: "order_shipped",
  OUT_FOR_DELIVERY: "out_for_delivery",
  DELIVERED: "delivered",
  RETURN_UPDATE: "return_update",
  PRICE_DROP: "price_drop",
  BACK_IN_STOCK: "back_in_stock",
  NEW_DEALS: "new_deals",
};

export const NOTIFICATION_CONFIG = {
  [NOTIFICATION_TYPES.ORDER_PLACED]: {
    label: "Order Placed",
    category: "orders",
    icon: FiPackage,
    color: "#6366F1", // Indigo
    badgeBg: "rgba(99, 102, 241, 0.12)",
    badgeBorder: "rgba(99, 102, 241, 0.25)",
    badgeText: "#4F46E5",
    defaultLink: "/orders",
  },
  [NOTIFICATION_TYPES.ORDER_CONFIRMED]: {
    label: "Order Confirmed",
    category: "orders",
    icon: FiCheckCircle,
    color: "#0284C7", // Sky blue
    badgeBg: "rgba(2, 132, 199, 0.12)",
    badgeBorder: "rgba(2, 132, 199, 0.25)",
    badgeText: "#0284C7",
    defaultLink: "/orders",
  },
  [NOTIFICATION_TYPES.ORDER_SHIPPED]: {
    label: "Order Shipped",
    category: "orders",
    icon: FiTruck,
    color: "#8B5CF6", // Purple
    badgeBg: "rgba(139, 92, 246, 0.12)",
    badgeBorder: "rgba(139, 92, 246, 0.25)",
    badgeText: "#7C3AED",
    defaultLink: "/orders",
  },
  [NOTIFICATION_TYPES.OUT_FOR_DELIVERY]: {
    label: "Out for Delivery",
    category: "orders",
    icon: FiMapPin,
    color: "#D97706", // Amber
    badgeBg: "rgba(217, 119, 6, 0.12)",
    badgeBorder: "rgba(217, 119, 6, 0.25)",
    badgeText: "#B45309",
    defaultLink: "/orders",
  },
  [NOTIFICATION_TYPES.DELIVERED]: {
    label: "Delivered",
    category: "orders",
    icon: FiHome,
    color: "#10B981", // Emerald
    badgeBg: "rgba(16, 185, 129, 0.12)",
    badgeBorder: "rgba(16, 185, 129, 0.25)",
    badgeText: "#059669",
    defaultLink: "/orders",
  },
  [NOTIFICATION_TYPES.RETURN_UPDATE]: {
    label: "Return Update",
    category: "returns",
    icon: FiRefreshCw,
    color: "#0D9488", // Teal
    badgeBg: "rgba(13, 148, 136, 0.12)",
    badgeBorder: "rgba(13, 148, 136, 0.25)",
    badgeText: "#0F766E",
    defaultLink: "/orders",
  },
  [NOTIFICATION_TYPES.PRICE_DROP]: {
    label: "Price Drop",
    category: "alerts",
    icon: FiTrendingDown,
    color: "#E11D48", // Rose
    badgeBg: "rgba(225, 29, 72, 0.12)",
    badgeBorder: "rgba(225, 29, 72, 0.25)",
    badgeText: "#BE123C",
    defaultLink: "/products",
  },
  [NOTIFICATION_TYPES.BACK_IN_STOCK]: {
    label: "Back in Stock",
    category: "alerts",
    icon: FiLayers,
    color: "#059669", // Green
    badgeBg: "rgba(5, 150, 105, 0.12)",
    badgeBorder: "rgba(5, 150, 105, 0.25)",
    badgeText: "#047857",
    defaultLink: "/products",
  },
  [NOTIFICATION_TYPES.NEW_DEALS]: {
    label: "New Deal",
    category: "deals",
    icon: FiTag,
    color: "#8B5E3C", // Furniva Warm Walnut Accent
    badgeBg: "rgba(139, 94, 60, 0.12)",
    badgeBorder: "rgba(139, 94, 60, 0.28)",
    badgeText: "#724C30",
    defaultLink: "/deals",
  },
};

export function getNotificationConfig(type) {
  return (
    NOTIFICATION_CONFIG[type] || {
      label: "Notification",
      category: "general",
      icon: FiBell,
      color: "#8B5E3C",
      badgeBg: "rgba(139, 94, 60, 0.12)",
      badgeBorder: "rgba(139, 94, 60, 0.25)",
      badgeText: "#8B5E3C",
      defaultLink: "/notifications",
    }
  );
}

/**
 * Format relative timestamp (e.g. "Just now", "5m ago", "2h ago", "Yesterday", "Oct 10, 2026")
 */
export function formatRelativeTime(dateInput) {
  if (!dateInput) return "";
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return "";

  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 45) {
    return "Just now";
  }
  if (diffInSeconds < 3600) {
    const mins = Math.max(1, Math.floor(diffInSeconds / 60));
    return `${mins}m ago`;
  }
  if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours}h ago`;
  }
  if (diffInSeconds < 172800) {
    return "Yesterday";
  }

  // Older dates
  return date.toLocaleDateString("en-IN", {
    month: "short",
    day: "numeric",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
}

/**
 * Format full date and time for tooltip display
 */
export function formatFullDateTime(dateInput) {
  if (!dateInput) return "";
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return "";

  return date.toLocaleString("en-IN", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Mock generator samples for all 9 types to facilitate simulator & quick preview
 */
export const SAMPLE_NOTIFICATIONS = [
  {
    type: NOTIFICATION_TYPES.ORDER_PLACED,
    title: "Order Placed Successfully",
    message: "Your order #FUR-84920 for Scandinavian Walnut Sofa has been received and verified.",
    link: "/orders",
    metadata: { orderId: "FUR-84920", amount: 48999 },
  },
  {
    type: NOTIFICATION_TYPES.ORDER_CONFIRMED,
    title: "Order Confirmed & In Preparation",
    message: "Payment and inventory confirmed for order #FUR-84920. Our artisans are carefully packing your items.",
    link: "/orders",
    metadata: { orderId: "FUR-84920" },
  },
  {
    type: NOTIFICATION_TYPES.ORDER_SHIPPED,
    title: "Order Shipped with BlueDart Express",
    message: "Your order #FUR-73019 is on the move with BlueDart Express (Tracking #BLU99482103).",
    link: "/orders",
    metadata: { orderId: "FUR-73019", trackingNumber: "BLU99482103", courier: "BlueDart" },
  },
  {
    type: NOTIFICATION_TYPES.OUT_FOR_DELIVERY,
    title: "Out for Delivery Today!",
    message: "Delivery agent Suresh Kumar is on the route to deliver order #FUR-73019 today. Please keep your phone reachable.",
    link: "/orders",
    metadata: { orderId: "FUR-73019", agent: "Suresh Kumar" },
  },
  {
    type: NOTIFICATION_TYPES.DELIVERED,
    title: "Delivered & Assembled Successfully",
    message: "Package for order #FUR-61042 was delivered and assembled at your address. Enjoy your handcrafted Furniva furniture!",
    link: "/orders",
    metadata: { orderId: "FUR-61042" },
  },
  {
    type: NOTIFICATION_TYPES.RETURN_UPDATE,
    title: "Return Request Approved",
    message: "Your return request #RET-4091 has been Approved. Doorstep pickup scheduled for tomorrow between 10 AM - 2 PM.",
    link: "/orders",
    metadata: { returnId: "RET-4091", status: "Approved" },
  },
  {
    type: NOTIFICATION_TYPES.PRICE_DROP,
    title: "Price Drop Alert: Minimalist Oak Desk",
    message: "Great news! Minimalist Oak Desk from your wishlist dropped from ₹18,499 to ₹14,999 (Save 19% today)!",
    link: "/products",
    metadata: { oldPrice: 18499, newPrice: 14999, discount: 19 },
  },
  {
    type: NOTIFICATION_TYPES.BACK_IN_STOCK,
    title: "Back in Stock: Velvet Lounge Accent Chair",
    message: "Your saved item 'Velvet Lounge Accent Chair' is back in stock with limited units remaining. Claim yours now!",
    link: "/products",
    metadata: { stock: 8 },
  },
  {
    type: NOTIFICATION_TYPES.NEW_DEALS,
    title: "Festive Living Room Sale — Flat 25% Off",
    message: "Limited time offer! Use coupon code FESTIVE25 on all premium Sofas and Coffee Tables this weekend.",
    link: "/deals",
    metadata: { couponCode: "FESTIVE25", discount: 25 },
  },
];
