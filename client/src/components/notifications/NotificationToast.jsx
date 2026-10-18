import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FiX, FiExternalLink } from "react-icons/fi";
import { useNotification } from "../../context/NotificationContext";
import { getNotificationConfig } from "../../utils/notificationTypes";

export default function NotificationToast() {
  const { latestToast, dismissToast } = useNotification();
  const navigate = useNavigate();

  useEffect(() => {
    if (!latestToast) return;
    const timer = setTimeout(() => {
      dismissToast();
    }, 5500);

    return () => clearTimeout(timer);
  }, [latestToast, dismissToast]);

  if (!latestToast) return null;

  const config = getNotificationConfig(latestToast.type);
  const IconComponent = config.icon;

  const handleClick = () => {
    dismissToast();
    if (latestToast.link) {
      navigate(latestToast.link);
    } else {
      navigate("/notifications");
    }
  };

  return (
    <div
      className="fixed bottom-6 right-6 z-50 max-w-sm w-[calc(100vw-3rem)] rounded-2xl p-4 shadow-2xl border border-[var(--color-border)] bg-[var(--color-surface)] flex items-start gap-3.5 animate-in slide-in-from-bottom-5 fade-in duration-300 cursor-pointer hover:shadow-xl transition-all"
      style={{
        borderLeft: `4px solid ${config.color}`,
        boxShadow: "0 15px 35px -5px rgba(0, 0, 0, 0.2)",
      }}
      onClick={handleClick}
      role="alert"
    >
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
        style={{
          backgroundColor: config.badgeBg,
          color: config.color,
          border: `1px solid ${config.badgeBorder}`,
        }}
      >
        <IconComponent size={20} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-1">
          <span
            className="text-[10px] font-bold tracking-wide uppercase px-1.5 py-0.5 rounded"
            style={{
              backgroundColor: config.badgeBg,
              color: config.badgeText,
            }}
          >
            {config.label}
          </span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              dismissToast();
            }}
            className="text-[var(--color-muted)] hover:text-[var(--color-heading)] p-1 rounded-md"
            aria-label="Dismiss toast"
          >
            <FiX size={14} />
          </button>
        </div>

        <h5 className="font-bold text-sm text-[var(--color-heading)] mt-1 truncate">
          {latestToast.title}
        </h5>
        <p className="text-xs text-[var(--color-body)] mt-0.5 line-clamp-2 leading-relaxed">
          {latestToast.message}
        </p>

        <div className="mt-2 flex items-center gap-1 text-[11px] font-semibold text-[var(--color-primary)]">
          <span>Click to view</span>
          <FiExternalLink size={11} />
        </div>
      </div>
    </div>
  );
}
