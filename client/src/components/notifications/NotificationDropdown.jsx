import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  FiCheck,
  FiVolume2,
  FiVolumeX,
  FiBellOff,
  FiArrowRight,
  FiZap,
  FiX,
} from "react-icons/fi";
import { useNotification } from "../../context/NotificationContext";
import NotificationCard from "./NotificationCard";

const TABS = [
  { id: "all", label: "All" },
  { id: "unread", label: "Unread" },
  { id: "orders", label: "Orders" },
  { id: "promos", label: "Deals & Alerts" },
];

export default function NotificationDropdown({ isOpen, onClose }) {
  const {
    notifications,
    unreadCount,
    markAllAsRead,
    seedDemoNotifications,
    soundEnabled,
    toggleSound,
    loading,
  } = useNotification();

  const [activeTab, setActiveTab] = useState("all");

  if (!isOpen) return null;

  // Filter items based on activeTab
  const filteredNotifications = notifications.filter((notif) => {
    if (activeTab === "unread") return !notif.isRead;
    if (activeTab === "orders") {
      return [
        "order_placed",
        "order_confirmed",
        "order_shipped",
        "out_for_delivery",
        "delivered",
        "return_update",
      ].includes(notif.type);
    }
    if (activeTab === "promos") {
      return ["price_drop", "back_in_stock", "new_deals"].includes(notif.type);
    }
    return true;
  });

  return (
    <div
      className="absolute right-0 top-full mt-3 w-[360px] sm:w-[440px] max-w-[calc(100vw-24px)] rounded-2xl shadow-2xl border border-[var(--color-border)] dark:border-stone-700 bg-[var(--color-surface)] z-50 overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-150"
      style={{
        boxShadow: "0 20px 40px -10px rgba(44, 39, 35, 0.22)",
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Notification center"
    >
      {/* Header */}
      <div className="px-5 py-3.5 border-b border-[var(--color-border)]/70 flex items-center justify-between gap-3 bg-[var(--color-surface-hover)]/30">
        <div className="flex items-center gap-2">
          <h3 className="font-bold text-base text-[var(--color-heading)]">
            Notifications
          </h3>
          {unreadCount > 0 && (
            <span
              className="px-2 py-0.5 rounded-full text-xs font-bold text-white shadow-xs"
              style={{ backgroundColor: "var(--color-primary)" }}
            >
              {unreadCount} new
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Sound toggle button */}
          <button
            type="button"
            onClick={toggleSound}
            className="p-1.5 rounded-lg text-[var(--color-muted)] hover:text-[var(--color-heading)] hover:bg-[var(--color-surface)] transition-colors"
            title={soundEnabled ? "Mute notification sounds" : "Enable notification sounds"}
            aria-label={soundEnabled ? "Mute sounds" : "Enable sounds"}
          >
            {soundEnabled ? <FiVolume2 size={16} /> : <FiVolumeX size={16} />}
          </button>

          {/* Mark all as read */}
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={markAllAsRead}
              className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--color-primary)] hover:underline px-2 py-1 rounded-md hover:bg-[var(--color-surface)] transition-colors"
              title="Mark all notifications as read"
            >
              <FiCheck size={14} />
              <span>Mark all read</span>
            </button>
          )}

          {/* Close button for mobile / clarity */}
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[var(--color-muted)] hover:text-[var(--color-heading)] hover:bg-[var(--color-surface)] transition-colors lg:hidden"
            aria-label="Close notification panel"
          >
            <FiX size={16} />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-4 py-2 border-b border-[var(--color-border)]/50 flex items-center gap-1.5 overflow-x-auto no-scrollbar bg-[var(--color-surface)]">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          let count = null;
          if (tab.id === "unread") count = unreadCount;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                isActive
                  ? "bg-[var(--color-primary)] text-white shadow-xs"
                  : "text-[var(--color-body)] hover:bg-[var(--color-surface-hover)]"
              }`}
            >
              {tab.label}
              {count > 0 && (
                <span
                  className={`ml-1.5 px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                    isActive ? "bg-white/20 text-white" : "bg-[var(--color-primary-light)]/20 text-[var(--color-primary)]"
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Notification List Body */}
      <div className="flex-1 overflow-y-auto p-3.5 space-y-1.5 max-h-[380px] custom-scrollbar">
        {loading && notifications.length === 0 ? (
          <div className="py-12 text-center text-xs text-[var(--color-muted)]">
            <div className="w-6 h-6 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <span>Loading notifications...</span>
          </div>
        ) : filteredNotifications.length > 0 ? (
          filteredNotifications.map((notification) => (
            <NotificationCard
              key={notification._id || notification.id}
              notification={notification}
              onCloseDropdown={onClose}
              compact
            />
          ))
        ) : (
          /* Empty State */
          <div className="py-10 px-4 text-center flex flex-col items-center justify-center">
            <div className="w-12 h-12 rounded-2xl bg-[var(--color-surface-hover)] flex items-center justify-center text-[var(--color-muted)] mb-3 shadow-inner">
              <FiBellOff size={22} />
            </div>
            <h4 className="text-sm font-semibold text-[var(--color-heading)]">
              No notifications here
            </h4>
            <p className="text-xs text-[var(--color-muted)] mt-1 max-w-[240px]">
              {activeTab === "unread"
                ? "You're all caught up! No unread notifications."
                : "You don't have any notifications in this section yet."}
            </p>
            <button
              type="button"
              onClick={seedDemoNotifications}
              className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[var(--color-surface-alt)] hover:bg-[var(--color-border)] text-[var(--color-heading)] transition"
            >
              <FiZap size={13} className="text-[var(--color-primary)]" />
              <span>Generate Demo Notifications</span>
            </button>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-[var(--color-border)]/70 bg-[var(--color-surface-hover)]/40 flex items-center justify-between text-xs font-medium">
        <button
          type="button"
          onClick={seedDemoNotifications}
          className="inline-flex items-center gap-1 text-[var(--color-muted)] hover:text-[var(--color-primary)] transition"
          title="Seed demo notifications for all 9 types"
        >
          <FiZap size={12} />
          <span>Demo Data</span>
        </button>

        <Link
          to="/notifications"
          onClick={onClose}
          className="inline-flex items-center gap-1.5 font-semibold text-[var(--color-primary)] hover:underline"
        >
          <span>View Notification Center</span>
          <FiArrowRight size={13} />
        </Link>
      </div>
    </div>
  );
}
