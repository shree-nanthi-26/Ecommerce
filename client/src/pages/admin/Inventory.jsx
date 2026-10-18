import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  FiBox,
  FiAlertTriangle,
  FiCheckCircle,
  FiXCircle,
  FiRefreshCw,
  FiSearch,
  FiPlus,
  FiMinus,
  FiEdit2,
  FiClock,
  FiX,
  FiAlertCircle,
  FiTrendingUp,
} from "react-icons/fi";
import {
  getInventory,
  adjustStock,
  getInventoryHistory,
} from "../../services/inventoryService";

const STATUS_PILLS = [
  { key: "All", label: "All Items" },
  { key: "Healthy", label: "Healthy" },
  { key: "Low Stock", label: "Low Stock" },
  { key: "Critical", label: "Critical" },
  { key: "Out of Stock", label: "Out of Stock" },
];

const STATUS_COLORS = {
  Healthy: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  "Low Stock": "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  Critical: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20",
  "Out of Stock": "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
};

const ADJUST_REASONS = [
  "Restock",
  "Stock Correction",
  "Damaged / Defect",
  "Customer Return",
  "Physical Inventory Audit",
  "Other",
];

function AdminInventory() {
  const [items, setItems] = useState([]);
  const [summary, setSummary] = useState({
    totalProducts: 0,
    healthyCount: 0,
    lowStockCount: 0,
    criticalCount: 0,
    outOfStockCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");

  // Adjustment Modal
  const [adjustItem, setAdjustItem] = useState(null);
  const [adjustType, setAdjustType] = useState("add"); // "add", "subtract", "set"
  const [adjustValue, setAdjustValue] = useState("");
  const [adjustReason, setAdjustReason] = useState(ADJUST_REASONS[0]);
  const [adjustNotes, setAdjustNotes] = useState("");
  const [adjustError, setAdjustError] = useState("");
  const [adjustSuccess, setAdjustSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // History Drawer / Modal
  const [historyProduct, setHistoryProduct] = useState(null);
  const [historyList, setHistoryList] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const fetchInventoryData = async () => {
    try {
      setLoading(true);
      const res = await getInventory({
        status: selectedStatus !== "All" ? selectedStatus : undefined,
        search: searchTerm.trim() || undefined,
      });

      setItems(res.data || []);
      if (res.summary) {
        setSummary(res.summary);
      }
    } catch (err) {
      console.error("Failed to load inventory:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventoryData();
  }, [selectedStatus]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchInventoryData();
  };

  const handleOpenAdjust = (product, defaultType = "add") => {
    setAdjustItem(product);
    setAdjustType(defaultType);
    setAdjustValue(defaultType === "set" ? product.stock : 10);
    setAdjustReason(defaultType === "add" ? "Restock" : "Stock Correction");
    setAdjustNotes("");
    setAdjustError("");
    setAdjustSuccess("");
  };

  const handleAdjustSubmit = async (e) => {
    e.preventDefault();
    if (!adjustItem) return;
    setAdjustError("");
    setAdjustSuccess("");

    const val = Number(adjustValue);
    if (isNaN(val) || val < 0) {
      setAdjustError("Please enter a valid positive number");
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await adjustStock({
        productId: adjustItem._id,
        type: adjustType,
        value: val,
        reason: adjustReason,
        notes: adjustNotes.trim(),
      });

      setAdjustSuccess(res.message || "Stock adjusted successfully!");
      fetchInventoryData();

      setTimeout(() => {
        setAdjustItem(null);
      }, 1000);
    } catch (err) {
      setAdjustError(err.response?.data?.message || "Failed to adjust stock.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleViewHistory = async (product) => {
    setHistoryProduct(product);
    try {
      setHistoryLoading(true);
      const res = await getInventoryHistory({ productId: product._id });
      setHistoryList(res.data || []);
    } catch (err) {
      console.error("Failed to fetch history:", err);
    } finally {
      setHistoryLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[var(--color-heading)]">
            Inventory & Stock Control
          </h1>
          <p className="text-xs sm:text-sm text-[var(--color-muted)] mt-1">
            Real-time stock monitoring, automated low-stock warnings, restocking, and audit adjustment logs.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchInventoryData}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border text-xs font-bold transition hover:bg-[var(--color-surface-alt)] self-start sm:self-auto"
          style={{ borderColor: "var(--color-border)", color: "var(--color-heading)" }}
        >
          <FiRefreshCw size={14} className={loading ? "animate-spin" : ""} /> Refresh Stock
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-4">
        {/* Total SKUs */}
        <div
          className="p-4 sm:p-5 rounded-2xl border"
          style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-muted)]">
              Total SKUs
            </span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500">
              <FiBox size={16} />
            </div>
          </div>
          <p className="text-2xl font-black mt-2 text-[var(--color-heading)]">
            {summary.totalProducts}
          </p>
        </div>

        {/* Healthy */}
        <div
          className="p-4 sm:p-5 rounded-2xl border"
          style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              Healthy
            </span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
              <FiCheckCircle size={16} />
            </div>
          </div>
          <p className="text-2xl font-black mt-2 text-emerald-600 dark:text-emerald-400">
            {summary.healthyCount}
          </p>
        </div>

        {/* Low Stock */}
        <div
          className="p-4 sm:p-5 rounded-2xl border"
          style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
              Low Stock
            </span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
              <FiAlertTriangle size={16} />
            </div>
          </div>
          <p className="text-2xl font-black mt-2 text-amber-600 dark:text-amber-400">
            {summary.lowStockCount}
          </p>
        </div>

        {/* Critical */}
        <div
          className="p-4 sm:p-5 rounded-2xl border"
          style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-orange-600 dark:text-orange-400">
              Critical
            </span>
            <div className="p-2 rounded-xl bg-orange-500/10 text-orange-500">
              <FiAlertCircle size={16} />
            </div>
          </div>
          <p className="text-2xl font-black mt-2 text-orange-600 dark:text-orange-400">
            {summary.criticalCount}
          </p>
        </div>

        {/* Out of Stock */}
        <div
          className="p-4 sm:p-5 rounded-2xl border col-span-2 sm:col-span-1"
          style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">
              Out of Stock
            </span>
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-500">
              <FiXCircle size={16} />
            </div>
          </div>
          <p className="text-2xl font-black mt-2 text-rose-600 dark:text-rose-400">
            {summary.outOfStockCount}
          </p>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {STATUS_PILLS.map((p) => (
            <button
              key={p.key}
              onClick={() => setSelectedStatus(p.key)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                selectedStatus === p.key
                  ? "bg-[var(--color-accent)] text-white shadow-sm"
                  : "border text-[var(--color-muted)] hover:text-white"
              }`}
              style={{
                borderColor: selectedStatus === p.key ? "transparent" : "var(--color-border)",
                background: selectedStatus === p.key ? "var(--color-accent)" : "var(--color-surface)",
              }}
            >
              {p.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSearchSubmit} className="relative">
          <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-muted)]" size={16} />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search inventory by Product Name, SKU, or Category..."
            className="w-full pl-11 pr-24 py-3 rounded-2xl border text-xs focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
            style={{
              background: "var(--color-surface)",
              borderColor: "var(--color-border)",
              color: "var(--color-heading)",
            }}
          />
          <button
            type="submit"
            className="absolute right-2.5 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-xl text-xs font-bold text-white transition shadow-sm"
            style={{ background: "var(--color-accent)" }}
          >
            Search
          </button>
        </form>
      </div>

      {/* Inventory Table */}
      <div
        className="rounded-3xl border overflow-hidden shadow-sm"
        style={{
          background: "var(--color-surface)",
          borderColor: "var(--color-border)",
        }}
      >
        {loading ? (
          <div className="p-12 text-center text-xs text-[var(--color-muted)] animate-pulse">
            Loading real-time stock balances...
          </div>
        ) : items.length === 0 ? (
          <div className="p-12 text-center">
            <FiBox size={32} className="mx-auto text-[var(--color-muted)] mb-3 opacity-50" />
            <p className="text-base font-serif font-bold text-[var(--color-heading)]">
              No inventory records found
            </p>
            <p className="text-xs text-[var(--color-muted)] mt-1">
              Try adjusting your search query or status filter.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead
                className="border-b uppercase tracking-wider font-bold text-[11px]"
                style={{
                  background: "var(--color-surface-alt)",
                  borderColor: "var(--color-border)",
                  color: "var(--color-muted)",
                }}
              >
                <tr>
                  <th className="py-3.5 px-4">Product & Category</th>
                  <th className="py-3.5 px-4">SKU</th>
                  <th className="py-3.5 px-4">Current Stock</th>
                  <th className="py-3.5 px-4">Low-Stock Alert</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: "var(--color-border)" }}>
                {items.map((item) => (
                  <tr key={item._id} className="hover:bg-[var(--color-surface-alt)]/50 transition">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="h-10 w-10 rounded-xl overflow-hidden border shrink-0 bg-[var(--color-surface-alt)]"
                          style={{ borderColor: "var(--color-border)" }}
                        >
                          {item.images?.[0]?.url ? (
                            <img src={item.images[0].url} alt={item.name} className="h-full w-full object-cover" />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center text-[var(--color-muted)]">
                              <FiBox size={16} />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-[var(--color-heading)] truncate max-w-xs">{item.name}</p>
                          <p className="text-[11px] text-[var(--color-muted)]">{item.category}</p>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-mono font-bold text-[var(--color-muted)]">
                      {item.sku}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-sm text-[var(--color-heading)]">
                          {item.stock} units
                        </span>
                      </div>
                      <div className="w-24 h-1.5 bg-gray-200 dark:bg-gray-800 rounded-full mt-1 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            item.stock === 0
                              ? "bg-rose-500"
                              : item.stock <= (item.lowStockThreshold || 5)
                              ? "bg-amber-500"
                              : "bg-emerald-500"
                          }`}
                          style={{
                            width: `${Math.min(100, Math.max(8, (item.stock / 25) * 100))}%`,
                          }}
                        />
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-semibold text-[var(--color-muted)]">
                      ≤ {item.lowStockThreshold || 5} units
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold border ${
                          STATUS_COLORS[item.status] || "bg-gray-500/10"
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenAdjust(item, "add")}
                          className="px-2.5 py-1.5 rounded-xl border text-[11px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20 transition flex items-center gap-1"
                        >
                          <FiPlus size={12} /> Restock
                        </button>

                        <button
                          type="button"
                          onClick={() => handleOpenAdjust(item, "set")}
                          className="px-2.5 py-1.5 rounded-xl border text-[11px] font-bold transition hover:bg-[var(--color-surface-alt)] flex items-center gap-1"
                          style={{ borderColor: "var(--color-border)", color: "var(--color-heading)" }}
                        >
                          <FiEdit2 size={12} /> Adjust
                        </button>

                        <button
                          type="button"
                          onClick={() => handleViewHistory(item)}
                          className="p-1.5 rounded-xl border text-[var(--color-muted)] hover:text-white hover:bg-[var(--color-surface-alt)] transition"
                          style={{ borderColor: "var(--color-border)" }}
                          title="View Stock Audit History"
                        >
                          <FiClock size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Adjust Stock Modal */}
      {adjustItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div
            className="w-full max-w-md rounded-3xl p-6 sm:p-8 border shadow-2xl relative"
            style={{
              background: "var(--color-surface)",
              borderColor: "var(--color-border)",
              color: "var(--color-heading)",
            }}
          >
            <button
              onClick={() => setAdjustItem(null)}
              className="absolute top-6 right-6 p-2 rounded-full hover:bg-[var(--color-surface-alt)] transition"
              style={{ color: "var(--color-muted)" }}
            >
              <FiX size={20} />
            </button>

            <div className="flex items-center gap-3">
              <div
                className="p-3 rounded-2xl"
                style={{
                  background: "var(--color-accent-light)",
                  color: "var(--color-accent)",
                }}
              >
                <FiBox size={22} />
              </div>
              <div>
                <h2 className="text-xl font-serif font-bold">Adjust Inventory</h2>
                <p className="text-xs text-[var(--color-muted)] truncate max-w-xs">{adjustItem.name}</p>
              </div>
            </div>

            {/* Current Stock Banner */}
            <div
              className="mt-5 p-3.5 rounded-2xl border text-xs flex items-center justify-between"
              style={{
                background: "var(--color-surface-alt)",
                borderColor: "var(--color-border)",
              }}
            >
              <span className="text-[var(--color-muted)]">Current On-Hand Stock:</span>
              <span className="font-black text-sm text-[var(--color-heading)]">{adjustItem.stock} units</span>
            </div>

            {adjustError && (
              <div
                className="mt-4 p-3 rounded-xl border text-xs flex items-center gap-2"
                style={{
                  background: "rgba(239, 68, 68, 0.1)",
                  borderColor: "rgba(239, 68, 68, 0.3)",
                  color: "#EF4444",
                }}
              >
                <FiAlertCircle size={15} className="shrink-0" />
                <span>{adjustError}</span>
              </div>
            )}

            {adjustSuccess && (
              <div
                className="mt-4 p-3 rounded-xl border text-xs flex items-center gap-2"
                style={{
                  background: "rgba(16, 185, 129, 0.1)",
                  borderColor: "rgba(16, 185, 129, 0.3)",
                  color: "#10B981",
                }}
              >
                <FiCheckCircle size={15} className="shrink-0" />
                <span>{adjustSuccess}</span>
              </div>
            )}

            <form onSubmit={handleAdjustSubmit} className="mt-5 space-y-4 text-xs">
              {/* Adjustment Mode */}
              <div>
                <label className="block font-bold uppercase tracking-wider mb-1.5">Action</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setAdjustType("add");
                      setAdjustReason("Restock");
                    }}
                    className={`py-2 rounded-xl font-bold border transition ${
                      adjustType === "add"
                        ? "bg-emerald-600 text-white border-emerald-600"
                        : "border-[var(--color-border)] hover:bg-[var(--color-surface-alt)] text-[var(--color-muted)]"
                    }`}
                  >
                    + Add Units
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAdjustType("subtract");
                      setAdjustReason("Damaged / Defect");
                    }}
                    className={`py-2 rounded-xl font-bold border transition ${
                      adjustType === "subtract"
                        ? "bg-rose-600 text-white border-rose-600"
                        : "border-[var(--color-border)] hover:bg-[var(--color-surface-alt)] text-[var(--color-muted)]"
                    }`}
                  >
                    - Deduct Units
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAdjustType("set");
                      setAdjustReason("Physical Inventory Audit");
                    }}
                    className={`py-2 rounded-xl font-bold border transition ${
                      adjustType === "set"
                        ? "bg-[var(--color-accent)] text-white border-[var(--color-accent)]"
                        : "border-[var(--color-border)] hover:bg-[var(--color-surface-alt)] text-[var(--color-muted)]"
                    }`}
                  >
                    Set Exact
                  </button>
                </div>
              </div>

              {/* Quantity Value */}
              <div>
                <label className="block font-bold uppercase tracking-wider mb-1.5">
                  {adjustType === "set" ? "New Total Stock Count" : "Quantity to Adjust"}
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  value={adjustValue}
                  onChange={(e) => setAdjustValue(e.target.value)}
                  className="w-full p-2.5 rounded-xl border text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
                  style={{
                    background: "var(--color-surface-alt)",
                    borderColor: "var(--color-border)",
                    color: "var(--color-heading)",
                  }}
                />
              </div>

              {/* Reason */}
              <div>
                <label className="block font-bold uppercase tracking-wider mb-1.5">Adjustment Reason</label>
                <select
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  className="w-full p-2.5 rounded-xl border text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
                  style={{
                    background: "var(--color-surface-alt)",
                    borderColor: "var(--color-border)",
                    color: "var(--color-heading)",
                  }}
                >
                  {ADJUST_REASONS.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>

              {/* Internal Notes */}
              <div>
                <label className="block font-bold uppercase tracking-wider mb-1.5 text-[var(--color-muted)]">
                  Audit Notes (Optional)
                </label>
                <input
                  type="text"
                  value={adjustNotes}
                  onChange={(e) => setAdjustNotes(e.target.value)}
                  placeholder="e.g. PO #9817 received from manufacturer"
                  className="w-full p-2.5 rounded-xl border text-xs focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
                  style={{
                    background: "var(--color-surface-alt)",
                    borderColor: "var(--color-border)",
                    color: "var(--color-heading)",
                  }}
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t" style={{ borderColor: "var(--color-border)" }}>
                <button
                  type="button"
                  onClick={() => setAdjustItem(null)}
                  className="px-4 py-2 rounded-xl border font-bold text-xs transition hover:bg-[var(--color-surface-alt)]"
                  style={{ borderColor: "var(--color-border)", color: "var(--color-muted)" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl font-bold text-xs text-white shadow-md transition disabled:opacity-50"
                  style={{ background: "var(--color-accent)" }}
                >
                  {isSubmitting ? "Updating..." : "Save Stock Adjustment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* History Audit Drawer / Modal */}
      {historyProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div
            className="w-full max-w-2xl max-h-[85vh] rounded-3xl p-6 sm:p-8 border shadow-2xl relative flex flex-col"
            style={{
              background: "var(--color-surface)",
              borderColor: "var(--color-border)",
              color: "var(--color-heading)",
            }}
          >
            <button
              onClick={() => setHistoryProduct(null)}
              className="absolute top-6 right-6 p-2 rounded-full hover:bg-[var(--color-surface-alt)] transition"
              style={{ color: "var(--color-muted)" }}
            >
              <FiX size={20} />
            </button>

            <div className="flex items-center gap-3 border-b pb-4" style={{ borderColor: "var(--color-border)" }}>
              <div className="p-3 rounded-2xl bg-blue-500/10 text-blue-500">
                <FiClock size={22} />
              </div>
              <div>
                <h2 className="text-xl font-serif font-bold">Inventory History & Audit Logs</h2>
                <p className="text-xs text-[var(--color-muted)] truncate max-w-sm">{historyProduct.name}</p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto my-4 divide-y pr-1" style={{ borderColor: "var(--color-border)" }}>
              {historyLoading ? (
                <div className="py-12 text-center text-xs text-[var(--color-muted)] animate-pulse">
                  Loading history entries...
                </div>
              ) : historyList.length === 0 ? (
                <div className="py-12 text-center text-xs text-[var(--color-muted)]">
                  No adjustments recorded for this product yet.
                </div>
              ) : (
                historyList.map((log) => (
                  <div key={log._id} className="py-3.5 first:pt-0 last:pb-0 space-y-1 text-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className={`font-bold px-2 py-0.5 rounded-lg text-[11px] ${
                            log.quantityChange > 0
                              ? "bg-emerald-500/10 text-emerald-600"
                              : "bg-rose-500/10 text-rose-600"
                          }`}
                        >
                          {log.quantityChange > 0 ? `+${log.quantityChange}` : log.quantityChange} units
                        </span>
                        <span className="font-bold text-[var(--color-heading)]">{log.reason}</span>
                      </div>
                      <span className="text-[11px] text-[var(--color-muted)]">
                        {new Date(log.timestamp).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}{" "}
                        {new Date(log.timestamp).toLocaleTimeString("en-IN", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-[var(--color-muted)]">
                      <span>
                        Balance: {log.previousStock} → <span className="font-bold text-[var(--color-heading)]">{log.newStock} units</span>
                      </span>
                      <span>By: {log.adminName || log.admin?.name || "Admin"}</span>
                    </div>

                    {log.notes && (
                      <p className="text-[11px] text-[var(--color-muted)] bg-[var(--color-surface-alt)] p-2 rounded-lg mt-1">
                        Note: {log.notes}
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>

            <div className="border-t pt-3 flex justify-end" style={{ borderColor: "var(--color-border)" }}>
              <button
                type="button"
                onClick={() => setHistoryProduct(null)}
                className="px-4 py-2 rounded-xl border text-xs font-bold transition hover:bg-[var(--color-surface-alt)]"
                style={{ borderColor: "var(--color-border)", color: "var(--color-heading)" }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminInventory;
