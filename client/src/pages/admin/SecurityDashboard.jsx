import { useState, useEffect, useCallback } from "react";
import {
  FiShield,
  FiAlertTriangle,
  FiSlash,
  FiClock,
  FiUserX,
  FiSearch,
  FiRefreshCw,
  FiEye,
  FiCheckCircle,
  FiCheck,
  FiTrash2,
  FiActivity,
  FiX,
  FiChevronLeft,
  FiChevronRight,
  FiGlobe,
  FiCpu,
  FiZap,
} from "react-icons/fi";
import {
  getSecurityDashboard,
  getSecurityEvents,
  getBlockedIPs,
  blockIP,
  unblockIP,
} from "../../services/adminService";

export default function SecurityDashboard() {
  // Aggregate KPI summary
  const [summary, setSummary] = useState({
    totalEvents: 0,
    eventsLast24h: 0,
    activeBlockedIps: 0,
    wafEvents: 0,
    rateLimitEvents: 0,
    authFailures: 0,
    suspiciousRequests: 0,
    criticalThreats: 0,
    securityAuditEvents: 0,
  });
  const [topTargetedUrls, setTopTargetedUrls] = useState([]);
  const [topOffendingIps, setTopOffendingIps] = useState([]);
  const [attackDistribution, setAttackDistribution] = useState([]);

  // Active view tab
  const [activeTab, setActiveTab] = useState("events"); // "events", "firewall", "analytics"

  // Security Events Feed state
  const [events, setEvents] = useState([]);
  const [eventsPagination, setEventsPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1,
    hasNext: false,
    hasPrev: false,
  });
  const [loadingEvents, setLoadingEvents] = useState(true);

  // Filters state
  const [selectedEventType, setSelectedEventType] = useState("All");
  const [selectedSeverity, setSelectedSeverity] = useState("All");
  const [ipFilter, setIpFilter] = useState("");
  const [dateRange, setDateRange] = useState("all"); // "all", "today", "7d", "30d"
  const [search, setSearch] = useState("");

  // Blocked IPs state
  const [blockedList, setBlockedList] = useState([]);
  const [loadingBlocked, setLoadingBlocked] = useState(false);
  const [banModalOpen, setBanModalOpen] = useState(false);
  const [newBanIp, setNewBanIp] = useState("");
  const [newBanReason, setNewBanReason] = useState("");
  const [newBanExpiryHours, setNewBanExpiryHours] = useState("");
  const [submittingBan, setSubmittingBan] = useState(false);

  // Payload Inspector Modal
  const [inspectingEvent, setInspectingEvent] = useState(null);

  // 1. Fetch dashboard overview analytics
  const fetchDashboardStats = useCallback(async () => {
    try {
      const data = await getSecurityDashboard();
      if (data && data.summary) {
        setSummary(data.summary);
        setTopTargetedUrls(data.topTargetedUrls || []);
        setTopOffendingIps(data.topOffendingIps || []);
        setAttackDistribution(data.attackTypeDistribution || []);
      }
    } catch (err) {
      console.error("Failed to load security dashboard metrics:", err);
    }
  }, []);

  // 2. Fetch security events
  const fetchEvents = useCallback(async () => {
    try {
      setLoadingEvents(true);

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

      const res = await getSecurityEvents({
        page: eventsPagination.page,
        limit: eventsPagination.limit,
        eventType: selectedEventType !== "All" ? selectedEventType : undefined,
        severity: selectedSeverity !== "All" ? selectedSeverity : undefined,
        ip: ipFilter.trim() || undefined,
        startDate: startDate || undefined,
        search: search.trim() || undefined,
      });

      if (res && res.events) {
        setEvents(res.events);
        if (res.pagination) setEventsPagination(res.pagination);
      } else if (Array.isArray(res)) {
        setEvents(res);
      }
    } catch (err) {
      console.error("Failed to fetch security events:", err);
    } finally {
      setLoadingEvents(false);
    }
  }, [eventsPagination.page, eventsPagination.limit, selectedEventType, selectedSeverity, ipFilter, dateRange, search]);

  // 3. Fetch firewall blocked IPs
  const fetchBlockedList = useCallback(async () => {
    try {
      setLoadingBlocked(true);
      const list = await getBlockedIPs();
      setBlockedList(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error("Failed to fetch blocked IPs:", err);
    } finally {
      setLoadingBlocked(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardStats();
    fetchBlockedList();
  }, [fetchDashboardStats, fetchBlockedList]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // Handle Ban IP submission
  const handleCreateBan = async (e) => {
    e.preventDefault();
    if (!newBanIp.trim()) return;

    try {
      setSubmittingBan(true);
      let expiresAt = null;
      if (newBanExpiryHours) {
        expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + parseInt(newBanExpiryHours, 10));
      }

      await blockIP(newBanIp.trim(), newBanReason.trim() || "Manual security firewall restriction", expiresAt);
      setBanModalOpen(false);
      setNewBanIp("");
      setNewBanReason("");
      setNewBanExpiryHours("");
      fetchBlockedList();
      fetchDashboardStats();
    } catch (err) {
      console.error("Failed to create firewall ban:", err);
      alert(err.response?.data?.message || "Failed to block IP address.");
    } finally {
      setSubmittingBan(false);
    }
  };

  // Toggle Unblock / Re-Ban
  const handleToggleBlock = async (item) => {
    try {
      await unblockIP(item._id || item.id);
      fetchBlockedList();
      fetchDashboardStats();
    } catch (err) {
      console.error("Failed to unblock IP:", err);
      alert("Failed to toggle IP status.");
    }
  };

  // Quick Ban from an event row
  const handleQuickBan = (ip, attackType) => {
    setNewBanIp(ip);
    setNewBanReason(`Triggered ${attackType} security violation`);
    setNewBanExpiryHours("24");
    setBanModalOpen(true);
  };

  // Reset filter controls
  const handleResetFilters = () => {
    setSelectedEventType("All");
    setSelectedSeverity("All");
    setIpFilter("");
    setDateRange("all");
    setSearch("");
    setEventsPagination((prev) => ({ ...prev, page: 1 }));
  };

  // Helper for severity styling
  const getSeverityBadge = (level) => {
    const sev = Number(level) || 5;
    if (sev >= 9) {
      return {
        label: `Critical (Lv.${sev})`,
        cls: "text-rose-700 dark:text-rose-300 bg-rose-500/15 border-rose-500/25 font-bold",
      };
    }
    if (sev >= 7) {
      return {
        label: `High (Lv.${sev})`,
        cls: "text-amber-700 dark:text-amber-300 bg-amber-500/15 border-amber-500/25 font-semibold",
      };
    }
    if (sev >= 5) {
      return {
        label: `Medium (Lv.${sev})`,
        cls: "text-sky-700 dark:text-sky-300 bg-sky-500/15 border-sky-500/25",
      };
    }
    return {
      label: `Low (Lv.${sev})`,
      cls: "text-neutral-700 dark:text-neutral-300 bg-neutral-500/15 border-neutral-500/25",
    };
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* ── HEADER ─────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span
              className="px-2.5 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wider text-white"
              style={{ background: "var(--color-danger)" }}
            >
              SecureShield SIEM
            </span>
            <span className="text-xs font-semibold text-[var(--color-muted)]">
              Enterprise Defense & Threat Intelligence
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[var(--color-heading)] flex items-center gap-2.5">
            <FiShield className="text-[var(--color-danger)]" />
            <span>Security Center & Threat Dashboard</span>
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-[var(--color-muted)]">
            Continuous threat mitigation: WAF attack payloads, rate-limit anomalies, auth failures, and firewall controls
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            id="open-ban-modal-btn"
            type="button"
            onClick={() => setBanModalOpen(true)}
            className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white shadow-sm transition flex items-center gap-2 hover:opacity-95"
            style={{ background: "var(--color-danger)" }}
          >
            <FiSlash size={15} />
            <span>Ban IP Address</span>
          </button>

          <button
            id="security-refresh-btn"
            type="button"
            onClick={() => {
              fetchDashboardStats();
              fetchEvents();
              fetchBlockedList();
            }}
            className="px-3.5 py-2.5 rounded-xl border text-xs sm:text-sm font-semibold transition flex items-center gap-2 hover:bg-[var(--color-surface-alt)] text-[var(--color-heading)] border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm"
          >
            <FiRefreshCw size={14} className={loadingEvents ? "animate-spin text-[var(--color-accent)]" : ""} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* ── SUMMARY KPI METRICS CARDS ──────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {/* 1. Total Intercepted Events */}
        <div
          className="p-4 rounded-2xl border shadow-sm transition"
          style={{
            background: "var(--color-surface)",
            borderColor: "var(--color-border)",
          }}
        >
          <div className="flex items-center justify-between text-xs text-[var(--color-muted)] mb-1">
            <span className="font-semibold">Total Intercepts</span>
            <FiZap className="text-[var(--color-accent)]" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-serif font-bold text-[var(--color-heading)]">
              {summary.totalEvents}
            </span>
            <span className="text-[10px] text-[var(--color-muted)] font-mono">
              +{summary.eventsLast24h} 24h
            </span>
          </div>
        </div>

        {/* 2. Active IP Bans */}
        <div
          className="p-4 rounded-2xl border shadow-sm transition"
          style={{
            background: "var(--color-surface)",
            borderColor: "var(--color-border)",
          }}
        >
          <div className="flex items-center justify-between text-xs text-rose-600 mb-1">
            <span className="font-semibold">Firewall Bans</span>
            <FiSlash size={14} />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-serif font-bold text-rose-600">
              {summary.activeBlockedIps}
            </span>
            <span className="text-[10px] text-emerald-600 font-semibold">Active</span>
          </div>
        </div>

        {/* 3. WAF Interceptions */}
        <div
          className="p-4 rounded-2xl border shadow-sm transition"
          style={{
            background: "var(--color-surface)",
            borderColor: "var(--color-border)",
          }}
        >
          <div className="flex items-center justify-between text-xs text-amber-600 mb-1">
            <span className="font-semibold">WAF Injections</span>
            <FiShield size={14} />
          </div>
          <span className="text-2xl font-serif font-bold text-amber-600">
            {summary.wafEvents}
          </span>
        </div>

        {/* 4. Rate-Limit Violations */}
        <div
          className="p-4 rounded-2xl border shadow-sm transition"
          style={{
            background: "var(--color-surface)",
            borderColor: "var(--color-border)",
          }}
        >
          <div className="flex items-center justify-between text-xs text-sky-600 mb-1">
            <span className="font-semibold">Rate-Limits</span>
            <FiClock size={14} />
          </div>
          <span className="text-2xl font-serif font-bold text-sky-600">
            {summary.rateLimitEvents}
          </span>
        </div>

        {/* 5. Auth Failures */}
        <div
          className="p-4 rounded-2xl border shadow-sm transition"
          style={{
            background: "var(--color-surface)",
            borderColor: "var(--color-border)",
          }}
        >
          <div className="flex items-center justify-between text-xs text-purple-600 mb-1">
            <span className="font-semibold">Auth Failures</span>
            <FiUserX size={14} />
          </div>
          <span className="text-2xl font-serif font-bold text-purple-600">
            {summary.authFailures}
          </span>
        </div>

        {/* 6. Critical Severity Incidents */}
        <div
          className="p-4 rounded-2xl border shadow-sm transition"
          style={{
            background: "var(--color-surface)",
            borderColor: "var(--color-border)",
          }}
        >
          <div className="flex items-center justify-between text-xs text-rose-500 mb-1">
            <span className="font-semibold">Critical Threats</span>
            <FiAlertTriangle size={14} />
          </div>
          <span className="text-2xl font-serif font-bold text-rose-500">
            {summary.criticalThreats}
          </span>
        </div>
      </div>

      {/* ── NAVIGATION TABS ────────────────────────────────────── */}
      <div className="flex items-center gap-2 border-b border-[var(--color-border)] pb-2 overflow-x-auto text-xs sm:text-sm">
        <button
          id="tab-security-events"
          type="button"
          onClick={() => setActiveTab("events")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition ${
            activeTab === "events"
              ? "bg-[var(--color-accent)] text-white shadow-sm"
              : "text-[var(--color-muted)] hover:text-[var(--color-heading)] hover:bg-[var(--color-surface-alt)]"
          }`}
        >
          <FiAlertTriangle size={15} />
          <span>Threat Events Feed ({eventsPagination.total})</span>
        </button>

        <button
          id="tab-security-firewall"
          type="button"
          onClick={() => setActiveTab("firewall")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition ${
            activeTab === "firewall"
              ? "bg-[var(--color-accent)] text-white shadow-sm"
              : "text-[var(--color-muted)] hover:text-[var(--color-heading)] hover:bg-[var(--color-surface-alt)]"
          }`}
        >
          <FiSlash size={15} />
          <span>Firewall & IP Bans ({blockedList.length})</span>
        </button>

        <button
          id="tab-security-analytics"
          type="button"
          onClick={() => setActiveTab("analytics")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition ${
            activeTab === "analytics"
              ? "bg-[var(--color-accent)] text-white shadow-sm"
              : "text-[var(--color-muted)] hover:text-[var(--color-heading)] hover:bg-[var(--color-surface-alt)]"
          }`}
        >
          <FiCpu size={15} />
          <span>Threat Intelligence</span>
        </button>
      </div>

      {/* ── TAB 1: THREAT EVENTS FEED ──────────────────────────── */}
      {activeTab === "events" && (
        <div className="space-y-5 animate-fadeIn">
          {/* Filters Bar */}
          <div
            className="p-5 rounded-3xl border shadow-sm space-y-4"
            style={{
              background: "var(--color-surface)",
              borderColor: "var(--color-border)",
            }}
          >
            <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
              {/* Search */}
              <div className="relative flex-1">
                <FiSearch
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-muted)]"
                  size={16}
                />
                <input
                  id="security-search-input"
                  type="text"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setEventsPagination((prev) => ({ ...prev, page: 1 }));
                  }}
                  placeholder="Search threat details, path, or IP address..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
                  style={{
                    background: "var(--color-surface-alt)",
                    borderColor: "var(--color-border)",
                    color: "var(--color-heading)",
                  }}
                />
              </div>

              {/* Filters */}
              <div className="flex flex-wrap items-center gap-2.5">
                {/* Event Type Filter */}
                <select
                  id="security-type-filter"
                  value={selectedEventType}
                  onChange={(e) => {
                    setSelectedEventType(e.target.value);
                    setEventsPagination((prev) => ({ ...prev, page: 1 }));
                  }}
                  className="px-3 py-2.5 rounded-xl border text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
                  style={{
                    background: "var(--color-surface-alt)",
                    borderColor: "var(--color-border)",
                    color: "var(--color-heading)",
                  }}
                >
                  <option value="All">All Event Types</option>
                  <option value="waf">WAF Injections (SQLi/XSS/Path)</option>
                  <option value="rate_limit">Rate Limit Exceeded</option>
                  <option value="auth_failure">Authentication Failure</option>
                  <option value="suspicious">Suspicious Probes</option>
                  <option value="blocked_ip">Blocked IP Hits</option>
                </select>

                {/* Severity Filter */}
                <select
                  id="security-severity-filter"
                  value={selectedSeverity}
                  onChange={(e) => {
                    setSelectedSeverity(e.target.value);
                    setEventsPagination((prev) => ({ ...prev, page: 1 }));
                  }}
                  className="px-3 py-2.5 rounded-xl border text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
                  style={{
                    background: "var(--color-surface-alt)",
                    borderColor: "var(--color-border)",
                    color: "var(--color-heading)",
                  }}
                >
                  <option value="All">All Severities</option>
                  <option value="critical">Critical (Lv. 9–10)</option>
                  <option value="high">High (Lv. 7–8)</option>
                  <option value="medium">Medium (Lv. 5–6)</option>
                  <option value="low">Low (Lv. 1–4)</option>
                </select>

                {/* Date Filter */}
                <select
                  id="security-date-filter"
                  value={dateRange}
                  onChange={(e) => {
                    setDateRange(e.target.value);
                    setEventsPagination((prev) => ({ ...prev, page: 1 }));
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

                {/* IP Quick Filter */}
                <div className="relative">
                  <input
                    id="security-ip-filter"
                    type="text"
                    value={ipFilter}
                    onChange={(e) => {
                      setIpFilter(e.target.value);
                      setEventsPagination((prev) => ({ ...prev, page: 1 }));
                    }}
                    placeholder="Filter by IP..."
                    className="w-36 px-3 py-2.5 rounded-xl border text-xs font-mono focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
                    style={{
                      background: "var(--color-surface-alt)",
                      borderColor: "var(--color-border)",
                      color: "var(--color-heading)",
                    }}
                  />
                </div>

                {(selectedEventType !== "All" || selectedSeverity !== "All" || ipFilter || dateRange !== "all" || search) && (
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

          {/* Table */}
          {loadingEvents ? (
            <div className="py-24 text-center">
              <div className="inline-block w-8 h-8 border-3 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin mb-3" />
              <p className="text-xs sm:text-sm text-[var(--color-muted)]">
                Inspecting security telemetry...
              </p>
            </div>
          ) : events.length === 0 ? (
            <div
              className="rounded-3xl p-16 text-center border shadow-sm"
              style={{
                background: "var(--color-surface)",
                borderColor: "var(--color-border)",
              }}
            >
              <div
                className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center mb-4 text-emerald-600"
                style={{ background: "var(--color-surface-alt)" }}
              >
                <FiCheckCircle size={32} />
              </div>
              <h2 className="text-xl font-serif font-bold text-[var(--color-heading)]">
                No Threat Events Found
              </h2>
              <p className="mt-2 text-xs sm:text-sm text-[var(--color-muted)] max-w-md mx-auto">
                No suspicious requests or WAF anomalies match your query. Your firewall defenses are standing guard.
              </p>
              {(selectedEventType !== "All" || selectedSeverity !== "All" || ipFilter || dateRange !== "all" || search) && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="mt-5 px-5 py-2.5 rounded-xl text-xs font-bold text-white transition hover:opacity-95"
                  style={{ background: "var(--color-accent)" }}
                >
                  Reset Filter Parameters
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
                      <th className="py-4 px-5">Severity</th>
                      <th className="py-4 px-4">Event / Threat Type</th>
                      <th className="py-4 px-4">Client IP</th>
                      <th className="py-4 px-4">Endpoint & Method</th>
                      <th className="py-4 px-4">Threat Details</th>
                      <th className="py-4 px-4">Timestamp</th>
                      <th className="py-4 px-5 text-center">Firewall Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y" style={{ borderColor: "var(--color-border)" }}>
                    {events.map((ev) => {
                      const id = ev._id || ev.id;
                      const sevConfig = getSeverityBadge(ev.severity);

                      return (
                        <tr
                          key={id}
                          className="hover:bg-[var(--color-surface-alt)]/60 transition"
                        >
                          {/* Severity */}
                          <td className="py-4 px-5">
                            <span
                              className={`inline-flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded-full border ${sevConfig.cls}`}
                            >
                              <FiAlertTriangle size={11} />
                              <span>{sevConfig.label}</span>
                            </span>
                          </td>

                          {/* Event Type */}
                          <td className="py-4 px-4 font-bold text-xs text-[var(--color-heading)]">
                            {ev.attackType}
                          </td>

                          {/* IP */}
                          <td className="py-4 px-4 font-mono text-xs">
                            <button
                              type="button"
                              onClick={() => {
                                setIpFilter(ev.ip);
                                setEventsPagination((prev) => ({ ...prev, page: 1 }));
                              }}
                              className="hover:underline text-[var(--color-accent)] inline-flex items-center gap-1"
                              title="Filter this IP"
                            >
                              <FiGlobe size={11} />
                              <span>{ev.ip}</span>
                            </button>
                          </td>

                          {/* Method & URL */}
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-1.5 font-mono text-[11px]">
                              <span className="px-1.5 py-0.5 rounded font-bold bg-[var(--color-surface-alt)] border border-[var(--color-border)] text-[var(--color-heading)]">
                                {ev.method}
                              </span>
                              <span className="truncate max-w-[160px] text-[var(--color-body)]" title={ev.url}>
                                {ev.url}
                              </span>
                            </div>
                          </td>

                          {/* Details */}
                          <td className="py-4 px-4">
                            <p className="text-xs text-[var(--color-body)] line-clamp-1 max-w-[220px]">
                              {ev.details || "Automated signature match"}
                            </p>
                            {ev.payload && (
                              <button
                                type="button"
                                onClick={() => setInspectingEvent(ev)}
                                className="text-[11px] text-[var(--color-accent)] hover:underline inline-flex items-center gap-1 mt-0.5 font-semibold"
                              >
                                <FiEye size={11} /> Inspect Payload
                              </button>
                            )}
                          </td>

                          {/* Timestamp */}
                          <td className="py-4 px-4 text-xs text-[var(--color-muted)] whitespace-nowrap">
                            {new Date(ev.timestamp).toLocaleString("en-IN", {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </td>

                          {/* Quick Ban Action */}
                          <td className="py-4 px-5 text-center">
                            <button
                              type="button"
                              onClick={() => handleQuickBan(ev.ip, ev.attackType)}
                              className="px-3 py-1.5 rounded-lg border border-rose-500/30 text-rose-600 hover:bg-rose-500/10 transition text-xs font-bold inline-flex items-center gap-1 shadow-xs"
                            >
                              <FiSlash size={12} />
                              <span>Ban IP</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div
                className="p-4 sm:p-5 border-t flex flex-col sm:flex-row items-center justify-between gap-3 text-xs"
                style={{
                  borderColor: "var(--color-border)",
                  background: "var(--color-surface-alt)",
                }}
              >
                <span className="text-[var(--color-muted)]">
                  Page <strong className="text-[var(--color-heading)]">{eventsPagination.page}</strong> of{" "}
                  <strong className="text-[var(--color-heading)]">{eventsPagination.totalPages}</strong> (
                  {eventsPagination.total} total threat events)
                </span>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEventsPagination((p) => ({ ...p, page: Math.max(1, p.page - 1) }))}
                    disabled={!eventsPagination.hasPrev || loadingEvents}
                    className="px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1 transition disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[var(--color-surface)] bg-[var(--color-surface-alt)] text-[var(--color-heading)] border-[var(--color-border)]"
                  >
                    <FiChevronLeft size={14} /> Previous
                  </button>
                  <button
                    type="button"
                    onClick={() => setEventsPagination((p) => ({ ...p, page: p.page + 1 }))}
                    disabled={!eventsPagination.hasNext || loadingEvents}
                    className="px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1 transition disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[var(--color-surface)] bg-[var(--color-surface-alt)] text-[var(--color-heading)] border-[var(--color-border)]"
                  >
                    Next <FiChevronRight size={14} />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── TAB 2: FIREWALL & BLOCKED IPS ───────────────────────── */}
      {activeTab === "firewall" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fadeIn">
          {/* Ban Form */}
          <div className="lg:col-span-1">
            <form
              onSubmit={handleCreateBan}
              className="rounded-3xl p-6 border space-y-4 shadow-sm"
              style={{
                background: "var(--color-surface)",
                borderColor: "var(--color-border)",
              }}
            >
              <div className="border-b pb-3" style={{ borderColor: "var(--color-border)" }}>
                <h3 className="font-serif font-bold text-lg text-[var(--color-heading)] flex items-center gap-2">
                  <FiSlash className="text-rose-600" />
                  <span>Enforce Firewall Restriction</span>
                </h3>
                <p className="text-xs text-[var(--color-muted)] mt-0.5">
                  Blacklists inbound requests at WAF edge using in-memory Redis cache
                </p>
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-[var(--color-muted)] block mb-1.5">
                  IP Address <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={newBanIp}
                  onChange={(e) => setNewBanIp(e.target.value)}
                  placeholder="e.g. 185.220.101.45"
                  required
                  className="w-full px-4 py-2.5 rounded-xl border text-xs sm:text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
                  style={{
                    background: "var(--color-surface-alt)",
                    borderColor: "var(--color-border)",
                    color: "var(--color-heading)",
                  }}
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-[var(--color-muted)] block mb-1.5">
                  Reason / Rule Citation
                </label>
                <input
                  type="text"
                  value={newBanReason}
                  onChange={(e) => setNewBanReason(e.target.value)}
                  placeholder="e.g. Automated SQLi scanner probe"
                  className="w-full px-4 py-2.5 rounded-xl border text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
                  style={{
                    background: "var(--color-surface-alt)",
                    borderColor: "var(--color-border)",
                    color: "var(--color-heading)",
                  }}
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-[var(--color-muted)] block mb-1.5">
                  Ban Duration (Hours, Blank = Permanent)
                </label>
                <input
                  type="number"
                  min="1"
                  value={newBanExpiryHours}
                  onChange={(e) => setNewBanExpiryHours(e.target.value)}
                  placeholder="e.g. 24"
                  className="w-full px-4 py-2.5 rounded-xl border text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
                  style={{
                    background: "var(--color-surface-alt)",
                    borderColor: "var(--color-border)",
                    color: "var(--color-heading)",
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={submittingBan || !newBanIp.trim()}
                className="w-full py-3 rounded-xl text-xs sm:text-sm font-bold text-white transition flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
                style={{ background: "var(--color-danger)" }}
              >
                <FiSlash size={15} />
                <span>{submittingBan ? "Enforcing Ban…" : "Enforce Firewall Ban"}</span>
              </button>
            </form>
          </div>

          {/* Active Banned IPs Table */}
          <div className="lg:col-span-2">
            {loadingBlocked ? (
              <div className="py-20 text-center">
                <div className="inline-block w-8 h-8 border-3 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin mb-3" />
                <p className="text-xs text-[var(--color-muted)]">Loading firewall table...</p>
              </div>
            ) : blockedList.length === 0 ? (
              <div
                className="rounded-3xl p-12 text-center border shadow-sm"
                style={{
                  background: "var(--color-surface)",
                  borderColor: "var(--color-border)",
                }}
              >
                <FiCheckCircle size={32} className="text-emerald-500 mx-auto mb-3" />
                <h3 className="font-serif font-bold text-lg text-[var(--color-heading)]">
                  Zero Blocked IPs
                </h3>
                <p className="text-xs text-[var(--color-muted)] mt-1">
                  No IP addresses are currently blacklisted on the SecureShield firewall.
                </p>
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
                        <th className="py-4 px-5">IP Address</th>
                        <th className="py-4 px-4">Status</th>
                        <th className="py-4 px-4">Reason</th>
                        <th className="py-4 px-4">Expires</th>
                        <th className="py-4 px-5 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y" style={{ borderColor: "var(--color-border)" }}>
                      {blockedList.map((item) => {
                        const id = item._id || item.id;
                        const hasExpiry = Boolean(item.expiresAt);
                        const isExpired = hasExpiry && new Date(item.expiresAt).getTime() < Date.now();
                        const isCurrentlyActive = item.isActive && !isExpired;

                        return (
                          <tr key={id} className="hover:bg-[var(--color-surface-alt)]/60 transition">
                            <td className="py-4 px-5 font-mono text-xs font-bold text-[var(--color-heading)]">
                              {item.ip}
                            </td>

                            <td className="py-4 px-4">
                              {isCurrentlyActive ? (
                                <span className="text-[11px] font-bold text-rose-700 dark:text-rose-300 bg-rose-500/15 border border-rose-500/25 px-2 py-0.5 rounded-full">
                                  Banned
                                </span>
                              ) : (
                                <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-500/15 border border-emerald-500/25 px-2 py-0.5 rounded-full">
                                  Lifted
                                </span>
                              )}
                            </td>

                            <td className="py-4 px-4 text-xs text-[var(--color-body)]">
                              {item.reason || "Manual firewall ban"}
                            </td>

                            <td className="py-4 px-4 font-mono text-xs text-[var(--color-muted)]">
                              {hasExpiry ? (
                                <span className="inline-flex items-center gap-1">
                                  <FiClock size={11} />
                                  <span>
                                    {new Date(item.expiresAt).toLocaleDateString("en-IN", {
                                      month: "short",
                                      day: "numeric",
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })}
                                  </span>
                                </span>
                              ) : (
                                "Permanent"
                              )}
                            </td>

                            <td className="py-4 px-5 text-center">
                              <button
                                type="button"
                                onClick={() => handleToggleBlock(item)}
                                className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition inline-flex items-center gap-1 ${
                                  isCurrentlyActive
                                    ? "text-emerald-600 border-emerald-500/30 hover:bg-emerald-500/10"
                                    : "text-rose-600 border-rose-500/30 hover:bg-rose-500/10"
                                }`}
                              >
                                {isCurrentlyActive ? <FiCheck size={12} /> : <FiTrash2 size={12} />}
                                <span>{isCurrentlyActive ? "Lift Ban" : "Re-Ban"}</span>
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TAB 3: THREAT INTELLIGENCE & ANALYTICS ──────────────── */}
      {activeTab === "analytics" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fadeIn">
          {/* Top Offending IPs */}
          <div
            className="rounded-3xl p-6 border shadow-sm space-y-4"
            style={{
              background: "var(--color-surface)",
              borderColor: "var(--color-border)",
            }}
          >
            <div className="border-b pb-3" style={{ borderColor: "var(--color-border)" }}>
              <h3 className="font-serif font-bold text-lg text-[var(--color-heading)] flex items-center gap-2">
                <FiGlobe className="text-[var(--color-accent)]" />
                <span>Top Offending Client IPs</span>
              </h3>
              <p className="text-xs text-[var(--color-muted)] mt-0.5">
                Highest frequency of WAF violations & anomalies
              </p>
            </div>

            <div className="space-y-3">
              {topOffendingIps.length === 0 ? (
                <p className="text-xs text-[var(--color-muted)]">No telemetry captured yet.</p>
              ) : (
                topOffendingIps.map((ip) => (
                  <div
                    key={ip._id}
                    className="p-3 rounded-xl bg-[var(--color-surface-alt)] border border-[var(--color-border)] flex items-center justify-between"
                  >
                    <div>
                      <span className="font-mono text-xs font-bold text-[var(--color-heading)] block">
                        {ip._id}
                      </span>
                      <span className="text-[11px] text-[var(--color-muted)]">
                        {ip.count} attack attempts • Max Lv.{ip.maxSeverity}
                      </span>
                    </div>

                    {ip.isBlocked ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-600 border border-rose-500/25">
                        Blocked
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleQuickBan(ip._id, "Frequent Attacker")}
                        className="px-2.5 py-1 rounded-lg border border-rose-500/30 text-rose-600 hover:bg-rose-500/10 text-xs font-bold"
                      >
                        Ban IP
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Top Targeted Endpoints */}
          <div
            className="rounded-3xl p-6 border shadow-sm space-y-4"
            style={{
              background: "var(--color-surface)",
              borderColor: "var(--color-border)",
            }}
          >
            <div className="border-b pb-3" style={{ borderColor: "var(--color-border)" }}>
              <h3 className="font-serif font-bold text-lg text-[var(--color-heading)] flex items-center gap-2">
                <FiActivity className="text-amber-600" />
                <span>Top Targeted Endpoints</span>
              </h3>
              <p className="text-xs text-[var(--color-muted)] mt-0.5">
                Routes targeted by script injections & probes
              </p>
            </div>

            <div className="space-y-3">
              {topTargetedUrls.length === 0 ? (
                <p className="text-xs text-[var(--color-muted)]">No telemetry captured yet.</p>
              ) : (
                topTargetedUrls.map((url) => (
                  <div
                    key={url._id}
                    className="p-3 rounded-xl bg-[var(--color-surface-alt)] border border-[var(--color-border)]"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono text-xs font-bold text-[var(--color-heading)] truncate max-w-[180px]">
                        {url._id}
                      </span>
                      <span className="text-xs font-bold text-amber-600">
                        {url.count} hits
                      </span>
                    </div>
                    <span className="text-[10px] text-[var(--color-muted)] uppercase tracking-wider">
                      {url.attackTypes?.join(", ") || "General"}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Attack Distribution Breakdown */}
          <div
            className="rounded-3xl p-6 border shadow-sm space-y-4"
            style={{
              background: "var(--color-surface)",
              borderColor: "var(--color-border)",
            }}
          >
            <div className="border-b pb-3" style={{ borderColor: "var(--color-border)" }}>
              <h3 className="font-serif font-bold text-lg text-[var(--color-heading)] flex items-center gap-2">
                <FiCpu className="text-purple-600" />
                <span>Threat Signature Vectors</span>
              </h3>
              <p className="text-xs text-[var(--color-muted)] mt-0.5">
                Distribution by classification signature
              </p>
            </div>

            <div className="space-y-2.5">
              {attackDistribution.length === 0 ? (
                <p className="text-xs text-[var(--color-muted)]">No threat vectors recorded.</p>
              ) : (
                attackDistribution.map((vec) => (
                  <div
                    key={vec._id}
                    className="p-3 rounded-xl bg-[var(--color-surface-alt)] border border-[var(--color-border)] flex items-center justify-between text-xs"
                  >
                    <span className="font-bold text-[var(--color-heading)]">
                      {vec._id}
                    </span>
                    <span className="font-mono font-bold px-2 py-0.5 rounded bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-accent)]">
                      {vec.count}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── PAYLOAD INSPECTOR MODAL ────────────────────────────── */}
      {inspectingEvent && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn"
          onClick={() => setInspectingEvent(null)}
        >
          <div
            className="w-full max-w-2xl max-h-[90vh] rounded-3xl p-6 sm:p-8 flex flex-col shadow-2xl overflow-hidden border border-[var(--color-border)]"
            style={{
              background: "var(--color-surface)",
              color: "var(--color-heading)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between pb-4 border-b border-[var(--color-border)]">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-bold text-xs uppercase px-2 py-0.5 rounded bg-rose-500/15 text-rose-600 border border-rose-500/25">
                    {inspectingEvent.attackType}
                  </span>
                  <span className="font-mono text-xs text-[var(--color-muted)]">
                    IP: {inspectingEvent.ip}
                  </span>
                </div>
                <h3 className="text-xl font-serif font-bold text-[var(--color-heading)]">
                  Intercepted Request Inspection
                </h3>
              </div>

              <button
                type="button"
                onClick={() => setInspectingEvent(null)}
                className="p-2 rounded-full text-[var(--color-muted)] hover:text-[var(--color-heading)] hover:bg-[var(--color-surface-alt)] transition"
              >
                <FiX size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-5 space-y-4 pr-1 text-xs">
              <div className="p-3 rounded-xl bg-[var(--color-surface-alt)] border border-[var(--color-border)] font-mono text-[11px]">
                <p><strong>Path:</strong> {inspectingEvent.method} {inspectingEvent.url}</p>
                <p className="mt-1"><strong>User Agent:</strong> {inspectingEvent.userAgent || "Unknown"}</p>
                <p className="mt-1 text-amber-600"><strong>Signature:</strong> {inspectingEvent.details}</p>
              </div>

              <div>
                <span className="font-bold text-[var(--color-muted)] uppercase tracking-wider block mb-2 text-[10px]">
                  Sanitized Request Payload (Credentials Redacted)
                </span>
                <pre className="p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-alt)] font-mono text-[11px] leading-relaxed overflow-x-auto whitespace-pre-wrap max-h-[260px] text-[var(--color-body)]">
                  {JSON.stringify(inspectingEvent.payload || {}, null, 2)}
                </pre>
              </div>
            </div>

            <div className="pt-4 border-t border-[var(--color-border)] flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  const ip = inspectingEvent.ip;
                  const type = inspectingEvent.attackType;
                  setInspectingEvent(null);
                  handleQuickBan(ip, type);
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white transition hover:opacity-95"
                style={{ background: "var(--color-danger)" }}
              >
                Ban This IP
              </button>

              <button
                type="button"
                onClick={() => setInspectingEvent(null)}
                className="px-5 py-2 rounded-xl text-xs font-semibold border border-[var(--color-border)] hover:bg-[var(--color-surface-alt)] text-[var(--color-heading)] transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── FIREWALL BAN MODAL ─────────────────────────────────── */}
      {banModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn"
          onClick={() => setBanModalOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-3xl p-6 sm:p-8 flex flex-col shadow-2xl border border-[var(--color-border)]"
            style={{
              background: "var(--color-surface)",
              color: "var(--color-heading)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-[var(--color-border)]">
              <h3 className="font-serif font-bold text-lg text-[var(--color-heading)] flex items-center gap-2">
                <FiSlash className="text-rose-600" />
                <span>Enforce Firewall IP Ban</span>
              </h3>
              <button
                type="button"
                onClick={() => setBanModalOpen(false)}
                className="p-1 rounded-full text-[var(--color-muted)] hover:text-[var(--color-heading)]"
              >
                <FiX size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateBan} className="mt-4 space-y-4 text-xs sm:text-sm">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-[var(--color-muted)] block mb-1">
                  Target IP Address *
                </label>
                <input
                  type="text"
                  value={newBanIp}
                  onChange={(e) => setNewBanIp(e.target.value)}
                  placeholder="e.g. 192.168.1.50"
                  required
                  className="w-full px-4 py-2.5 rounded-xl border text-xs sm:text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
                  style={{
                    background: "var(--color-surface-alt)",
                    borderColor: "var(--color-border)",
                    color: "var(--color-heading)",
                  }}
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-[var(--color-muted)] block mb-1">
                  Reason for Firewall Ban
                </label>
                <input
                  type="text"
                  value={newBanReason}
                  onChange={(e) => setNewBanReason(e.target.value)}
                  placeholder="e.g. Detected SQLi and abnormal traffic"
                  className="w-full px-4 py-2.5 rounded-xl border text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
                  style={{
                    background: "var(--color-surface-alt)",
                    borderColor: "var(--color-border)",
                    color: "var(--color-heading)",
                  }}
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-[var(--color-muted)] block mb-1">
                  Duration (hours, leave blank for permanent)
                </label>
                <input
                  type="number"
                  min="1"
                  value={newBanExpiryHours}
                  onChange={(e) => setNewBanExpiryHours(e.target.value)}
                  placeholder="e.g. 24"
                  className="w-full px-4 py-2.5 rounded-xl border text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
                  style={{
                    background: "var(--color-surface-alt)",
                    borderColor: "var(--color-border)",
                    color: "var(--color-heading)",
                  }}
                />
              </div>

              <div className="pt-3 border-t border-[var(--color-border)] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setBanModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold border border-[var(--color-border)] hover:bg-[var(--color-surface-alt)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingBan || !newBanIp.trim()}
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white transition hover:opacity-95"
                  style={{ background: "var(--color-danger)" }}
                >
                  {submittingBan ? "Enforcing…" : "Enforce Ban"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
