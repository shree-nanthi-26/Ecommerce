import SEO from "../components/common/SEO";
import { useState, useEffect, useCallback } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiChevronDown,
  FiMail,
  FiPhone,
  FiHelpCircle,
  FiShield,
  FiTruck,
  FiRefreshCw,
  FiPlus,
  FiSearch,
  FiMessageSquare,
  FiArrowLeft,
  FiLock,
  FiLifeBuoy,
  FiLoader,
} from "react-icons/fi";
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";
import { useAuth } from "../context/AuthContext";
import {
  getMyTickets,
  getTicketById,
  addTicketMessage,
} from "../services/ticketService";
import TicketStatusBadge from "../components/tickets/TicketStatusBadge";
import TicketCategoryBadge from "../components/tickets/TicketCategoryBadge";
import TicketCard from "../components/tickets/TicketCard";
import TicketMessageList from "../components/tickets/TicketMessageList";
import TicketReplyBox from "../components/tickets/TicketReplyBox";
import CreateTicketModal from "../components/tickets/CreateTicketModal";

const FAQS = [
  {
    q: "How does furniture delivery work and what are the timelines?",
    a: "We provide specialized white-glove furniture delivery. Metro orders are delivered within 4–7 business days, while non-metro locations take 7–10 days. Our delivery partners call in advance to coordinate a convenient delivery time slot.",
  },
  {
    q: "Is furniture assembly included or do I have to assemble it myself?",
    a: "All large furniture items (beds, dining tables, wardrobes, study desks) include 100% FREE professional carpenter assembly at the time of delivery or within 24 hours of drop-off.",
  },
  {
    q: "How do I care for solid wood furniture and fabric upholstery?",
    a: "Wipe wooden surfaces along the grain with a dry or slightly damp soft microfiber cloth. Avoid abrasive cleaners, direct sunlight exposure, and standing water. Use coasters for hot mugs and glasses. For fabric upholstery, regular vacuuming and prompt spot-cleaning with mild upholstery foam is recommended.",
  },
  {
    q: "What is your return and exchange policy for furniture?",
    a: "We offer a 15-day easy return policy on all furniture. If the piece doesn't fit your space or match your decor, you can initiate a return through 'My Orders' for a full refund or swap. The piece must be in undamaged original condition.",
  },
  {
    q: "What does the 3-Year Furniva Warranty cover?",
    a: "Our 3-year craftsmanship warranty covers structural timber integrity, joint stability, hardware malfunctions (hinges, runners, hydraulic gas lifts), and termite or borer infestation. It does not cover accidental damage, physical cuts, or fabric wear and tear.",
  },
  {
    q: "How can I track my furniture shipment?",
    a: "Once your order is dispatched from our master workshop, you will receive real-time tracking links via SMS and email. You can also track milestones directly on our 'Track Order' page.",
  },
  {
    q: "What should I do if my furniture arrives damaged or scratched?",
    a: "Please inspect your furniture thoroughly in the presence of our delivery team. If any defect or transit scratch is found, note it on the delivery receipt and reject the piece, or create a support ticket with attached photos. We will initiate a priority replacement at no cost.",
  },
];

const STATUS_FILTERS = [
  "All",
  "Open",
  "In Progress",
  "Waiting for Customer",
  "Resolved",
  "Closed",
];

