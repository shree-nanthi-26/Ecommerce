import { useState, useEffect, useCallback } from "react";
import {
  FiLifeBuoy,
  FiSearch,
  FiClock,
  FiLoader,
  FiUserCheck,
  FiCheckCircle,
  FiArchive,
  FiChevronRight,
  FiUser,
  FiPackage,
  FiX,
  FiRefreshCw,
} from "react-icons/fi";
import {
  getAdminTickets,
  getTicketById,
  addTicketMessage,
  updateTicketStatus,
  assignTicket,
  getAdminAgents,
} from "../../services/ticketService";
import TicketStatusBadge from "../../components/tickets/TicketStatusBadge";
import TicketCategoryBadge from "../../components/tickets/TicketCategoryBadge";
import TicketMessageList from "../../components/tickets/TicketMessageList";
import TicketReplyBox from "../../components/tickets/TicketReplyBox";
import { useAuth } from "../../context/AuthContext";

export default function AdminTickets() {
  const { user: currentUser } = useAuth();

  // Tickets list state
  const [tickets, setTickets] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    open: 0,
    inProgress: 0,
    waitingForCustomer: 0,
    resolved: 0,
    closed: 0,
  });
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState("All");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [priorityFilter, setPriorityFilter] = useState("All");
  const [assignedFilter, setAssignedFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  // Admin agents list for assignment
  const [agents, setAgents] = useState([]);

  // Selected ticket for side-drawer / modal view
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [updatingAssignee, setUpdatingAssignee] = useState(false);

  // Fetch agents
  useEffect(() => {
    async function loadAgents() {
      try {
        const data = await getAdminAgents();
        setAgents(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Failed to load admin agents:", err);
      }
    }
    loadAgents();
  }, []);

  // Fetch admin tickets
  const fetchTickets = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getAdminTickets({
        status: statusFilter,
        category: categoryFilter,
        priority: priorityFilter,
        assignedTo: assignedFilter,
        search: searchQuery,
        page: pagination.page,
      });

      setTickets(res.tickets || []);
      if (res.stats) setStats(res.stats);
      if (res.pagination) setPagination(res.pagination);
    } catch (err) {
      console.error("Failed to load admin tickets:", err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, categoryFilter, priorityFilter, assignedFilter, searchQuery, pagination.page]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  // Load single ticket details
  const handleSelectTicket = async (ticket) => {
    try {
      const full = await getTicketById(ticket._id || ticket.id);
      setSelectedTicket(full);
    } catch (err) {
      console.error("Failed to load ticket detail:", err);
    }
  };

  // Status update
  const handleStatusChange = async (newStatus) => {
    if (!selectedTicket || updatingStatus) return;
    try {
      setUpdatingStatus(true);
      const updated = await updateTicketStatus(selectedTicket._id, { status: newStatus });
      setSelectedTicket(updated);
      fetchTickets();
    } catch {
      alert("Failed to update status.");
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Assignee update
  const handleAssignChange = async (agentId) => {
    if (!selectedTicket || updatingAssignee) return;
    try {
      setUpdatingAssignee(true);
      const updated = await assignTicket(selectedTicket._id, { assignedTo: agentId || null });
      setSelectedTicket(updated);
      fetchTickets();
    } catch {
      alert("Failed to update assignee.");
    } finally {
      setUpdatingAssignee(false);
    }
  };

  // Reply submitted
  const handleReplySubmitted = async (payload) => {
    if (!selectedTicket) return;
    const updated = await addTicketMessage(selectedTicket._id, payload);
    setSelectedTicket(updated);
    fetchTickets();
  };

  return (
    <div className="p-6 md:p-10 space-y-8 max-w-[1600px] mx-auto">
      {/* ── HEADER ──────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span
            className="text-xs font-bold uppercase tracking-wider"
            style={{ color: "var(--color-accent)" }}
          >
            Customer Relations
          </span>
          <h1 className="text-3xl font-serif font-bold text-[var(--color-heading)] mt-1">
            Support Tickets
          </h1>
          <p className="text-sm text-[var(--color-muted)] mt-1">
            Manage inquiries, update ticket statuses, assign customer service agents, and resolve issues.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchTickets}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-xs font-semibold text-[var(--color-heading)] hover:bg-[var(--color-surface-alt)] transition self-start sm:self-auto"
        >
          <FiRefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* ── METRIC CARDS ────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <div
          onClick={() => setStatusFilter("All")}
          className={`p-4 rounded-2xl border cursor-pointer transition ${
            statusFilter === "All"
              ? "border-[var(--color-accent)] ring-2 ring-[var(--color-accent)]/20 bg-[var(--color-surface)]"
              : "border-[var(--color-border)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-alt)]"
          }`}
        >
          <div className="flex items-center justify-between text-xs text-[var(--color-muted)] font-semibold mb-1">
            <span>Total</span>
            <FiLifeBuoy size={14} />
          </div>
          <span className="text-2xl font-serif font-bold text-[var(--color-heading)]">
            {stats.total}
          </span>
        </div>

        <div
          onClick={() => setStatusFilter("Open")}
          className={`p-4 rounded-2xl border cursor-pointer transition ${
            statusFilter === "Open"
              ? "border-sky-500 ring-2 ring-sky-500/20 bg-[var(--color-surface)]"
              : "border-[var(--color-border)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-alt)]"
          }`}
        >
          <div className="flex items-center justify-between text-xs text-sky-600 font-semibold mb-1">
            <span>Open</span>
            <FiClock size={14} />
          </div>
          <span className="text-2xl font-serif font-bold text-sky-600">
            {stats.open}
          </span>
        </div>

        <div
          onClick={() => setStatusFilter("In Progress")}
          className={`p-4 rounded-2xl border cursor-pointer transition ${
            statusFilter === "In Progress"
              ? "border-amber-500 ring-2 ring-amber-500/20 bg-[var(--color-surface)]"
              : "border-[var(--color-border)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-alt)]"
          }`}
        >
          <div className="flex items-center justify-between text-xs text-amber-600 font-semibold mb-1">
            <span>In Progress</span>
            <FiLoader size={14} />
          </div>
          <span className="text-2xl font-serif font-bold text-amber-600">
            {stats.inProgress}
          </span>
        </div>

        <div
          onClick={() => setStatusFilter("Waiting for Customer")}
          className={`p-4 rounded-2xl border cursor-pointer transition ${
            statusFilter === "Waiting for Customer"
              ? "border-indigo-500 ring-2 ring-indigo-500/20 bg-[var(--color-surface)]"
              : "border-[var(--color-border)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-alt)]"
          }`}
        >
          <div className="flex items-center justify-between text-xs text-indigo-600 font-semibold mb-1">
            <span>Waiting</span>
            <FiUserCheck size={14} />
          </div>
          <span className="text-2xl font-serif font-bold text-indigo-600">
            {stats.waitingForCustomer}
          </span>
        </div>

        <div
          onClick={() => setStatusFilter("Resolved")}
          className={`p-4 rounded-2xl border cursor-pointer transition ${
            statusFilter === "Resolved"
              ? "border-emerald-500 ring-2 ring-emerald-500/20 bg-[var(--color-surface)]"
              : "border-[var(--color-border)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-alt)]"
          }`}
        >
          <div className="flex items-center justify-between text-xs text-emerald-600 font-semibold mb-1">
            <span>Resolved</span>
            <FiCheckCircle size={14} />
          </div>
          <span className="text-2xl font-serif font-bold text-emerald-600">
            {stats.resolved}
          </span>
        </div>

        <div
          onClick={() => setStatusFilter("Closed")}
          className={`p-4 rounded-2xl border cursor-pointer transition ${
            statusFilter === "Closed"
              ? "border-neutral-500 ring-2 ring-neutral-500/20 bg-[var(--color-surface)]"
              : "border-[var(--color-border)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-alt)]"
          }`}
        >
          <div className="flex items-center justify-between text-xs text-[var(--color-muted)] font-semibold mb-1">
            <span>Closed</span>
            <FiArchive size={14} />
          </div>
          <span className="text-2xl font-serif font-bold text-[var(--color-muted)]">
            {stats.closed}
          </span>
        </div>
      </div>

      {/* ── SEARCH & FILTERS BAR ────────────────────────────────── */}
      <div
        className="p-5 rounded-2xl border shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 flex-wrap"
        style={{
          background: "var(--color-surface)",
          borderColor: "var(--color-border)",
        }}
      >
        <div className="relative flex-1 min-w-[240px]">
          <FiSearch
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-muted)]"
            size={16}
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tickets by ID, subject, customer, order..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
            style={{
              background: "var(--color-surface-alt)",
              borderColor: "var(--color-border)",
              color: "var(--color-heading)",
            }}
          />
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2.5 rounded-xl border text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
            style={{
              background: "var(--color-surface-alt)",
              borderColor: "var(--color-border)",
              color: "var(--color-heading)",
            }}
          >
            <option value="All">All Statuses</option>
            <option value="Open">Open</option>
            <option value="In Progress">In Progress</option>
            <option value="Waiting for Customer">Waiting for Customer</option>
            <option value="Resolved">Resolved</option>
            <option value="Closed">Closed</option>
          </select>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2.5 rounded-xl border text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
            style={{
              background: "var(--color-surface-alt)",
              borderColor: "var(--color-border)",
              color: "var(--color-heading)",
            }}
          >
            <option value="All">All Categories</option>
            <option value="Order">Order</option>
            <option value="Payment">Payment</option>
            <option value="Delivery">Delivery</option>
            <option value="Product">Product</option>
            <option value="Return">Return</option>
            <option value="Other">Other</option>
          </select>

          {/* Priority Filter */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-3 py-2.5 rounded-xl border text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
            style={{
              background: "var(--color-surface-alt)",
              borderColor: "var(--color-border)",
              color: "var(--color-heading)",
            }}
          >
            <option value="All">All Priorities</option>
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
            <option value="Urgent">Urgent</option>
          </select>

          {/* Assignee Filter */}
          <select
            value={assignedFilter}
            onChange={(e) => setAssignedFilter(e.target.value)}
            className="px-3 py-2.5 rounded-xl border text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
            style={{
              background: "var(--color-surface-alt)",
              borderColor: "var(--color-border)",
              color: "var(--color-heading)",
            }}
          >
            <option value="All">All Assignees</option>
            <option value="unassigned">Unassigned</option>
            {agents.map((ag) => (
              <option key={ag._id} value={ag._id}>
                {ag.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ── TICKETS TABLE ───────────────────────────────────────── */}
      <div
        className="rounded-2xl border shadow-sm overflow-hidden"
        style={{
          background: "var(--color-surface)",
          borderColor: "var(--color-border)",
        }}
      >
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs sm:text-sm">
            <thead>
              <tr
                className="border-b text-xs font-bold uppercase tracking-wider text-[var(--color-muted)]"
                style={{
                  background: "var(--color-surface-alt)",
                  borderColor: "var(--color-border)",
                }}
              >
                <th className="p-4 sm:p-5">Ticket #</th>
                <th className="p-4 sm:p-5">Customer</th>
                <th className="p-4 sm:p-5">Subject</th>
                <th className="p-4 sm:p-5">Category</th>
                <th className="p-4 sm:p-5">Status</th>
                <th className="p-4 sm:p-5">Assignee</th>
                <th className="p-4 sm:p-5">Last Activity</th>
                <th className="p-4 sm:p-5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {loading ? (
                <tr>
                  <td colSpan={8} className="p-16 text-center text-[var(--color-muted)]">
                    <div className="inline-block w-8 h-8 border-3 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin mb-3" />
                    <p>Loading support tickets...</p>
                  </td>
                </tr>
              ) : tickets.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-16 text-center text-[var(--color-muted)]">
                    <FiLifeBuoy size={32} className="mx-auto mb-2 opacity-50" />
                    <p className="font-semibold text-sm text-[var(--color-heading)]">
                      No support tickets found
                    </p>
                    <p className="text-xs text-[var(--color-muted)] mt-1">
                      No customer requests match your current search and filter settings.
                    </p>
                  </td>
                </tr>
              ) : (
                tickets.map((t) => (
                  <tr
                    key={t._id}
                    onClick={() => handleSelectTicket(t)}
                    className="hover:bg-[var(--color-surface-alt)]/60 cursor-pointer transition"
                  >
                    <td className="p-4 sm:p-5 font-mono font-bold text-[var(--color-heading)]">
                      #{t.ticketNumber}
                    </td>

                    <td className="p-4 sm:p-5">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-[var(--color-surface-alt)] border border-[var(--color-border)] flex items-center justify-center font-bold text-xs uppercase shrink-0">
                          {t.user?.name ? t.user.name.charAt(0) : "C"}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-[var(--color-heading)] truncate">
                            {t.user?.name || "Customer"}
                          </p>
                          <p className="text-[11px] text-[var(--color-muted)] truncate">
                            {t.user?.email || "—"}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="p-4 sm:p-5 max-w-xs">
                      <p className="font-semibold text-[var(--color-heading)] truncate">
                        {t.subject}
                      </p>
                      {t.orderId && (
                        <span className="text-[10px] font-mono text-[var(--color-muted)] flex items-center gap-1 mt-0.5">
                          <FiPackage size={10} /> Order #{t.orderId}
                        </span>
                      )}
                    </td>

                    <td className="p-4 sm:p-5">
                      <TicketCategoryBadge category={t.category} size="sm" />
                    </td>

                    <td className="p-4 sm:p-5">
                      <TicketStatusBadge status={t.status} size="sm" />
                    </td>

                    <td className="p-4 sm:p-5">
                      {t.assignedTo ? (
                        <span className="inline-flex items-center gap-1 font-semibold text-xs text-[var(--color-heading)]">
                          <FiUser size={12} className="text-[var(--color-accent)]" />
                          {t.assignedTo.name}
                        </span>
                      ) : (
                        <span className="text-[11px] font-medium text-amber-700 dark:text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded-md">
                          Unassigned
                        </span>
                      )}
                    </td>

                    <td className="p-4 sm:p-5 text-xs text-[var(--color-muted)] whitespace-nowrap">
                      {new Date(t.lastMessageAt || t.updatedAt).toLocaleString("en-IN", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>

                    <td className="p-4 sm:p-5 text-right">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectTicket(t);
                        }}
                        className="p-1.5 rounded-lg border border-[var(--color-border)] hover:bg-[var(--color-surface-alt)] hover:text-[var(--color-accent)] transition text-[var(--color-muted)]"
                        title="Open Ticket"
                      >
                        <FiChevronRight size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── SLIDE-OVER TICKET DETAIL DRAWER ─────────────────────── */}
      {selectedTicket && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-fadeIn"
          onClick={() => setSelectedTicket(null)}
        >
          <div
            className="w-full max-w-3xl h-full flex flex-col shadow-2xl border-l border-[var(--color-border)] overflow-hidden"
            style={{
              background: "var(--color-surface)",
              color: "var(--color-heading)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer Header */}
            <div className="p-6 border-b border-[var(--color-border)] flex items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="font-mono text-xs font-bold text-[var(--color-muted)]">
                    #{selectedTicket.ticketNumber}
                  </span>
                  <TicketCategoryBadge category={selectedTicket.category} size="sm" />
                  <TicketStatusBadge status={selectedTicket.status} size="sm" />
                </div>
                <h2 className="text-xl font-serif font-bold text-[var(--color-heading)] line-clamp-1">
                  {selectedTicket.subject}
                </h2>
              </div>

              <button
                type="button"
                onClick={() => setSelectedTicket(null)}
                className="p-2 rounded-full text-[var(--color-muted)] hover:text-[var(--color-heading)] hover:bg-[var(--color-surface-alt)] transition"
              >
                <FiX size={20} />
              </button>
            </div>

            {/* Quick Admin Actions Bar */}
            <div className="px-6 py-4 bg-[var(--color-surface-alt)] border-b border-[var(--color-border)] flex flex-wrap items-center justify-between gap-3 text-xs">
              {/* Status Selector */}
              <div className="flex items-center gap-2">
                <span className="font-bold uppercase tracking-wider text-[var(--color-muted)]">
                  Status:
                </span>
                <select
                  id="admin-drawer-status-select"
                  value={selectedTicket.status}
                  disabled={updatingStatus}
                  onChange={(e) => handleStatusChange(e.target.value)}
                  className="px-3 py-1.5 rounded-xl border bg-[var(--color-surface)] text-[var(--color-heading)] border-[var(--color-border)] font-bold focus:outline-none"
                >
                  <option value="Open">Open</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Waiting for Customer">Waiting for Customer</option>
                  <option value="Resolved">Resolved</option>
                  <option value="Closed">Closed</option>
                </select>
              </div>

              {/* Assignee Selector */}
              <div className="flex items-center gap-2">
                <span className="font-bold uppercase tracking-wider text-[var(--color-muted)]">
                  Assign Agent:
                </span>
                <select
                  id="admin-drawer-agent-select"
                  value={selectedTicket.assignedTo?._id || ""}
                  disabled={updatingAssignee}
                  onChange={(e) => handleAssignChange(e.target.value)}
                  className="px-3 py-1.5 rounded-xl border bg-[var(--color-surface)] text-[var(--color-heading)] border-[var(--color-border)] font-bold focus:outline-none"
                >
                  <option value="">Unassigned</option>
                  {agents.map((ag) => (
                    <option key={ag._id} value={ag._id}>
                      {ag.name} ({ag.email})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Customer Details Box */}
            <div className="px-6 py-3 border-b border-[var(--color-border)] bg-[var(--color-surface)] flex items-center justify-between text-xs text-[var(--color-muted)] flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <FiUser size={13} />
                <span>Customer: <strong>{selectedTicket.user?.name || "Customer"}</strong> ({selectedTicket.user?.email})</span>
              </div>
              {selectedTicket.orderId && (
                <div className="flex items-center gap-1 font-mono">
                  <FiPackage size={13} />
                  <span>Order: #{selectedTicket.orderId}</span>
                </div>
              )}
            </div>

            {/* Scrollable Conversation Thread */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <TicketMessageList
                messages={selectedTicket.messages}
                currentUserId={currentUser?._id}
              />
            </div>

            {/* Admin Reply Box at Bottom */}
            <div className="p-5 border-t border-[var(--color-border)] bg-[var(--color-surface)]">
              <TicketReplyBox
                ticketId={selectedTicket._id}
                ticketStatus={selectedTicket.status}
                isAdmin={true}
                onReplySubmitted={handleReplySubmitted}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
