import { useState, useEffect, useCallback } from "react";
import {
  FiActivity,
  FiSearch,
  FiUser,
  FiLayers,
  FiClock,
  FiGlobe,
  FiCopy,
  FiCheck,
  FiX,
  FiChevronLeft,
  FiChevronRight,
  FiRefreshCw,
  FiEye,
  FiShield,
} from "react-icons/fi";
import { getAuditLogs } from "../../services/adminService";

export default function AdminActivity() {
  const [logs, setLogs] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 15,
    total: 0,
    totalPages: 1,
    hasNext: false,
    hasPrev: false,
  });
  const [filterOptions, setFilterOptions] = useState({
    actions: [],
    resources: [],
    admins: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters state
  const [search, setSearch] = useState("");
  const [selectedAdmin, setSelectedAdmin] = useState("All");
  const [selectedAction, setSelectedAction] = useState("All");
  const [selectedResource, setSelectedResource] = useState("All");
  const [dateRange, setDateRange] = useState("all"); // "all", "today", "7d", "30d"
  const [copiedId, setCopiedId] = useState(null);

  // Value Inspector Modal
  const [inspectingLog, setInspectingLog] = useState(null);

  // Load audit logs from server
  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      let startDate = null;
      const now = new Date();
      if (dateRange === "today") {
        const start = new Date();
        start.setHours(0, 0, 0, 0);
        startDate = start.toISOString();
      } else if (dateRange === "7d") {
        const start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        startDate = start.toISOString();
      } else if (dateRange === "30d") {
        const start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        startDate = start.toISOString();
      }

      const res = await getAuditLogs({
        page: pagination.page,
        limit: pagination.limit,
        admin: selectedAdmin !== "All" ? selectedAdmin : undefined,
        action: selectedAction !== "All" ? selectedAction : undefined,
        resource: selectedResource !== "All" ? selectedResource : undefined,
        startDate: startDate || undefined,
        search: search.trim() || undefined,
      });

      if (res && res.logs) {
        setLogs(res.logs);
        if (res.pagination) setPagination(res.pagination);
        if (res.filterOptions) {
          setFilterOptions((prev) => ({
            actions: res.filterOptions.actions?.length ? res.filterOptions.actions : prev.actions,
            resources: res.filterOptions.resources?.length ? res.filterOptions.resources : prev.resources,
            admins: res.filterOptions.admins?.length ? res.filterOptions.admins : prev.admins,
          }));
        }
      } else if (Array.isArray(res)) {
        setLogs(res);
      }
    } catch (err) {
      console.error("Failed to fetch audit logs:", err);
      setError("Failed to load audit activity logs. Please verify permissions.");
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, selectedAdmin, selectedAction, selectedResource, dateRange, search]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // Copy helper
  const handleCopy = (id, text) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Reset filters
  const handleResetFilters = () => {
    setSearch("");
    setSelectedAdmin("All");
    setSelectedAction("All");
    setSelectedResource("All");
    setDateRange("all");
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  // Action badge color helper
  const getActionBadgeColor = (action) => {
    const act = (action || "").toUpperCase();
    if (act.includes("CREATE") || act.includes("ADD")) {
      return "text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 border-emerald-500/20";
    }
    if (act.includes("DELETE") || act.includes("REMOVE") || act.includes("BAN")) {
      return "text-rose-700 dark:text-rose-300 bg-rose-500/10 border-rose-500/20";
    }
    if (act.includes("BLOCK") || act.includes("TOGGLE") || act.includes("ROLE")) {
      return "text-amber-700 dark:text-amber-300 bg-amber-500/10 border-amber-500/20";
    }
    return "text-sky-700 dark:text-sky-300 bg-sky-500/10 border-sky-500/20";
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span
              className="px-2.5 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wider text-white"
              style={{ background: "var(--color-accent)" }}
            >
              Audit Trail
            </span>
            <span className="text-xs font-semibold text-[var(--color-muted)]">
              Tamper-Evident System Log
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[var(--color-heading)] flex items-center gap-2.5">
            <FiActivity className="text-[var(--color-accent)]" />
            <span>Admin Activity Logs</span>
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-[var(--color-muted)]">
            Detailed chronological record of administrator actions, resource revisions, and security events
          </p>
        </div>

        <button
          id="activity-refresh-btn"
          type="button"
          onClick={() => fetchLogs()}
          disabled={loading}
          className="self-start sm:self-auto px-4 py-2.5 rounded-xl border text-xs sm:text-sm font-semibold transition flex items-center gap-2 hover:bg-[var(--color-surface-alt)] text-[var(--color-heading)] border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm disabled:opacity-50"
        >
          <FiRefreshCw className={loading ? "animate-spin text-[var(--color-accent)]" : ""} size={14} />
          <span>Refresh Feed</span>
        </button>
      </div>

      {/* Filter Toolbar */}
      <div
        className="rounded-3xl p-5 sm:p-6 border shadow-sm space-y-4"
        style={{
          background: "var(--color-surface)",
          borderColor: "var(--color-border)",
        }}
      >
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <FiSearch
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-muted)]"
              size={16}
            />
            <input
              id="activity-search-input"
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
              placeholder="Search action, resource ID, IP, or admin..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
              style={{
                background: "var(--color-surface-alt)",
                borderColor: "var(--color-border)",
                color: "var(--color-heading)",
              }}
            />
          </div>

          {/* Quick Filters */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Admin Filter */}
            <select
              id="activity-admin-filter"
              value={selectedAdmin}
              onChange={(e) => {
                setSelectedAdmin(e.target.value);
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
              className="px-3 py-2.5 rounded-xl border text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
              style={{
                background: "var(--color-surface-alt)",
                borderColor: "var(--color-border)",
                color: "var(--color-heading)",
              }}
            >
              <option value="All">All Admins</option>
              {filterOptions.admins.map((adm) => (
                <option key={adm._id} value={adm._id}>
                  {adm.name} ({adm.email})
                </option>
              ))}
            </select>

            {/* Action Filter */}
            <select
              id="activity-action-filter"
              value={selectedAction}
              onChange={(e) => {
                setSelectedAction(e.target.value);
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
              className="px-3 py-2.5 rounded-xl border text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
              style={{
                background: "var(--color-surface-alt)",
                borderColor: "var(--color-border)",
                color: "var(--color-heading)",
              }}
            >
              <option value="All">All Actions</option>
              {filterOptions.actions.map((act) => (
                <option key={act} value={act}>
                  {act}
                </option>
              ))}
            </select>

            {/* Resource Filter */}
            <select
              id="activity-resource-filter"
              value={selectedResource}
              onChange={(e) => {
                setSelectedResource(e.target.value);
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
              className="px-3 py-2.5 rounded-xl border text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
              style={{
                background: "var(--color-surface-alt)",
                borderColor: "var(--color-border)",
                color: "var(--color-heading)",
              }}
            >
              <option value="All">All Resources</option>
              {filterOptions.resources.map((res) => (
                <option key={res} value={res}>
                  {res}
                </option>
              ))}
            </select>

            {/* Date Preset Filter */}
            <select
              id="activity-date-filter"
              value={dateRange}
              onChange={(e) => {
                setDateRange(e.target.value);
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
              className="px-3 py-2.5 rounded-xl border text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
              style={{
                background: "var(--color-surface-alt)",
                borderColor: "var(--color-border)",
                color: "var(--color-heading)",
              }}
            >
              <option value="all">All Dates</option>
              <option value="today">Today</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
            </select>

            {/* Reset Button */}
            {(search || selectedAdmin !== "All" || selectedAction !== "All" || selectedResource !== "All" || dateRange !== "all") && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="px-3 py-2.5 rounded-xl text-xs font-semibold text-rose-500 hover:bg-rose-500/10 transition flex items-center gap-1"
              >
                <FiX size={14} /> Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Table */}
      {error ? (
        <div className="p-8 text-center text-rose-500 bg-rose-500/10 rounded-3xl border border-rose-500/20 font-semibold text-sm">
          {error}
        </div>
      ) : loading ? (
        <div className="py-24 text-center">
          <div className="inline-block w-8 h-8 border-3 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-xs sm:text-sm text-[var(--color-muted)]">
            Loading activity log records...
          </p>
        </div>
      ) : logs.length === 0 ? (
        <div
          className="rounded-3xl p-16 text-center border shadow-sm"
          style={{
            background: "var(--color-surface)",
            borderColor: "var(--color-border)",
          }}
        >
          <div
            className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center mb-4 text-[var(--color-accent)]"
            style={{ background: "var(--color-surface-alt)" }}
          >
            <FiActivity size={32} />
          </div>
          <h2 className="text-xl font-serif font-bold text-[var(--color-heading)]">
            No Audit Logs Found
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-[var(--color-muted)] max-w-md mx-auto">
            {search || selectedAdmin !== "All" || selectedAction !== "All" || selectedResource !== "All" || dateRange !== "all"
              ? "No administrative activities match the current filters. Try resetting the criteria."
              : "No administrative activities have been logged yet."}
          </p>
          {(search || selectedAdmin !== "All" || selectedAction !== "All" || selectedResource !== "All" || dateRange !== "all") && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="mt-5 px-5 py-2.5 rounded-xl text-xs font-bold text-white transition hover:opacity-95"
              style={{ background: "var(--color-accent)" }}
            >
              Reset Filters
            </button>
          )}
        </div>
      ) : (
        <div
          className="rounded-3xl border shadow-sm overflow-hidden"
          style={{
            background: "var(--color-surface)",
            borderColor: "var(--color-border)",
          }}
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm border-collapse">
              <thead>
                <tr
                  className="border-b text-[11px] font-bold uppercase tracking-wider"
                  style={{
                    borderColor: "var(--color-border)",
                    color: "var(--color-muted)",
                    background: "var(--color-surface-alt)",
                  }}
                >
                  <th className="py-4 px-5">Admin / User</th>
                  <th className="py-4 px-4">Action</th>
                  <th className="py-4 px-4">Resource</th>
                  <th className="py-4 px-4">Resource ID</th>
                  <th className="py-4 px-4">State & Changes</th>
                  <th className="py-4 px-4">IP Address</th>
                  <th className="py-4 px-5">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: "var(--color-border)" }}>
                {logs.map((log) => {
                  const logId = log._id || log.id;
                  const hasValues = log.oldValue !== null || log.newValue !== null;
                  const targetType = log.target?.type || "System";
                  const targetId = log.target?.id || "N/A";

                  return (
                    <tr
                      key={logId}
                      className="hover:bg-[var(--color-surface-alt)]/60 transition group"
                    >
                      {/* Admin / User */}
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-2.5">
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs uppercase shrink-0"
                            style={{
                              background: "var(--color-surface-alt)",
                              color: "var(--color-accent)",
                              border: "1px solid var(--color-border)",
                            }}
                          >
                            {log.admin?.name ? log.admin.name.slice(0, 2) : <FiUser size={14} />}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-xs text-[var(--color-heading)] truncate">
                              {log.admin?.name || "System Automated"}
                            </p>
                            <p className="text-[11px] text-[var(--color-muted)] truncate">
                              {log.admin?.email || "internal@furniva.com"}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Action */}
                      <td className="py-4 px-4">
                        <span
                          className={`inline-block font-mono text-[11px] font-bold px-2.5 py-1 rounded-lg border ${getActionBadgeColor(
                            log.action
                          )}`}
                        >
                          {log.action}
                        </span>
                        {log.reason && (
                          <p className="text-[11px] text-[var(--color-muted)] mt-1 line-clamp-1 italic">
                            “{log.reason}”
                          </p>
                        )}
                      </td>

                      {/* Resource */}
                      <td className="py-4 px-4">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-[var(--color-surface-alt)] text-[var(--color-heading)] border border-[var(--color-border)]">
                          <FiLayers size={11} className="text-[var(--color-muted)]" />
                          <span>{targetType}</span>
                        </span>
                      </td>

                      {/* Resource ID */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-1.5 font-mono text-xs text-[var(--color-heading)]">
                          <span className="truncate max-w-[120px] sm:max-w-[160px]" title={targetId}>
                            {targetId}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopy(logId, targetId)}
                            className="p-1 rounded text-[var(--color-muted)] hover:text-[var(--color-heading)] transition"
                            title="Copy Resource ID"
                          >
                            {copiedId === logId ? (
                              <FiCheck size={12} className="text-emerald-500" />
                            ) : (
                              <FiCopy size={12} />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* Previous Value & New Value Preview */}
                      <td className="py-4 px-4">
                        {hasValues ? (
                          <button
                            type="button"
                            onClick={() => setInspectingLog(log)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition border border-[var(--color-border)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-alt)] text-[var(--color-accent)] hover:underline"
                          >
                            <FiEye size={12} />
                            <span>Inspect Diff</span>
                          </button>
                        ) : (
                          <span className="text-xs text-[var(--color-muted)] italic">
                            No delta recorded
                          </span>
                        )}
                      </td>

                      {/* IP Information */}
                      <td className="py-4 px-4 font-mono text-xs text-[var(--color-muted)]">
                        <span className="inline-flex items-center gap-1">
                          <FiGlobe size={11} />
                          <span>{log.ip || "—"}</span>
                        </span>
                      </td>

                      {/* Timestamp */}
                      <td className="py-4 px-5 text-xs text-[var(--color-muted)] whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <FiClock size={12} />
                          <span>
                            {new Date(log.timestamp).toLocaleString("en-IN", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination Bar */}
          <div
            className="p-4 sm:p-5 border-t flex flex-col sm:flex-row items-center justify-between gap-3 text-xs"
            style={{
              borderColor: "var(--color-border)",
              background: "var(--color-surface-alt)",
            }}
          >
            <span className="text-[var(--color-muted)]">
              Showing page <strong className="text-[var(--color-heading)]">{pagination.page}</strong> of{" "}
              <strong className="text-[var(--color-heading)]">{pagination.totalPages}</strong> (
              {pagination.total} total recorded actions)
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPagination((prev) => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                disabled={!pagination.hasPrev || loading}
                className="px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1 transition disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[var(--color-surface)] bg-[var(--color-surface-alt)] text-[var(--color-heading)] border-[var(--color-border)]"
              >
                <FiChevronLeft size={14} /> Previous
              </button>

              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                  let pageNum = i + 1;
                  if (pagination.totalPages > 5 && pagination.page > 3) {
                    pageNum = pagination.page - 2 + i;
                    if (pageNum > pagination.totalPages) {
                      pageNum = pagination.totalPages - (4 - i);
                    }
                  }
                  return (
                    <button
                      key={pageNum}
                      type="button"
                      onClick={() => setPagination((prev) => ({ ...prev, page: pageNum }))}
                      className={`w-7 h-7 rounded-lg text-xs font-bold transition ${
                        pagination.page === pageNum
                          ? "bg-[var(--color-accent)] text-white shadow-sm"
                          : "bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-body)] hover:bg-[var(--color-surface-alt)]"
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
                disabled={!pagination.hasNext || loading}
                className="px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1 transition disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[var(--color-surface)] bg-[var(--color-surface-alt)] text-[var(--color-heading)] border-[var(--color-border)]"
              >
                Next <FiChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── VALUE INSPECTOR DIFF MODAL ───────────────────────── */}
      {inspectingLog && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn"
          onClick={() => setInspectingLog(null)}
        >
          <div
            className="w-full max-w-3xl max-h-[90vh] rounded-3xl p-6 sm:p-8 flex flex-col shadow-2xl overflow-hidden border border-[var(--color-border)]"
            style={{
              background: "var(--color-surface)",
              color: "var(--color-heading)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-4 border-b border-[var(--color-border)]">
              <div>
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span
                    className={`font-mono text-xs font-bold px-2 py-0.5 rounded-md border ${getActionBadgeColor(
                      inspectingLog.action
                    )}`}
                  >
                    {inspectingLog.action}
                  </span>
                  <span className="text-xs font-semibold text-[var(--color-muted)]">
                    Target: {inspectingLog.target?.type} #{inspectingLog.target?.id}
                  </span>
                </div>
                <h3 className="text-xl font-serif font-bold text-[var(--color-heading)]">
                  Value Revision Delta & Audit Inspection
                </h3>
              </div>

              <button
                type="button"
                onClick={() => setInspectingLog(null)}
                className="p-2 rounded-full text-[var(--color-muted)] hover:text-[var(--color-heading)] hover:bg-[var(--color-surface-alt)] transition"
              >
                <FiX size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto py-5 space-y-5 pr-1 text-xs">
              {/* Context Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-xl bg-[var(--color-surface-alt)] border border-[var(--color-border)]">
                  <span className="text-[10px] font-bold uppercase text-[var(--color-muted)] block mb-1">
                    Actor
                  </span>
                  <span className="font-bold text-[var(--color-heading)] truncate block">
                    {inspectingLog.admin?.name || "System"}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-[var(--color-surface-alt)] border border-[var(--color-border)]">
                  <span className="text-[10px] font-bold uppercase text-[var(--color-muted)] block mb-1">
                    Client IP
                  </span>
                  <span className="font-mono text-[var(--color-heading)] truncate block">
                    {inspectingLog.ip || "Unknown"}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-[var(--color-surface-alt)] border border-[var(--color-border)]">
                  <span className="text-[10px] font-bold uppercase text-[var(--color-muted)] block mb-1">
                    Timestamp
                  </span>
                  <span className="text-[var(--color-heading)] truncate block">
                    {new Date(inspectingLog.timestamp).toLocaleTimeString("en-IN", {
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                    })}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-[var(--color-surface-alt)] border border-[var(--color-border)]">
                  <span className="text-[10px] font-bold uppercase text-[var(--color-muted)] block mb-1">
                    Security Policy
                  </span>
                  <span className="text-emerald-600 font-bold flex items-center gap-1">
                    <FiShield size={12} /> Secrets Redacted
                  </span>
                </div>
              </div>

              {inspectingLog.reason && (
                <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-900 dark:text-amber-200">
                  <span className="font-bold block mb-0.5">Stated Reason:</span>
                  <span>{inspectingLog.reason}</span>
                </div>
              )}

              {/* Side-by-Side Values Diff */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Previous Value */}
                <div className="flex flex-col rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-alt)] overflow-hidden">
                  <div className="px-4 py-2.5 bg-rose-500/10 border-b border-[var(--color-border)] flex items-center justify-between">
                    <span className="font-bold text-rose-700 dark:text-rose-300">
                      Previous Value (oldValue)
                    </span>
                    {inspectingLog.oldValue === null && (
                      <span className="text-[10px] uppercase font-bold text-[var(--color-muted)]">
                        None / Initial
                      </span>
                    )}
                  </div>
                  <pre className="p-4 font-mono text-[11px] leading-relaxed overflow-x-auto whitespace-pre-wrap max-h-[300px] text-[var(--color-body)]">
                    {inspectingLog.oldValue !== null && inspectingLog.oldValue !== undefined
                      ? JSON.stringify(inspectingLog.oldValue, null, 2)
                      : "/* No previous state recorded for this resource */"}
                  </pre>
                </div>

                {/* New Value */}
                <div className="flex flex-col rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-alt)] overflow-hidden">
                  <div className="px-4 py-2.5 bg-emerald-500/10 border-b border-[var(--color-border)] flex items-center justify-between">
                    <span className="font-bold text-emerald-700 dark:text-emerald-300">
                      New Value (newValue)
                    </span>
                    {inspectingLog.newValue === null && (
                      <span className="text-[10px] uppercase font-bold text-[var(--color-muted)]">
                        Deleted / Null
                      </span>
                    )}
                  </div>
                  <pre className="p-4 font-mono text-[11px] leading-relaxed overflow-x-auto whitespace-pre-wrap max-h-[300px] text-[var(--color-body)]">
                    {inspectingLog.newValue !== null && inspectingLog.newValue !== undefined
                      ? JSON.stringify(inspectingLog.newValue, null, 2)
                      : "/* Resource was deleted or purged from database */"}
                  </pre>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="pt-4 border-t border-[var(--color-border)] flex items-center justify-end">
              <button
                type="button"
                onClick={() => setInspectingLog(null)}
                className="px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm text-white transition hover:opacity-95"
                style={{ background: "var(--color-accent)" }}
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
