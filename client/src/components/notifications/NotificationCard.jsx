import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { FiCheck, FiTrash2, FiExternalLink, FiClock } from "react-icons/fi";
import {
  getNotificationConfig,
  formatRelativeTime,
  formatFullDateTime,
} from "../../utils/notificationTypes";
import { useNotification } from "../../context/NotificationContext";

export default function NotificationCard({
  notification,
  onCloseDropdown,
  compact = false,
}) {
  const { markAsRead, deleteNotification } = useNotification();
  const navigate = useNavigate();

  const { _id, id, type, title, message, link, isRead, createdAt } =
    notification;
  const notifId = _id || id;
  const config = getNotificationConfig(type);
  const IconComponent = config.icon;

  const handleClick = (e) => {
    // If clicked on an action button, do not navigate
    if (e.target.closest("button")) return;

    if (!isRead) {
      markAsRead(notifId);
    }

    if (link) {
      if (onCloseDropdown) onCloseDropdown();
      navigate(link);
    }
  };

  const handleMarkRead = (e) => {
    e.stopPropagation();
    markAsRead(notifId);
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    deleteNotification(notifId);
  };

  return (
    <div
      onClick={handleClick}
      className={`group relative transition-all duration-200 cursor-pointer rounded-xl border ${
        compact ? "p-3.5 mb-2" : "p-4 sm:p-5 mb-3"
      } ${
        !isRead
          ? "bg-[var(--color-surface)] shadow-sm hover:shadow-md border-[var(--color-border)] dark:border-stone-700/60"
          : "bg-[var(--color-surface-hover)]/40 hover:bg-[var(--color-surface)] border-transparent opacity-85 hover:opacity-100"
      }`}
      style={{
        borderLeft: !isRead ? `4px solid ${config.color}` : undefined,
      }}
      role="article"
      aria-label={`${config.label}: ${title}`}
    >
      <div className="flex items-start gap-3.5">
        {/* Type Icon Badge */}
        <div
          className={`shrink-0 flex items-center justify-center rounded-xl shadow-xs transition-transform group-hover:scale-105 ${
            compact ? "w-9 h-9" : "w-11 h-11"
          }`}
          style={{
            backgroundColor: config.badgeBg,
            border: `1px solid ${config.badgeBorder}`,
            color: config.color,
          }}
        >
          <IconComponent size={compact ? 17 : 20} />
        </div>

        {/* Content Body */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            {/* Category / Type Badge */}
            <span
              className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold tracking-wide uppercase"
              style={{
                backgroundColor: config.badgeBg,
                color: config.badgeText,
              }}
            >
              {config.label}
            </span>

            {/* Timestamp with Tooltip */}
            <span
              className="inline-flex items-center gap-1 text-[11px] text-[var(--color-muted)] font-medium shrink-0 cursor-help"
              title={formatFullDateTime(createdAt)}
            >
              <FiClock size={11} className="opacity-70" />
              {formatRelativeTime(createdAt)}
            </span>
          </div>

          {/* Title */}
          <h4
            className={`font-semibold tracking-tight leading-snug truncate ${
              compact ? "text-xs sm:text-sm" : "text-sm sm:text-base"
            } ${
              !isRead
                ? "text-[var(--color-heading)] font-bold"
                : "text-[var(--color-body)]"
            }`}
          >
            {title}
          </h4>

          {/* Message Text */}
          <p
            className={`mt-1 text-[var(--color-body)] leading-relaxed ${
              compact ? "text-xs line-clamp-2" : "text-xs sm:text-sm line-clamp-3"
            }`}
          >
            {message}
          </p>

          {/* Action Row */}
          <div className="mt-2.5 flex items-center justify-between gap-3 pt-1 border-t border-[var(--color-border)]/40">
            {/* Link Preview / Destination */}
            {link ? (
              <span
                className="inline-flex items-center gap-1 text-[11px] font-medium text-[var(--color-primary)] hover:underline"
              >
                <span>View Details</span>
                <FiExternalLink size={11} />
              </span>
            ) : (
              <span />
            )}

            {/* Quick Actions (Mark Read & Delete) */}
            <div className="flex items-center gap-1.5 opacity-90 group-hover:opacity-100 transition-opacity">
              {!isRead && (
                <button
                  type="button"
                  onClick={handleMarkRead}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors"
                  title="Mark as read"
                  aria-label="Mark notification as read"
                >
                  <FiCheck size={12} />
                  {!compact && <span>Mark Read</span>}
                </button>
              )}

              <button
                type="button"
                onClick={handleDelete}
                className="p-1.5 rounded-md text-[var(--color-muted)] hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                title="Delete notification"
                aria-label="Delete notification"
              >
                <FiTrash2 size={13} />
              </button>
            </div>
          </div>
        </div>

        {/* Unread Indicator Dot */}
        {!isRead && (
          <span
            className="w-2.5 h-2.5 rounded-full shrink-0 self-center animate-pulse"
            style={{ backgroundColor: config.color }}
            title="Unread"
          />
        )}
      </div>
    </div>
  );
}
