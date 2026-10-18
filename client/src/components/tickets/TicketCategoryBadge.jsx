import {
  FiShoppingBag,
  FiCreditCard,
  FiTruck,
  FiBox,
  FiRefreshCw,
  FiHelpCircle,
} from "react-icons/fi";

const CATEGORY_CONFIG = {
  Order: {
    label: "Order",
    icon: FiShoppingBag,
    color: "text-amber-800 dark:text-amber-300 bg-amber-500/10 border-amber-500/20",
  },
  Payment: {
    label: "Payment",
    icon: FiCreditCard,
    color: "text-emerald-800 dark:text-emerald-300 bg-emerald-500/10 border-emerald-500/20",
  },
  Delivery: {
    label: "Delivery",
    icon: FiTruck,
    color: "text-blue-800 dark:text-blue-300 bg-blue-500/10 border-blue-500/20",
  },
  Product: {
    label: "Product",
    icon: FiBox,
    color: "text-purple-800 dark:text-purple-300 bg-purple-500/10 border-purple-500/20",
  },
  Return: {
    label: "Return",
    icon: FiRefreshCw,
    color: "text-rose-800 dark:text-rose-300 bg-rose-500/10 border-rose-500/20",
  },
  Other: {
    label: "Other",
    icon: FiHelpCircle,
    color: "text-neutral-700 dark:text-neutral-300 bg-neutral-500/10 border-neutral-500/20",
  },
};

export default function TicketCategoryBadge({ category, size = "md" }) {
  const config = CATEGORY_CONFIG[category] || CATEGORY_CONFIG.Other;
  const Icon = config.icon;

  const sizeClasses =
    size === "sm"
      ? "px-2 py-0.5 text-[11px] gap-1"
      : size === "lg"
      ? "px-3 py-1 text-sm gap-1.5"
      : "px-2.5 py-0.5 text-xs gap-1.5";

  return (
    <span
      className={`inline-flex items-center font-semibold rounded-lg border ${config.color} ${sizeClasses}`}
    >
      <Icon size={size === "sm" ? 11 : size === "lg" ? 14 : 12} className="shrink-0" />
      <span>{config.label}</span>
    </span>
  );
}
