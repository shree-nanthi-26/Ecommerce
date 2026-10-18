import {
  FiClock,
  FiLoader,
  FiUserCheck,
  FiCheckCircle,
  FiArchive,
} from "react-icons/fi";

const STATUS_CONFIG = {
  Open: {
    label: "Open",
    icon: FiClock,
    bg: "bg-sky-500/15 text-sky-800 dark:text-sky-300 border-sky-500/25",
    dot: "bg-sky-500",
  },
  "In Progress": {
    label: "In Progress",
    icon: FiLoader,
    bg: "bg-amber-500/15 text-amber-900 dark:text-amber-200 border-amber-500/25",
    dot: "bg-amber-500 animate-spin",
  },
  "Waiting for Customer": {
    label: "Waiting for Customer",
    icon: FiUserCheck,
    bg: "bg-indigo-500/15 text-indigo-900 dark:text-indigo-200 border-indigo-500/25",
    dot: "bg-indigo-500 animate-pulse",
  },
  Resolved: {
    label: "Resolved",
    icon: FiCheckCircle,
    bg: "bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border-emerald-500/25",
    dot: "bg-emerald-500",
  },
  Closed: {
    label: "Closed",
    icon: FiArchive,
    bg: "bg-neutral-500/15 text-neutral-700 dark:text-neutral-300 border-neutral-500/25",
    dot: "bg-neutral-400",
  },
};

export default function TicketStatusBadge({ status, size = "md", showDot = true }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.Open;
  const Icon = config.icon;

  const sizeClasses =
    size === "sm"
      ? "px-2 py-0.5 text-[11px] gap-1.5"
      : size === "lg"
      ? "px-3.5 py-1.5 text-sm gap-2"
      : "px-2.5 py-1 text-xs gap-1.5";

  return (
    <span
      className={`inline-flex items-center font-bold rounded-full border ${config.bg} ${sizeClasses}`}
    >
      {showDot && (
        <span
          className={`w-1.5 h-1.5 rounded-full shrink-0 ${config.dot}`}
          aria-hidden="true"
        />
      )}
      <Icon size={size === "sm" ? 11 : size === "lg" ? 15 : 13} className="shrink-0" />
      <span>{config.label}</span>
    </span>
  );
}