function Support() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  // Active view states
  const ticketParam = searchParams.get("ticket");
  const tabParam = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState(
    ticketParam ? "tickets" : tabParam || (user ? "tickets" : "faq")
  );
  const [openFaqIndex, setOpenFaqIndex] = useState(0);

  useEffect(() => {
    if (user && !tabParam) {
      setActiveTab("tickets");
    }
  }, [user, tabParam]);

  // Tickets state
  const [tickets, setTickets] = useState([]);
  const [loadingTickets, setLoadingTickets] = useState(false);
  const [ticketSearch, setTicketSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const createParam = searchParams.get("create");
  const [createModalOpen, setCreateModalOpen] = useState(Boolean(createParam));

  useEffect(() => {
    if (createParam === "true" || createParam === "1") {
      setCreateModalOpen(true);
    }
  }, [createParam]);

  // Selected ticket for detailed thread view
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [loadingSelected, setLoadingSelected] = useState(false);
  const [selectedError, setSelectedError] = useState(null);

  // Fetch customer's tickets
  const fetchTickets = useCallback(async () => {
    if (!user) return;
    try {
      setLoadingTickets(true);
      const data = await getMyTickets({
        status: statusFilter,
        category: categoryFilter,
        search: ticketSearch,
      });
      setTickets(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load customer tickets:", err);
    } finally {
      setLoadingTickets(false);
    }
  }, [user, statusFilter, categoryFilter, ticketSearch]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  // Load specific ticket if selected or in URL query
  const loadTicketDetail = useCallback(
    async (ticketIdOrNumber) => {
      try {
        setLoadingSelected(true);
        setSelectedError(null);
        const data = await getTicketById(ticketIdOrNumber);
        setSelectedTicket(data);
      } catch (err) {
        console.error("Failed to load ticket detail:", err);
        setSelectedError(
          err.response?.data?.message || "Ticket not found or access denied."
        );
      } finally {
        setLoadingSelected(false);
      }
    },
    []
  );

  useEffect(() => {
    if (ticketParam && user) {
      setActiveTab("tickets");
      loadTicketDetail(ticketParam);
    }
  }, [ticketParam, user, loadTicketDetail]);

  const handleSelectTicket = (t) => {
    setSelectedTicket(t);
    setSearchParams({ ticket: t.ticketNumber });
  };

  const handleBackToList = () => {
    setSelectedTicket(null);
    setSearchParams({});
    fetchTickets();
  };

  const handleReplySubmitted = async (payload) => {
    if (!selectedTicket) return;
    const updated = await addTicketMessage(selectedTicket._id, payload);
    setSelectedTicket(updated);
    fetchTickets();
  };

  const handleTicketCreated = (newTicket) => {
    fetchTickets();
    handleSelectTicket(newTicket);
  };

  const toggleFaq = (index) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };

  return (
    <>
      <SEO
        title="Customer Support & Help Center | Furniva"
        description="Furniva customer support and assistance. Track orders, report issues, and communicate directly with furniture specialists."
        canonicalUrl="/support"
        breadcrumbs={[
          { name: "Home", item: "/" },
          { name: "Customer Support", item: "/support" },
        ]}
      />

      <Navbar />

      <main
        className="min-h-screen px-4 sm:px-8 py-12"
        style={{ background: "var(--color-bg)", color: "var(--color-heading)" }}
      >
        <div className="mx-auto max-w-[1240px]">
          {/* ── BREADCRUMB ────────────────────────────────────────── */}
          <nav
            aria-label="Breadcrumb"
            className="mb-6 flex items-center gap-2 text-xs sm:text-sm font-medium"
            style={{ color: "var(--color-muted)" }}
          >
            <Link to="/" className="hover:text-[var(--color-heading)] transition">
              Home
            </Link>
            <span>/</span>
            <span className="text-[var(--color-heading)] font-semibold">Support</span>
          </nav>

          {/* ── PAGE HEADER ──────────────────────────────────────── */}
          <div className="mb-8 flex flex-col md:flex-row md:items-end md:justify-between gap-6 pb-6 border-b border-[var(--color-border)]">
            <div>
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span
                  className="text-xs font-bold uppercase tracking-[0.25em] px-2.5 py-1 rounded-md"
                  style={{
                    background: "var(--color-accent-light)",
                    color: "var(--color-accent)",
                  }}
                >
                  Customer Care & Concierge
                </span>
                {user && (
                  <span className="text-xs text-[var(--color-muted)] font-medium">
                    Logged in as <strong>{user.name}</strong>
                  </span>
                )}
              </div>
              <h1 className="text-3xl sm:text-4xl font-serif font-bold tracking-tight text-[var(--color-heading)]">
                Support & Ticket Helpdesk
              </h1>
              <p className="mt-1 text-sm sm:text-base text-[var(--color-muted)] max-w-2xl">
                Have questions regarding your furniture order, delivery, warranty, or returns?
                Create a support ticket to receive direct assistance from our specialized artisans.
              </p>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center gap-2 self-start md:self-end">
              <button
                type="button"
                onClick={() => {
                  setActiveTab("tickets");
                  if (selectedTicket) handleBackToList();
                }}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition ${
                  activeTab === "tickets"
                    ? "bg-[var(--color-accent)] text-white shadow-sm"
                    : "bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-body)] hover:bg-[var(--color-surface-alt)]"
                }`}
              >
                <FiMessageSquare size={16} />
                <span>My Tickets</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab("faq");
                  setSelectedTicket(null);
                }}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition ${
                  activeTab === "faq"
                    ? "bg-[var(--color-accent)] text-white shadow-sm"
                    : "bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-body)] hover:bg-[var(--color-surface-alt)]"
                }`}
              >
                <FiHelpCircle size={16} />
                <span>FAQs & Knowledge</span>
              </button>
            </div>
          </div>

          {/* ── NOT LOGGED IN CALL TO ACTION ──────────────────────── */}
          {!user && activeTab === "tickets" && (
            <div
              className="rounded-3xl p-8 sm:p-12 text-center border shadow-sm max-w-xl mx-auto my-8"
              style={{
                background: "var(--color-surface)",
                borderColor: "var(--color-border)",
              }}
            >
              <div
                className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center mb-5"
                style={{
                  background: "var(--color-accent-light)",
                  color: "var(--color-accent)",
                }}
              >
                <FiLock size={28} />
              </div>
              <h2 className="text-2xl font-serif font-bold text-[var(--color-heading)]">
                Sign In to Access Support Tickets
              </h2>
              <p className="mt-2 text-sm text-[var(--color-muted)] leading-relaxed">
                To protect customer privacy and order security, an account is required to create
                tickets, attach photos, and message our support specialists.
              </p>
              <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link
                  to="/login?redirect=/support"
                  className="w-full sm:w-auto px-6 py-3 rounded-xl font-bold text-sm text-white shadow-sm hover:opacity-95 transition"
                  style={{ background: "var(--color-accent)" }}
                >
                  Sign In to Continue
                </Link>
                <Link
                  to="/register?redirect=/support"
                  className="w-full sm:w-auto px-6 py-3 rounded-xl font-semibold text-sm border border-[var(--color-border)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-alt)] transition text-[var(--color-heading)]"
                >
                  Create Account
                </Link>
              </div>
            </div>
          )}

          {/* ── TICKET SYSTEM (LOGGED IN) ─────────────────────────── */}
          {user && activeTab === "tickets" && (
            <div>
              {loadingSelected ? (
                <div className="py-24 text-center">
                  <FiLoader className="inline-block w-8 h-8 animate-spin text-[var(--color-accent)] mb-3" />
                  <p className="text-sm text-[var(--color-muted)]">Loading ticket conversation...</p>
                </div>
              ) : selectedError ? (
                <div
                  className="rounded-3xl p-8 text-center border shadow-sm max-w-lg mx-auto"
                  style={{
                    background: "var(--color-surface)",
                    borderColor: "var(--color-border)",
                  }}
                >
                  <p className="font-semibold text-rose-600 mb-2">{selectedError}</p>
                  <button
                    type="button"
                    onClick={handleBackToList}
                    className="mt-4 px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm text-white"
                    style={{ background: "var(--color-accent)" }}
                  >
                    Back to Tickets
                  </button>
                </div>
              ) : selectedTicket ? (
                /* ── SINGLE TICKET DETAIL VIEW ──────────────────── */
                <div className="space-y-6 animate-fadeIn">
                  {/* Top Bar with Back Button */}
                  <div className="flex items-center justify-between gap-4 pb-4 border-b border-[var(--color-border)] flex-wrap">
                    <button
                      type="button"
                      onClick={handleBackToList}
                      className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--color-muted)] hover:text-[var(--color-heading)] transition"
                    >
                      <FiArrowLeft size={16} /> Back to All Tickets
                    </button>

                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-bold text-[var(--color-muted)]">
                        #{selectedTicket.ticketNumber}
                      </span>
                      <TicketCategoryBadge category={selectedTicket.category} size="md" />
                      <TicketStatusBadge status={selectedTicket.status} size="md" />
                    </div>
                  </div>

                  {/* Ticket Header Card */}
                  <div
                    className="rounded-3xl p-6 sm:p-8 border shadow-sm"
                    style={{
                      background: "var(--color-surface)",
                      borderColor: "var(--color-border)",
                    }}
                  >
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                      <div>
                        <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-accent)]">
                          Ticket Inquiry
                        </span>
                        <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[var(--color-heading)] mt-1">
                          {selectedTicket.subject}
                        </h2>
                        <div className="flex items-center gap-3 text-xs text-[var(--color-muted)] mt-2 flex-wrap">
                          <span>
                            Created on{" "}
                            {new Date(selectedTicket.createdAt).toLocaleDateString("en-IN", {
                              month: "long",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </span>
                          {selectedTicket.orderId && (
                            <>
                              <span>•</span>
                              <span>Order: #{selectedTicket.orderId}</span>
                            </>
                          )}
                          <span>•</span>
                          <span>Priority: {selectedTicket.priority}</span>
                        </div>
                      </div>

                      {selectedTicket.assignedTo && (
                        <div className="p-3 rounded-2xl bg-[var(--color-surface-alt)] border border-[var(--color-border)] text-xs">
                          <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-muted)]">
                            Assigned Agent
                          </p>
                          <p className="font-semibold text-[var(--color-heading)] mt-0.5">
                            {selectedTicket.assignedTo.name}
                          </p>
                          <p className="text-[11px] text-[var(--color-muted)]">
                            Furniva Concierge Team
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Messages Timeline Thread */}
                  <div>
                    <h3 className="text-lg font-serif font-bold text-[var(--color-heading)] mb-4 flex items-center gap-2">
                      <FiMessageSquare className="text-[var(--color-accent)]" />
                      Conversation History ({selectedTicket.messages?.length || 0})
                    </h3>

                    <TicketMessageList
                      messages={selectedTicket.messages}
                      currentUserId={user._id}
                    />
                  </div>

                  {/* Reply Box */}
                  <div>
                    <TicketReplyBox
                      ticketId={selectedTicket._id}
                      ticketStatus={selectedTicket.status}
                      isAdmin={false}
                      onReplySubmitted={handleReplySubmitted}
                    />
                  </div>
                </div>
              ) : (
                /* ── TICKET HISTORY LIST VIEW ───────────────────── */
                <div className="space-y-6">
                  {/* Action Toolbar */}
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Search & Category Filter */}
                    <div className="flex items-center gap-3 flex-1 flex-wrap">
                      <div className="relative min-w-[240px] flex-1 max-w-md">
                        <FiSearch
                          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-muted)]"
                          size={16}
                        />
                        <input
                          type="text"
                          value={ticketSearch}
                          onChange={(e) => setTicketSearch(e.target.value)}
                          placeholder="Search tickets by subject, #ID, or order..."
                          className="w-full pl-9 pr-4 py-2.5 rounded-xl border text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
                          style={{
                            background: "var(--color-surface)",
                            borderColor: "var(--color-border)",
                            color: "var(--color-heading)",
                          }}
                        />
                      </div>

                      {/* Category Dropdown */}
                      <select
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                        className="px-3 py-2.5 rounded-xl border text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
                        style={{
                          background: "var(--color-surface)",
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
                    </div>

                    {/* Create Ticket Button */}
                    <button
                      id="create-ticket-btn-top"
                      type="button"
                      onClick={() => setCreateModalOpen(true)}
                      className="px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm text-white shadow-sm flex items-center justify-center gap-2 hover:opacity-95 transition"
                      style={{ background: "var(--color-accent)" }}
                    >
                      <FiPlus size={16} /> Create New Ticket
                    </button>
                  </div>

                  {/* Status Filter Tabs */}
                  <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none text-xs">
                    {STATUS_FILTERS.map((st) => (
                      <button
                        key={st}
                        type="button"
                        onClick={() => setStatusFilter(st)}
                        className={`px-3.5 py-1.5 rounded-full font-semibold transition shrink-0 ${
                          statusFilter === st
                            ? "bg-[var(--color-accent)] text-white shadow-sm"
                            : "bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-body)] hover:bg-[var(--color-surface-alt)]"
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>

                  {/* Ticket List */}
                  {loadingTickets ? (
                    <div className="py-20 text-center">
                      <div className="inline-block w-8 h-8 border-3 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin mb-3" />
                      <p className="text-sm text-[var(--color-muted)]">
                        Loading your support history...
                      </p>
                    </div>
                  ) : tickets.length === 0 ? (
                    <div
                      className="rounded-3xl p-12 text-center border shadow-sm max-w-lg mx-auto"
                      style={{
                        background: "var(--color-surface)",
                        borderColor: "var(--color-border)",
                      }}
                    >
                      <div
                        className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center mb-4"
                        style={{
                          background: "var(--color-accent-light)",
                          color: "var(--color-accent)",
                        }}
                      >
                        <FiLifeBuoy size={30} />
                      </div>
                      <h3 className="text-xl font-serif font-bold text-[var(--color-heading)]">
                        No Support Tickets Found
                      </h3>
                      <p className="mt-2 text-sm text-[var(--color-muted)] leading-relaxed">
                        {statusFilter !== "All" || categoryFilter !== "All" || ticketSearch
                          ? "No tickets match your active filter criteria."
                          : "You have not opened any support requests yet. Have questions about an order or furniture care?"}
                      </p>
                      <button
                        id="create-ticket-btn-empty"
                        type="button"
                        onClick={() => setCreateModalOpen(true)}
                        className="mt-6 px-6 py-3 rounded-xl font-bold text-xs sm:text-sm text-white shadow-sm hover:opacity-95 transition"
                        style={{ background: "var(--color-accent)" }}
                      >
                        + Create Your First Ticket
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {tickets.map((ticket) => (
                        <TicketCard
                          key={ticket._id || ticket.id}
                          ticket={ticket}
                          onSelect={handleSelectTicket}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ── KNOWLEDGE BASE & FAQS TAB ─────────────────────────── */}
          {activeTab === "faq" && (
            <div className="space-y-16 animate-fadeIn">
              {/* Feature Highlights */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div
                  className="rounded-3xl p-6 text-center shadow-sm"
                  style={{
                    border: "1px solid var(--color-border)",
                    background: "var(--color-surface)",
                  }}
                >
                  <div
                    className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl"
                    style={{
                      background: "var(--color-accent-light)",
                      color: "var(--color-accent)",
                    }}
                  >
                    <FiTruck size={24} />
                  </div>
                  <h3 className="font-serif font-bold text-lg">White-Glove Delivery</h3>
                  <p className="mt-2 text-sm" style={{ color: "var(--color-muted)" }}>
                    Safe handling, specialized transport, and room-of-choice placement.
                  </p>
                </div>

                <div
                  className="rounded-3xl p-6 text-center shadow-sm"
                  style={{
                    border: "1px solid var(--color-border)",
                    background: "var(--color-surface)",
                  }}
                >
                  <div
                    className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl"
                    style={{
                      background: "var(--color-accent-light)",
                      color: "var(--color-accent)",
                    }}
                  >
                    <FiShield size={24} />
                  </div>
                  <h3 className="font-serif font-bold text-lg">3-Year Warranty</h3>
                  <p className="mt-2 text-sm" style={{ color: "var(--color-muted)" }}>
                    Guaranteed coverage against structural, termite, and hardware defects.
                  </p>
                </div>

                <div
                  className="rounded-3xl p-6 text-center shadow-sm"
                  style={{
                    border: "1px solid var(--color-border)",
                    background: "var(--color-surface)",
                  }}
                >
                  <div
                    className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl"
                    style={{
                      background: "var(--color-accent-light)",
                      color: "var(--color-accent)",
                    }}
                  >
                    <FiRefreshCw size={24} />
                  </div>
                  <h3 className="font-serif font-bold text-lg">15-Day Easy Returns</h3>
                  <p className="mt-2 text-sm" style={{ color: "var(--color-muted)" }}>
                    Hassle-free doorstep pickup if your new furniture doesn&apos;t suit your space.
                  </p>
                </div>
              </div>

              {/* FAQ Accordion */}
              <div>
                <h2 className="text-2xl font-serif font-bold mb-6 flex items-center gap-2">
                  <FiHelpCircle style={{ color: "var(--color-accent)" }} /> Frequently Asked
                  Questions
                </h2>

                <div className="space-y-4">
                  {FAQS.map((faq, index) => {
                    const isOpen = openFaqIndex === index;
                    return (
                      <div
                        key={index}
                        className="rounded-2xl overflow-hidden shadow-sm"
                        style={{
                          border: "1px solid var(--color-border)",
                          background: "var(--color-surface)",
                        }}
                      >
                        <button
                          type="button"
                          onClick={() => toggleFaq(index)}
                          className="w-full flex items-center justify-between p-5 text-left font-semibold text-base transition hover:bg-[var(--color-surface-alt)]"
                        >
                          <span className="font-serif font-bold text-lg">{faq.q}</span>
                          <motion.span
                            animate={{ rotate: isOpen ? 180 : 0 }}
                            transition={{ duration: 0.2 }}
                            className="shrink-0 ml-4"
                          >
                            <FiChevronDown size={20} style={{ color: "var(--color-muted)" }} />
                          </motion.span>
                        </button>

                        <AnimatePresence>
                          {isOpen && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.3 }}
                              className="overflow-hidden"
                            >
                              <div
                                className="p-5 pt-0 text-sm leading-relaxed"
                                style={{
                                  color: "var(--color-muted)",
                                  borderTop: "1px dashed var(--color-border)",
                                }}
                              >
                                <p className="mt-4">{faq.a}</p>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Contact Box */}
              <div
                className="rounded-3xl p-8 md:p-12 text-center border shadow-sm"
                style={{
                  background: "var(--color-surface-alt)",
                  border: "1px solid var(--color-border)",
                }}
              >
                <h3 className="text-2xl font-serif font-bold">Need Immediate Assistance?</h3>
                <p className="mt-2 text-sm" style={{ color: "var(--color-muted)" }}>
                  Our interior decor and furniture specialists are available Monday through Saturday
                  from 9:00 AM to 8:00 PM IST.
                </p>

                <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
                  {user ? (
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab("tickets");
                        setCreateModalOpen(true);
                      }}
                      className="flex items-center justify-center gap-2 rounded-xl px-6 py-3.5 font-bold text-sm text-white transition shadow-sm"
                      style={{ background: "var(--color-accent)" }}
                    >
                      <FiPlus size={17} /> Open Support Ticket
                    </button>
                  ) : (
                    <Link
                      to="/login?redirect=/support"
                      className="flex items-center justify-center gap-2 rounded-xl px-6 py-3.5 font-bold text-sm text-white transition shadow-sm"
                      style={{ background: "var(--color-accent)" }}
                    >
                      Sign In & Create Ticket
                    </Link>
                  )}

                  <a
                    href="mailto:hello@furniva.com"
                    className="flex items-center justify-center gap-2 rounded-xl px-6 py-3.5 font-semibold text-sm transition border"
                    style={{
                      border: "1px solid var(--color-border)",
                      background: "var(--color-surface)",
                      color: "var(--color-heading)",
                    }}
                  >
                    <FiMail size={17} /> Email: hello@furniva.com
                  </a>

                  <a
                    href="tel:18001234567"
                    className="flex items-center justify-center gap-2 rounded-xl px-6 py-3.5 font-semibold text-sm transition border"
                    style={{
                      border: "1px solid var(--color-border)",
                      background: "var(--color-surface)",
                      color: "var(--color-heading)",
                    }}
                  >
                    <FiPhone size={17} /> 1800-123-4567
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* ── CREATE TICKET MODAL ───────────────────────────────── */}
      <CreateTicketModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onTicketCreated={handleTicketCreated}
      />

      <Footer />
    </>
  );
}

export default Support;
