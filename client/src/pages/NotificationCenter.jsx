import React, { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import SEO from "../components/common/SEO";
import {
  FiBell,
  FiCheck,
  FiTrash2,
  FiSearch,
  FiFilter,
  FiZap,
  FiPackage,
  FiCheckCircle,
  FiTruck,
  FiMapPin,
  FiHome,
  FiRefreshCw,
  FiTrendingDown,
  FiLayers,
  FiTag,
  FiChevronRight,
  FiAlertCircle,
} from "react-icons/fi";
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";
import NotificationCard from "../components/notifications/NotificationCard";
import NotificationToast from "../components/notifications/NotificationToast";
import { useNotification } from "../context/NotificationContext";
import {
  NOTIFICATION_TYPES,
  SAMPLE_NOTIFICATIONS,
  getNotificationConfig,
} from "../utils/notificationTypes";

const CATEGORY_TABS = [
  { id: "all", label: "All Notifications" },
  { id: "unread", label: "Unread" },
  { id: "orders", label: "Orders" },
  { id: "returns", label: "Returns" },
  { id: "price_drop", label: "Price Drops" },
  { id: "back_in_stock", label: "Back in Stock" },
  { id: "new_deals", label: "Deals & Offers" },
];

export default function NotificationCenter() {
  const {
    notifications,
    unreadCount,
    markAllAsRead,
    clearAllNotifications,
    addNotification,
    seedDemoNotifications,
    loading,
  } = useNotification();

  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showSimulator, setShowSimulator] = useState(false);

  // Compute category counts for KPI bar
  const stats = useMemo(() => {
    let orderCount = 0;
    let alertCount = 0;
    let dealCount = 0;

    notifications.forEach((n) => {
      if (
        [
          "order_placed",
          "order_confirmed",
          "order_shipped",
          "out_for_delivery",
          "delivered",
          "return_update",
        ].includes(n.type)
      ) {
        orderCount++;
      } else if (["price_drop", "back_in_stock"].includes(n.type)) {
        alertCount++;
      } else if (n.type === "new_deals") {
        dealCount++;
      }
    });

    return {
      total: notifications.length,
      unread: unreadCount,
      orders: orderCount,
      alerts: alertCount,
      deals: dealCount,
    };
  }, [notifications, unreadCount]);

  // Filter and search
  const filteredNotifications = useMemo(() => {
    return notifications.filter((notif) => {
      // 1. Tab filter
      if (activeTab === "unread" && notif.isRead) return false;
      if (activeTab === "orders") {
        const orderTypes = [
          "order_placed",
          "order_confirmed",
          "order_shipped",
          "out_for_delivery",
          "delivered",
        ];
        if (!orderTypes.includes(notif.type)) return false;
      }
      if (activeTab === "returns" && notif.type !== "return_update") return false;
      if (activeTab === "price_drop" && notif.type !== "price_drop") return false;
      if (activeTab === "back_in_stock" && notif.type !== "back_in_stock") return false;
      if (activeTab === "new_deals" && notif.type !== "new_deals") return false;

      // 2. Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = notif.title?.toLowerCase().includes(q);
        const matchesMsg = notif.message?.toLowerCase().includes(q);
        const matchesType = notif.type?.toLowerCase().includes(q);
        if (!matchesTitle && !matchesMsg && !matchesType) return false;
      }

      return true;
    });
  }, [notifications, activeTab, searchQuery]);

  // Handler to trigger individual simulated notification
  const handleSimulateType = (sample) => {
    addNotification({
      type: sample.type,
      title: sample.title,
      message: sample.message,
      link: sample.link,
      metadata: sample.metadata,
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-bg)]">
      <SEO
        title={
          unreadCount > 0
            ? `(${unreadCount}) Notification Center | Furniva`
            : "Notification Center | Furniva"
        }
        description="Manage your notification updates and alerts."
        canonicalUrl="/notifications"
        noIndex={true}
      />

      <Navbar />
      <NotificationToast />

      <main className="flex-1 max-w-[1280px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        {/* Breadcrumb */}
        <nav
          className="flex items-center gap-2 text-xs text-[var(--color-muted)] mb-6 font-medium"
          aria-label="Breadcrumb"
        >
          <Link to="/" className="hover:text-[var(--color-primary)] transition">
            Home
          </Link>
          <FiChevronRight size={12} />
          <span className="text-[var(--color-heading)]">Notification Center</span>
        </nav>

        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[var(--color-border)]">
          <div>
            <div className="flex items-center gap-3">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm"
                style={{
                  backgroundColor: "var(--color-accent-light)",
                  color: "var(--color-primary)",
                }}
              >
                <FiBell size={24} />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--color-heading)] tracking-tight">
                  Notification Center
                </h1>
                <p className="text-sm text-[var(--color-body)] mt-0.5">
                  Real-time updates on orders, price drops, restocks, and deals
                </p>
              </div>
            </div>
          </div>

          {/* Top Actions */}
          <div className="flex items-center flex-wrap gap-2.5">
            <button
              type="button"
              onClick={() => setShowSimulator(!showSimulator)}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition border ${
                showSimulator
                  ? "bg-[var(--color-primary)] text-white border-[var(--color-primary)] shadow-sm"
                  : "bg-[var(--color-surface)] text-[var(--color-heading)] border-[var(--color-border)] hover:bg-[var(--color-surface-hover)]"
              }`}
            >
              <FiZap size={15} />
              <span>{showSimulator ? "Hide Simulator" : "Test Notification Types"}</span>
            </button>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllAsRead}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-[var(--color-surface)] hover:bg-[var(--color-surface-hover)] border border-[var(--color-border)] text-[var(--color-primary)] transition shadow-xs"
              >
                <FiCheck size={16} />
                <span>Mark All Read</span>
              </button>
            )}

            {notifications.length > 0 && (
              <button
                type="button"
                onClick={clearAllNotifications}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-[var(--color-surface)] hover:bg-rose-50 dark:hover:bg-rose-950/40 text-[var(--color-muted)] hover:text-rose-600 border border-[var(--color-border)] transition"
              >
                <FiTrash2 size={15} />
                <span>Clear All</span>
              </button>
            )}
          </div>
        </div>

        {/* KPI Stats Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 sm:gap-4 my-6">
          <div className="p-4 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] shadow-xs">
            <div className="text-xs text-[var(--color-muted)] font-medium">Total Inbox</div>
            <div className="text-2xl font-extrabold text-[var(--color-heading)] mt-1">
              {stats.total}
            </div>
          </div>
          <div className="p-4 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] shadow-xs">
            <div className="text-xs text-[var(--color-muted)] font-medium">Unread</div>
            <div className="text-2xl font-extrabold text-amber-600 dark:text-amber-400 mt-1">
              {stats.unread}
            </div>
          </div>
          <div className="p-4 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] shadow-xs">
            <div className="text-xs text-[var(--color-muted)] font-medium">Order Updates</div>
            <div className="text-2xl font-extrabold text-indigo-600 dark:text-indigo-400 mt-1">
              {stats.orders}
            </div>
          </div>
          <div className="p-4 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] shadow-xs">
            <div className="text-xs text-[var(--color-muted)] font-medium">Alerts & Deals</div>
            <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
              {stats.alerts + stats.deals}
            </div>
          </div>
        </div>

        {/* Interactive Notification Simulator (Demonstrates all 9 notification types) */}
        {showSimulator && (
          <div className="mb-8 p-5 sm:p-6 rounded-2xl bg-[var(--color-surface)] border-2 border-[var(--color-primary)]/30 shadow-md animate-in fade-in slide-in-from-top-4 duration-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[var(--color-border)]/60">
              <div>
                <div className="flex items-center gap-2">
                  <FiZap className="text-[var(--color-primary)]" size={18} />
                  <h3 className="text-base font-bold text-[var(--color-heading)]">
                    Notification System Simulator
                  </h3>
                </div>
                <p className="text-xs text-[var(--color-muted)] mt-0.5">
                  Click any of the 9 notification types below to test the reusable dispatcher, audio chime, and toast alerts in real time:
                </p>
              </div>

              <button
                type="button"
                onClick={seedDemoNotifications}
                className="shrink-0 px-3.5 py-1.5 rounded-lg text-xs font-bold text-white bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] transition shadow-xs"
              >
                + Seed All 9 Sample Types
              </button>
            </div>

            {/* 9 Type Buttons Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 mt-4">
              {SAMPLE_NOTIFICATIONS.map((sample) => {
                const cfg = getNotificationConfig(sample.type);
                const Icon = cfg.icon;

                return (
                  <button
                    key={sample.type}
                    type="button"
                    onClick={() => handleSimulateType(sample)}
                    className="p-2.5 rounded-xl border border-[var(--color-border)] hover:border-[var(--color-primary)] bg-[var(--color-surface-hover)]/30 hover:bg-[var(--color-surface)] text-left flex items-start gap-2.5 transition active:scale-95 group shadow-2xs"
                  >
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-transform group-hover:scale-110"
                      style={{
                        backgroundColor: cfg.badgeBg,
                        color: cfg.color,
                        border: `1px solid ${cfg.badgeBorder}`,
                      }}
                    >
                      <Icon size={15} />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-[var(--color-heading)] truncate">
                        {cfg.label}
                      </div>
                      <div className="text-[10px] text-[var(--color-muted)] truncate">
                        Emit notification
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Filters and Search Bar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full no-scrollbar">
            {CATEGORY_TABS.map((tab) => {
              const isActive = activeTab === tab.id;
              let badgeCount = null;
              if (tab.id === "all") badgeCount = notifications.length;
              if (tab.id === "unread") badgeCount = unreadCount;

              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all ${
                    isActive
                      ? "bg-[var(--color-primary)] text-white shadow-sm"
                      : "bg-[var(--color-surface)] text-[var(--color-body)] border border-[var(--color-border)] hover:bg-[var(--color-surface-hover)]"
                  }`}
                >
                  {tab.label}
                  {badgeCount !== null && badgeCount > 0 && (
                    <span
                      className={`ml-2 px-1.5 py-0.2 rounded-full text-[11px] font-bold ${
                        isActive
                          ? "bg-white/20 text-white"
                          : "bg-[var(--color-primary-light)]/15 text-[var(--color-primary)]"
                      }`}
                    >
                      {badgeCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Search Bar */}
          <div className="relative min-w-[240px] sm:min-w-[300px]">
            <FiSearch
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-muted)]"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search notifications or orders..."
              className="w-full pl-9 pr-4 py-2 rounded-xl text-xs sm:text-sm bg-[var(--color-surface)] border border-[var(--color-border)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/40 text-[var(--color-heading)] placeholder:text-[var(--color-muted)] transition"
            />
          </div>
        </div>

        {/* Notifications List */}
        <section aria-label="Notifications list">
          {loading && notifications.length === 0 ? (
            <div className="py-20 text-center text-sm text-[var(--color-muted)] bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)]">
              <div className="w-8 h-8 border-3 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <span>Loading notification inbox...</span>
            </div>
          ) : filteredNotifications.length > 0 ? (
            <div className="space-y-3">
              {filteredNotifications.map((notif) => (
                <NotificationCard
                  key={notif._id || notif.id}
                  notification={notif}
                  compact={false}
                />
              ))}
            </div>
          ) : (
            /* Empty State */
            <div className="py-20 px-6 text-center bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] flex flex-col items-center justify-center">
              <div className="w-16 h-16 rounded-2xl bg-[var(--color-surface-hover)] flex items-center justify-center text-[var(--color-muted)] mb-4 shadow-inner">
                <FiBell size={28} />
              </div>
              <h3 className="text-lg font-bold text-[var(--color-heading)]">
                {searchQuery ? "No matching notifications found" : "No notifications to display"}
              </h3>
              <p className="text-sm text-[var(--color-muted)] mt-1.5 max-w-sm">
                {searchQuery
                  ? `No notifications matched "${searchQuery}". Try a different keyword.`
                  : activeTab === "unread"
                  ? "Great job! You have read all notifications."
                  : "You haven't received any notifications in this section yet."}
              </p>
              <div className="mt-5 flex items-center gap-3">
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="px-4 py-2 rounded-xl text-xs font-semibold bg-[var(--color-surface-alt)] hover:bg-[var(--color-border)] text-[var(--color-heading)] transition"
                  >
                    Clear Search
                  </button>
                )}
                <button
                  type="button"
                  onClick={seedDemoNotifications}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)] transition shadow-xs flex items-center gap-1.5"
                >
                  <FiZap size={14} />
                  <span>Seed All 9 Notification Types</span>
                </button>
              </div>
            </div>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
}
