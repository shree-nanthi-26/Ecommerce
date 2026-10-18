import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FiDollarSign,
  FiShoppingBag,
  FiUsers,
  FiBox,
  FiTrendingUp,
  FiAlertTriangle,
  FiLayers,
  FiCalendar,
  FiRefreshCw,
  FiArrowUpRight,
  FiArrowRight,
} from "react-icons/fi";
import { getDashboardStats } from "../../services/adminService";

const formatPrice = (val) => `₹${val?.toLocaleString("en-IN") || 0}`;

const TIMEFRAME_OPTIONS = [
  { key: "today", label: "Today" },
  { key: "7d", label: "7 Days" },
  { key: "30d", label: "30 Days" },
  { key: "3m", label: "3 Months" },
  { key: "1y", label: "1 Year" },
  { key: "custom", label: "Custom Range" },
];

function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeframe, setTimeframe] = useState("7d");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [chartMetric, setChartMetric] = useState("revenue"); // "revenue" or "orders"

  const fetchStats = async () => {
    try {
      setLoading(true);
      const params = { timeframe };
      if (timeframe === "custom" && startDate) {
        params.startDate = startDate;
        if (endDate) params.endDate = endDate;
      }
      const data = await getDashboardStats(params);
      setStats(data);
    } catch (err) {
      setError("Failed to load dashboard data. Is the server running?");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [timeframe]);

  const handleCustomDateApply = (e) => {
    e.preventDefault();
    if (startDate) {
      fetchStats();
    }
  };

  const metrics = stats?.metrics || {};
  const salesTimeline = stats?.salesTimeline || [];
  const bestSellingProducts = stats?.bestSellingProducts || [];
  const categoryBreakdown = stats?.categoryBreakdown || [];
  const lowStockProducts = stats?.lowStockProducts || [];
  const recentOrders = stats?.recentOrders || [];

  // Cards Configuration
  const cardStats = [
    {
      title: "Today's Revenue",
      value: formatPrice(metrics.todayRevenue),
      subtext: `${metrics.todayOrders || 0} order${metrics.todayOrders !== 1 ? "s" : ""} today`,
      icon: FiDollarSign,
      color: "var(--color-accent)",
      bg: "var(--color-accent-light)",
    },
    {
      title: timeframe === "today" ? "All-Time Revenue" : `Revenue (${TIMEFRAME_OPTIONS.find((t) => t.key === timeframe)?.label})`,
      value: formatPrice(metrics.filteredRevenue ?? metrics.totalRevenue),
      subtext: `All-time: ${formatPrice(metrics.totalRevenue)}`,
      icon: FiTrendingUp,
      color: "#10B981",
      bg: "rgba(16, 185, 129, 0.12)",
    },
    {
      title: "Orders in Period",
      value: metrics.filteredOrders ?? metrics.totalOrders ?? 0,
      subtext: `Avg Order Value: ${formatPrice(metrics.avgOrderValue)}`,
      icon: FiShoppingBag,
      color: "#3B82F6",
      bg: "rgba(59,130,246,0.12)",
    },
    {
      title: "Registered Customers",
      value: metrics.totalUsers || 0,
      subtext: "Verified user accounts",
      icon: FiUsers,
      color: "#EC4899",
      bg: "rgba(236,72,153,0.12)",
    },
    {
      title: "Active Products",
      value: metrics.totalProducts || 0,
      subtext: `${categoryBreakdown.length} categories`,
      icon: FiBox,
      color: "#8B5CF6",
      bg: "rgba(139,92,246,0.12)",
    },
    {
      title: "Low-Stock Items",
      value: metrics.lowStockProductsCount || 0,
      subtext: metrics.lowStockProductsCount > 0 ? "Needs immediate restock" : "All stocks healthy",
      icon: FiAlertTriangle,
      color: metrics.lowStockProductsCount > 0 ? "#F59E0B" : "#10B981",
      bg: metrics.lowStockProductsCount > 0 ? "rgba(245,158,11,0.12)" : "rgba(16,185,129,0.12)",
      link: "/admin/inventory",
    },
  ];

  // Max value for Chart scaling
  const maxChartValue = Math.max(
    ...salesTimeline.map((item) => (chartMetric === "revenue" ? item.revenue : item.orders)),
    chartMetric === "revenue" ? 1000 : 5
  );

  return (
    <div className="space-y-8">
      {/* Top Header & Timeframe Filters */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[var(--color-heading)]">
            Business & Executive Analytics
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-[var(--color-muted)]">
            Live business performance metrics, customer demand, and stock alerts.
          </p>
        </div>

        {/* Timeframe Filter Pills */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {TIMEFRAME_OPTIONS.map((opt) => (
            <button
              key={opt.key}
              onClick={() => setTimeframe(opt.key)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                timeframe === opt.key
                  ? "bg-[var(--color-accent)] text-white shadow-sm"
                  : "border text-[var(--color-muted)] hover:text-white"
              }`}
              style={{
                borderColor: timeframe === opt.key ? "transparent" : "var(--color-border)",
                background: timeframe === opt.key ? "var(--color-accent)" : "var(--color-surface)",
              }}
            >
              {opt.label}
            </button>
          ))}
          <button
            type="button"
            onClick={fetchStats}
            disabled={loading}
            className="p-2 rounded-xl border text-[var(--color-muted)] hover:text-white hover:bg-[var(--color-surface-alt)] transition"
            style={{ borderColor: "var(--color-border)" }}
            title="Refresh Analytics"
          >
            <FiRefreshCw size={14} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* Custom Date Range Picker (if custom selected) */}
      {timeframe === "custom" && (
        <form
          onSubmit={handleCustomDateApply}
          className="p-4 rounded-2xl border flex flex-wrap items-center gap-4 text-xs"
          style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}
        >
          <div className="flex items-center gap-2">
            <span className="font-bold">Start Date:</span>
            <input
              type="date"
              required
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="p-2 rounded-xl border font-semibold focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
              style={{ background: "var(--color-surface-alt)", borderColor: "var(--color-border)", color: "var(--color-heading)" }}
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="font-bold">End Date:</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="p-2 rounded-xl border font-semibold focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
              style={{ background: "var(--color-surface-alt)", borderColor: "var(--color-border)", color: "var(--color-heading)" }}
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 rounded-xl font-bold text-white shadow-sm transition"
            style={{ background: "var(--color-accent)" }}
          >
            Apply Range
          </button>
        </form>
      )}

      {/* Top 6 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {cardStats.map((card, idx) => {
          const Icon = card.icon;
          const content = (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: idx * 0.04 }}
              className="rounded-3xl p-5 border flex flex-col justify-between h-full shadow-sm hover:border-[var(--color-accent)] transition"
              style={{
                background: "var(--color-surface)",
                borderColor: "var(--color-border)",
              }}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-muted)]">
                  {card.title}
                </span>
                <div
                  className="flex h-9 w-9 items-center justify-center rounded-xl flex-shrink-0"
                  style={{ background: card.bg, color: card.color }}
                >
                  <Icon size={18} />
                </div>
              </div>

              <div>
                <p className="text-xl font-black text-[var(--color-heading)] tracking-tight">
                  {card.value}
                </p>
                <p className="text-[11px] mt-1 font-semibold text-[var(--color-muted)]">
                  {card.subtext}
                </p>
              </div>
            </motion.div>
          );

          return card.link ? (
            <Link key={card.title} to={card.link}>
              {content}
            </Link>
          ) : (
            <div key={card.title}>{content}</div>
          );
        })}
      </div>

      {/* Main Analytics: Revenue & Orders Timeline Chart */}
      <div
        className="rounded-3xl p-6 sm:p-8 border shadow-sm space-y-6"
        style={{
          background: "var(--color-surface)",
          borderColor: "var(--color-border)",
        }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-xl font-serif font-bold text-[var(--color-heading)] flex items-center gap-2">
              <FiTrendingUp style={{ color: "var(--color-accent)" }} />
              <span>Sales & Order Trends</span>
            </h2>
            <p className="text-xs text-[var(--color-muted)] mt-0.5">
              Continuous performance distribution across selected timeframe
            </p>
          </div>

          {/* Metric Toggle */}
          <div
            className="flex items-center p-1 rounded-xl border self-start sm:self-auto"
            style={{ background: "var(--color-surface-alt)", borderColor: "var(--color-border)" }}
          >
            <button
              type="button"
              onClick={() => setChartMetric("revenue")}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                chartMetric === "revenue"
                  ? "bg-[var(--color-accent)] text-white shadow-sm"
                  : "text-[var(--color-muted)]"
              }`}
            >
              Revenue (₹)
            </button>
            <button
              type="button"
              onClick={() => setChartMetric("orders")}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                chartMetric === "orders"
                  ? "bg-[var(--color-accent)] text-white shadow-sm"
                  : "text-[var(--color-muted)]"
              }`}
            >
              Order Count
            </button>
          </div>
        </div>

        {/* Interactive Responsive SVG Chart */}
        {salesTimeline.length === 0 ? (
          <div className="h-64 flex items-center justify-center text-xs text-[var(--color-muted)]">
            No sales data recorded in this period.
          </div>
        ) : (
          <div className="relative pt-6">
            <div className="flex items-end justify-between h-56 gap-2 sm:gap-3">
              {salesTimeline.map((item, idx) => {
                const val = chartMetric === "revenue" ? item.revenue : item.orders;
                const heightPct = Math.max(8, Math.round((val / maxChartValue) * 100));

                return (
                  <div key={item.date || idx} className="flex-1 flex flex-col items-center group relative h-full justify-end">
                    {/* Tooltip */}
                    <div className="absolute bottom-full mb-2 bg-black text-white text-[10px] rounded-xl px-2.5 py-1.5 opacity-0 group-hover:opacity-100 transition duration-200 pointer-events-none whitespace-nowrap z-20 shadow-xl border border-gray-800">
                      <p className="font-bold">{item.date}</p>
                      <p className="text-emerald-400 mt-0.5">Revenue: {formatPrice(item.revenue)}</p>
                      <p className="text-blue-400">Orders: {item.orders}</p>
                    </div>

                    {/* Bar */}
                    <div
                      className="w-full rounded-t-xl transition-all duration-500 hover:brightness-125"
                      style={{
                        height: `${heightPct}%`,
                        background:
                          chartMetric === "revenue"
                            ? "linear-gradient(180deg, var(--color-accent) 0%, #D97706 100%)"
                            : "linear-gradient(180deg, #3B82F6 0%, #1D4ED8 100%)",
                      }}
                    />

                    {/* X-axis Label */}
                    <span className="text-[9px] sm:text-[10px] mt-2 font-mono whitespace-nowrap text-[var(--color-muted)]">
                      {item.date ? item.date.slice(5) : ""}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Grid: Best-Selling Products & Category Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Best-Selling Products */}
        <div
          className="rounded-3xl p-6 sm:p-8 border space-y-5"
          style={{
            background: "var(--color-surface)",
            borderColor: "var(--color-border)",
          }}
        >
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-serif font-bold text-[var(--color-heading)] flex items-center gap-2">
              <FiBox className="text-[var(--color-accent)]" />
              <span>Top Best-Selling Furniture</span>
            </h2>
            <Link to="/admin/products" className="text-xs font-bold text-[var(--color-accent)] hover:underline flex items-center gap-1">
              All Products <FiArrowRight size={12} />
            </Link>
          </div>

          {bestSellingProducts.length === 0 ? (
            <p className="text-center text-xs py-8 text-[var(--color-muted)]">
              No product sales in this timeframe.
            </p>
          ) : (
            <div className="divide-y" style={{ borderColor: "var(--color-border)" }}>
              {bestSellingProducts.map((prod, idx) => (
                <div key={prod._id || idx} className="py-3.5 flex items-center justify-between gap-3 text-xs first:pt-0 last:pb-0">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="font-mono font-bold text-xs text-[var(--color-muted)] w-4">
                      #{idx + 1}
                    </span>
                    <div
                      className="h-10 w-10 rounded-xl overflow-hidden border shrink-0 bg-[var(--color-surface-alt)]"
                      style={{ borderColor: "var(--color-border)" }}
                    >
                      {prod.image ? (
                        <img src={prod.image} alt={prod.name} className="h-full w-full object-cover" />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-[var(--color-muted)]">
                          <FiBox size={14} />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-[var(--color-heading)] truncate">{prod.name}</p>
                      <p className="text-[11px] text-[var(--color-muted)] mt-0.5">
                        {prod.unitsSold} units sold • {prod.category || "Furniture"}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <p className="font-extrabold text-[var(--color-heading)]">
                      {formatPrice(prod.revenue)}
                    </p>
                    <p className="text-[10px] text-emerald-500 font-bold">Revenue</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Category Performance Breakdown */}
        <div
          className="rounded-3xl p-6 sm:p-8 border space-y-5"
          style={{
            background: "var(--color-surface)",
            borderColor: "var(--color-border)",
          }}
        >
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-serif font-bold text-[var(--color-heading)] flex items-center gap-2">
              <FiLayers className="text-blue-500" />
              <span>Category Portfolio</span>
            </h2>
            <span className="text-xs text-[var(--color-muted)]">{categoryBreakdown.length} active collections</span>
          </div>

          {categoryBreakdown.length === 0 ? (
            <p className="text-center text-xs py-8 text-[var(--color-muted)]">
              No categories recorded.
            </p>
          ) : (
            <div className="space-y-4">
              {categoryBreakdown.map((cat) => {
                const total = metrics?.totalProducts || 1;
                const pct = Math.round((cat.count / total) * 100);

                return (
                  <div key={cat._id} className="space-y-1.5 text-xs">
                    <div className="flex justify-between font-semibold">
                      <span className="text-[var(--color-heading)]">{cat._id}</span>
                      <span className="text-[var(--color-muted)]">
                        {cat.count} products ({pct}%) • {cat.totalStock || 0} in stock
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full overflow-hidden" style={{ background: "var(--color-surface-alt)" }}>
                      <div
                        className="h-full rounded-full transition-all duration-500"
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

      {/* Grid: Low Stock Warnings & Recent Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Low-Stock Watchlist */}
        <div
          className="rounded-3xl p-6 sm:p-8 border space-y-5"
          style={{
            background: "var(--color-surface)",
            borderColor: "var(--color-border)",
          }}
        >
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-serif font-bold text-[var(--color-heading)] flex items-center gap-2">
              <FiAlertTriangle className="text-amber-500" />
              <span>Low-Stock Warning Watchlist</span>
            </h2>
            <Link to="/admin/inventory" className="text-xs font-bold text-[var(--color-accent)] hover:underline flex items-center gap-1">
              Restock in Inventory <FiArrowRight size={12} />
            </Link>
          </div>

          {lowStockProducts.length === 0 ? (
            <div className="p-8 text-center text-xs text-emerald-500 font-bold">
              ✓ All products have healthy inventory levels.
            </div>
          ) : (
            <div className="divide-y" style={{ borderColor: "var(--color-border)" }}>
              {lowStockProducts.map((prod) => (
                <div key={prod._id} className="py-3 flex items-center justify-between gap-3 text-xs first:pt-0 last:pb-0">
                  <div className="min-w-0">
                    <p className="font-bold text-[var(--color-heading)] truncate">{prod.name}</p>
                    <p className="text-[11px] text-[var(--color-muted)]">
                      Threshold: ≤{prod.lowStockThreshold || 5} units • {prod.category}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <span
                      className={`font-black px-2.5 py-1 rounded-full text-xs ${
                        prod.stock === 0
                          ? "bg-rose-500/10 text-rose-500 border border-rose-500/20"
                          : "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                      }`}
                    >
                      {prod.stock === 0 ? "Out of Stock" : `${prod.stock} left`}
                    </span>
                    <Link
                      to="/admin/inventory"
                      className="px-2.5 py-1 rounded-lg border text-[11px] font-bold text-[var(--color-accent)] hover:bg-[var(--color-surface-alt)] transition"
                      style={{ borderColor: "var(--color-border)" }}
                    >
                      Restock
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Orders Live Table */}
        <div
          className="rounded-3xl p-6 sm:p-8 border space-y-5"
          style={{
            background: "var(--color-surface)",
            borderColor: "var(--color-border)",
          }}
        >
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-serif font-bold text-[var(--color-heading)] flex items-center gap-2">
              <FiShoppingBag className="text-emerald-500" />
              <span>Recent Orders</span>
            </h2>
            <Link to="/admin/orders" className="text-xs font-bold text-[var(--color-accent)] hover:underline flex items-center gap-1">
              All Orders <FiArrowRight size={12} />
            </Link>
          </div>

          {recentOrders.length === 0 ? (
            <p className="text-center text-xs py-8 text-[var(--color-muted)]">No orders found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b text-[11px] text-[var(--color-muted)]" style={{ borderColor: "var(--color-border)" }}>
                    <th className="pb-2">Order ID</th>
                    <th className="pb-2">Customer</th>
                    <th className="pb-2">Status</th>
                    <th className="pb-2 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: "var(--color-border)" }}>
                  {recentOrders.map((ord) => (
                    <tr key={ord._id} className="hover:bg-[var(--color-surface-alt)] transition">
                      <td className="py-2.5 font-mono font-bold text-[var(--color-accent)]">
                        <Link to={`/orders/${ord._id}/track`}>#{ord._id.slice(-6).toUpperCase()}</Link>
                      </td>
                      <td className="py-2.5 font-semibold text-[var(--color-heading)]">
                        {ord.user?.name || "Customer"}
                      </td>
                      <td className="py-2.5">
                        <span className="font-bold text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-500">
                          {ord.status}
                        </span>
                      </td>
                      <td className="py-2.5 text-right font-bold text-[var(--color-heading)]">
                        {formatPrice(ord.totalAmount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
