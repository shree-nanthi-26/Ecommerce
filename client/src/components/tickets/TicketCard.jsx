import { FiMessageSquare, FiClock, FiChevronRight, FiPackage } from "react-icons/fi";
import TicketStatusBadge from "./TicketStatusBadge";
import TicketCategoryBadge from "./TicketCategoryBadge";

function formatDate(dateString) {
  if (!dateString) return "";
  const d = new Date(dateString);
  return d.toLocaleDateString("en-IN", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function timeAgo(dateString) {
  if (!dateString) return "";
  const now = new Date();
  const past = new Date(dateString);
  const diffMinutes = Math.floor((now - past) / (1000 * 60));

  if (diffMinutes < 1) return "Just now";
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDate(dateString);
}

export default function TicketCard({ ticket, onSelect, isSelected = false }) {
  const messageCount = ticket.messages?.length || 0;
  const lastMessage = ticket.messages?.[messageCount - 1];

  return (
    <div
      onClick={() => onSelect && onSelect(ticket)}
      className={`rounded-2xl p-5 border transition-all cursor-pointer text-left shadow-sm hover:shadow-md ${
        isSelected
          ? "border-[var(--color-accent)] ring-2 ring-[var(--color-accent)]/20 bg-[var(--color-surface)]"
          : "border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-accent)]/50 hover:bg-[var(--color-surface-hover)]"
      }`}
    >
      {/* Top Bar: ID, Category & Status */}
      <div className="flex items-center justify-between gap-2 mb-2.5 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-mono text-xs font-bold text-[var(--color-muted)]">
            #{ticket.ticketNumber}
          </span>
          <TicketCategoryBadge category={ticket.category} size="sm" />
        </div>
        <TicketStatusBadge status={ticket.status} size="sm" />
      </div>

      {/* Subject */}
      <h3 className="font-serif font-bold text-base sm:text-lg text-[var(--color-heading)] leading-snug line-clamp-1 mb-1.5">
        {ticket.subject}
      </h3>

      {/* Snippet from last message */}
      {lastMessage && (
        <p className="text-xs text-[var(--color-muted)] line-clamp-2 mb-3 leading-relaxed">
          <span className="font-semibold text-[var(--color-body)]">
            {lastMessage.senderRole === "admin" ? "Furniva Support: " : "You: "}
          </span>
          {lastMessage.message || "Attached images"}
        </p>
      )}

      {/* Footer Info */}
      <div className="flex items-center justify-between text-xs text-[var(--color-muted)] pt-3 border-t border-[var(--color-border)]/60">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="flex items-center gap-1" title="Last activity">
            <FiClock size={12} /> {timeAgo(ticket.lastMessageAt || ticket.updatedAt)}
          </span>

          <span className="flex items-center gap-1" title="Message count">
            <FiMessageSquare size={12} /> {messageCount}
          </span>

          {ticket.orderId && (
            <span className="flex items-center gap-1 font-mono text-[11px] bg-[var(--color-surface-alt)] px-2 py-0.5 rounded-md border border-[var(--color-border)]">
              <FiPackage size={11} /> {ticket.orderId}
            </span>
          )}
        </div>

        <FiChevronRight size={16} className="text-[var(--color-muted)] shrink-0" />
      </div>
    </div>
  );
}
