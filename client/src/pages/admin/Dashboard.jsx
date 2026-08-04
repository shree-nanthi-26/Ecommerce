import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FiDollarSign,
  FiShoppingBag,
  FiUsers,
  FiShield,
  FiBox,
  FiTrendingUp,
  FiAlertTriangle,
} from "react-icons/fi";
import { getDashboardStats } from "../../services/adminService";

const formatPrice = (val) => `₹${val?.toLocaleString("en-IN") || 0}`;

function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchStats() {
      try {
        setLoading(true);
        const data = await getDashboardStats();
        setStats(data);
      } catch (err) {
        setError("Failed to load dashboard data. Is the server running?");
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center text-lg" style={{ color: "var(--color-muted)" }}>
        Loading dashboard analytics…
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="flex min-h-[400px] items-center justify-center text-lg text-rose-500">
        {error || "An unexpected error occurred."}
      </div>
    );
  }

  const { metrics, recentOrders, dailySales, categoryBreakdown } = stats;

  const cardStats = [
    {
      title: "Total Revenue",
      value: formatPrice(metrics.totalSales),
      icon: FiDollarSign,
      color: "var(--color-accent)",
      bg: "var(--color-accent-light)",
    },
    {
      title: "Total Orders",
      value: metrics.totalOrders,
      icon: FiShoppingBag,
      color: "#3B82F6",
      bg: "rgba(59,130,246,0.12)",
    },
    {
      title: "Total Products",
      value: metrics.totalProducts,
      icon: FiBox,
      color: "#8B5CF6",
      bg: "rgba(139,92,246,0.12)",
    },
    {
      title: "Registered Users",
      value: metrics.totalUsers,
      icon: FiUsers,
      color: "#EC4899",
      bg: "rgba(236,72,153,0.12)",
    },
  ];

  // Calculate max sales value for graph scaling
  const maxSale = dailySales.length > 0 ? Math.max(...dailySales.map((s) => s.sales)) : 1000;

  return (
    <div className="space-y-8">
      {/* Welcome header */}
      <div>
        <h1 className="text-3xl font-extrabold">Dashboard</h1>
        <p className="mt-1 text-sm" style={{ color: "var(--color-muted)" }}>
          Real-time summary of sales performance, users, and security logs
        </p>
      </div>

      {/* Analytics Card Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {cardStats.map((card, idx) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: idx * 0.05 }}
              className="rounded-3xl p-6 border flex items-center justify-between"
              style={{
                background: "var(--color-surface)",
                borderColor: "var(--color-border)",
              }}
            >
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--color-muted)" }}>
                  {card.title}
                </p>
                <p className="text-2xl font-black mt-1.5">{card.value}</p>
              </div>
              <div
                className="flex h-12 w-12 items-center justify-center rounded-2xl flex-shrink-0"
                style={{ background: card.bg, color: card.color }}
              >
                <Icon size={22} />
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* WAF Warning Alert Bar */}
      {metrics.recentAlertsCount > 0 && (
        <div
          className="flex items-center gap-3 rounded-2xl p-4 border"
          style={{
            background: "rgba(239, 68, 68, 0.08)",
            borderColor: "rgba(239, 68, 68, 0.2)",
            color: "var(--color-danger)",
          }}
        >
          <FiAlertTriangle size={22} className="flex-shrink-0" />
          <div className="text-sm">
            <span className="font-bold">Security Notice: </span>
            {metrics.recentAlertsCount} attack attempts blocked by WAF. There are currently {metrics.activeBlockedIPsCount} banned IPs.{" "}
            <Link to="/admin/attack-logs" className="underline font-bold hover:text-rose-400">
              View WAF logs
            </Link>
          </div>
        </div>
      )}

      {/* Main Charts & Analytics row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Sales Chart (Custom SVG based line chart for premium styling without chartjs bloat) */}
        <div
          className="lg:col-span-2 rounded-3xl p-6 border flex flex-col justify-between"
          style={{
            background: "var(--color-surface)",
            borderColor: "var(--color-border)",
          }}
        >
          <div>
            <div className="flex items-center gap-2 font-bold mb-4">
              <FiTrendingUp style={{ color: "var(--color-accent)" }} />
              <span>Weekly Sales Performance</span>
            </div>

            {dailySales.length === 0 ? (
              <div className="h-56 flex items-center justify-center text-sm" style={{ color: "var(--color-muted)" }}>
                No sales recorded in the last 7 days.
              </div>
            ) : (
              <div className="relative pt-6">
                {/* SVG Graph */}
                <div className="flex items-end justify-between h-48 gap-3">
                  {dailySales.map((day) => {
                    const heightPct = Math.max(10, Math.round((day.sales / maxSale) * 100));
                    return (
                      <div key={day._id} className="flex-1 flex flex-col items-center group relative">
                        {/* Tooltip */}
                        <div className="absolute bottom-full mb-2 bg-[#000] text-white text-[10px] rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition duration-200 pointer-events-none whitespace-nowrap z-10 font-mono shadow-md">
                          {formatPrice(day.sales)} ({day.count} order{day.count !== 1 ? "s" : ""})
                        </div>
                        {/* Bar */}
                        <div
                          className="w-full rounded-t-lg transition-all duration-500 hover:brightness-110"
                          style={{
                            height: `${heightPct}%`,
                            background: "linear-gradient(180deg, var(--color-accent) 0%, var(--color-primary) 100%)",
                          }}
                        />
                        <span className="text-[10px] mt-2 font-mono whitespace-nowrap" style={{ color: "var(--color-muted)" }}>
                          {day._id.split("-").slice(1).reverse().join("/")}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Category Breakdown Table */}
        <div
          className="rounded-3xl p-6 border"
          style={{
            background: "var(--color-surface)",
            borderColor: "var(--color-border)",
          }}
        >
          <div className="flex items-center gap-2 font-bold mb-6">
            <FiBox style={{ color: "var(--color-primary-light)" }} />
            <span>Category Distribution</span>
          </div>

          {categoryBreakdown.length === 0 ? (
            <p className="text-center text-sm py-10" style={{ color: "var(--color-muted)" }}>
              No categories found.
            </p>
          ) : (
            <div className="space-y-4">
              {categoryBreakdown.map((cat) => {
                const pct = Math.round((cat.count / metrics.totalProducts) * 100);
                return (
                  <div key={cat._id} className="space-y-1.5">
                    <div className="flex justify-between text-xs font-semibold">
                      <span>{cat._id}</span>
                      <span style={{ color: "var(--color-muted)" }}>{cat.count} products ({pct}%)</span>
                    </div>
                    <div className="h-2 w-full rounded-full" style={{ background: "var(--color-surface-alt)" }}>
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${pct}%`,
                          background: "var(--color-accent)",
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Recent Orders table */}
      <div
        className="rounded-3xl p-6 border"
        style={{
          background: "var(--color-surface)",
          borderColor: "var(--color-border)",
        }}
      >
        <div className="flex items-center justify-between mb-6">
          <div className="font-bold flex items-center gap-2">
            <FiShoppingBag style={{ color: "var(--color-accent)" }} />
            <span>Recent Orders</span>
          </div>
          <Link to="/admin/orders" className="text-xs font-bold transition" style={{ color: "var(--color-accent)" }}>
            View All Orders →
          </Link>
        </div>

        {recentOrders.length === 0 ? (
          <p className="text-center text-sm py-10" style={{ color: "var(--color-muted)" }}>
            No orders found.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b" style={{ borderColor: "var(--color-border)", color: "var(--color-muted)" }}>
                  <th className="pb-3 px-2 font-semibold">Order ID</th>
                  <th className="pb-3 px-2 font-semibold">Customer</th>
                  <th className="pb-3 px-2 font-semibold">Status</th>
                  <th className="pb-3 px-2 font-semibold">Payment</th>
                  <th className="pb-3 px-2 font-semibold text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: "var(--color-border)" }}>
                {recentOrders.map((ord) => (
                  <tr key={ord._id} className="hover:bg-[var(--color-surface-alt)] transition">
                    <td className="py-3 px-2 font-mono text-xs">
                      <Link to={`/orders/${ord._id}/track`} className="hover:text-[var(--color-accent)] font-bold">
                        #{ord._id.slice(-8).toUpperCase()}
                      </Link>
                    </td>
                    <td className="py-3 px-2">
                      <p className="font-bold text-xs">{ord.user?.name || "Deleted User"}</p>
                      <p className="text-[10px]" style={{ color: "var(--color-muted)" }}>{ord.user?.email}</p>
                    </td>
                    <td className="py-3 px-2">
                      <span
                        className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
                        style={{
                          background:
                            ord.status === "Delivered"
                              ? "rgba(16,185,129,0.12)"
                              : ord.status === "Cancelled"
                              ? "rgba(239,68,68,0.12)"
                              : "rgba(59,130,246,0.12)",
                          color:
                            ord.status === "Delivered"
                              ? "var(--color-success)"
                              : ord.status === "Cancelled"
                              ? "var(--color-danger)"
                              : "var(--color-primary-light)",
                        }}
                      >
                        {ord.status}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-xs font-semibold">
                      {ord.isPaid ? (
                        <span className="text-emerald-500">Paid</span>
                      ) : (
                        <span className="text-rose-500">Unpaid</span>
                      )}
                    </td>
                    <td className="py-3 px-2 text-right font-bold">{formatPrice(ord.totalAmount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
