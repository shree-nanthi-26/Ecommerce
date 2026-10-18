import { useState, useEffect, useRef } from "react";
import {
  FiX,
  FiSend,
  FiImage,
  FiLoader,
  FiAlertCircle,
  FiShoppingBag,
  FiCreditCard,
  FiTruck,
  FiBox,
  FiRefreshCw,
  FiHelpCircle,
} from "react-icons/fi";
import { createTicket } from "../../services/ticketService";
import { getMyOrders } from "../../services/orderService";
import { uploadMultipleImages } from "../../services/uploadService";

const CATEGORIES = [
  { id: "Order", label: "Order", desc: "Status, modification, or cancellation", icon: FiShoppingBag },
  { id: "Payment", label: "Payment", desc: "Billing, refunds, or invoice issues", icon: FiCreditCard },
  { id: "Delivery", label: "Delivery", desc: "White-glove scheduling, delay, or tracking", icon: FiTruck },
  { id: "Product", label: "Product", desc: "Specifications, timber care, or custom queries", icon: FiBox },
  { id: "Return", label: "Return", desc: "Doorstep exchange or 15-day return request", icon: FiRefreshCw },
  { id: "Other", label: "Other", desc: "General inquiries and feedback", icon: FiHelpCircle },
];

export default function CreateTicketModal({ isOpen, onClose, onTicketCreated }) {
  const [category, setCategory] = useState("Order");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [orderId, setOrderId] = useState("");
  const [priority, setPriority] = useState("Medium");
  const [attachments, setAttachments] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Orders list for dropdown if customer has orders
  const [orders, setOrders] = useState([]);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      async function loadOrders() {
        try {
          const res = await getMyOrders();
          const list = Array.isArray(res) ? res : res?.orders || [];
          setOrders(list);
        } catch {
          // Non-critical, user can manually type or omit order ID
        }
      }
      loadOrders();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    if (attachments.length + files.length > 5) {
      alert("You can attach a maximum of 5 images.");
      return;
    }

    try {
      setUploading(true);
      setError(null);
      const uploaded = await uploadMultipleImages(files);
      setAttachments((prev) => [...prev, ...uploaded]);
    } catch {
      setError("Image upload failed. Please verify format (JPEG/PNG) and size (< 5MB).");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const removeAttachment = (index) => {
    setAttachments((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!subject.trim()) {
      setError("Please provide a subject line for your inquiry.");
      return;
    }
    if (!message.trim()) {
      setError("Please describe your issue or question.");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const payload = {
        category,
        subject: subject.trim(),
        message: message.trim(),
        orderId: orderId ? orderId.trim() : null,
        priority,
        attachments: attachments.map((att) => ({
          url: att.url,
          publicId: att.publicId,
        })),
      };

      const newTicket = await createTicket(payload);

      if (onTicketCreated) {
        onTicketCreated(newTicket);
      }
      onClose();
    } catch (err) {
      console.error("Failed to create ticket:", err);
      setError(err.response?.data?.message || "Failed to create support ticket. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl max-h-[90vh] rounded-3xl p-6 sm:p-8 flex flex-col shadow-2xl overflow-hidden border border-[var(--color-border)]"
        style={{ background: "var(--color-surface)", color: "var(--color-heading)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[var(--color-border)]">
          <div>
            <span
              className="text-xs font-bold uppercase tracking-wider"
              style={{ color: "var(--color-accent)" }}
            >
              Furniva Support Concierge
            </span>
            <h2 className="text-xl sm:text-2xl font-serif font-bold text-[var(--color-heading)]">
              Create Support Ticket
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full text-[var(--color-muted)] hover:text-[var(--color-heading)] hover:bg-[var(--color-surface-alt)] transition"
          >
            <FiX size={20} />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto py-5 space-y-5 pr-1">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs sm:text-sm text-rose-700 dark:text-rose-300 flex items-center gap-2">
              <FiAlertCircle className="shrink-0" size={16} />
              <span>{error}</span>
            </div>
          )}

          {/* 1. Category Selector */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--color-muted)] mb-2.5">
              Select Category <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {CATEGORIES.map((cat) => {
                const isSelected = category === cat.id;
                const Icon = cat.icon;
                return (
                  <button
                    key={cat.id}
                    id={`ticket-category-btn-${cat.id}`}
                    type="button"
                    onClick={() => setCategory(cat.id)}
                    className={`flex flex-col items-start p-3 rounded-2xl border text-left transition ${
                      isSelected
                        ? "border-[var(--color-accent)] ring-2 ring-[var(--color-accent)]/20 bg-[var(--color-surface-alt)]"
                        : "border-[var(--color-border)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-alt)]/50"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Icon
                        size={15}
                        className={
                          isSelected ? "text-[var(--color-accent)]" : "text-[var(--color-muted)]"
                        }
                      />
                      <span className="font-serif font-bold text-xs sm:text-sm text-[var(--color-heading)]">
                        {cat.label}
                      </span>
                    </div>
                    <span className="text-[11px] text-[var(--color-muted)] line-clamp-1 leading-snug">
                      {cat.desc}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Subject Line */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--color-muted)] mb-2">
              Subject <span className="text-rose-500">*</span>
            </label>
            <input
              id="ticket-subject-input"
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g., Delivery slot rescheduling for Walnut Dining Table"
              maxLength={200}
              className="w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
              style={{
                background: "var(--color-surface-alt)",
                borderColor: "var(--color-border)",
                color: "var(--color-heading)",
              }}
            />
          </div>

          {/* 3. Optional Linked Order & Priority */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[var(--color-muted)] mb-2">
                Related Order (Optional)
              </label>
              {orders.length > 0 ? (
                <select
                  value={orderId}
                  onChange={(e) => setOrderId(e.target.value)}
                  className="w-full px-3.5 py-3 rounded-xl border text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
                  style={{
                    background: "var(--color-surface-alt)",
                    borderColor: "var(--color-border)",
                    color: "var(--color-heading)",
                  }}
                >
                  <option value="">No specific order</option>
                  {orders.map((ord) => (
                    <option key={ord._id || ord.id} value={ord._id || ord.id}>
                      Order #{ord.orderNumber || (ord._id || ord.id).slice(-8).toUpperCase()} – ₹
                      {ord.total?.toLocaleString("en-IN")} ({ord.status})
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={orderId}
                  onChange={(e) => setOrderId(e.target.value)}
                  placeholder="e.g. ORD-64812"
                  className="w-full px-4 py-3 rounded-xl border text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
                  style={{
                    background: "var(--color-surface-alt)",
                    borderColor: "var(--color-border)",
                    color: "var(--color-heading)",
                  }}
                />
              )}
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[var(--color-muted)] mb-2">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full px-3.5 py-3 rounded-xl border text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
                style={{
                  background: "var(--color-surface-alt)",
                  borderColor: "var(--color-border)",
                  color: "var(--color-heading)",
                }}
              >
                <option value="Low">Low – General Inquiry</option>
                <option value="Medium">Medium – Standard Support</option>
                <option value="High">High – Urgent Delivery/Defect</option>
                <option value="Urgent">Urgent – Immediate Intervention</option>
              </select>
            </div>
          </div>

          {/* 4. Message Content */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--color-muted)] mb-2">
              Message Details <span className="text-rose-500">*</span>
            </label>
            <textarea
              id="ticket-message-input"
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Please provide full details about your request so our team can resolve it on first contact..."
              className="w-full p-4 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] resize-y"
              style={{
                background: "var(--color-surface-alt)",
                borderColor: "var(--color-border)",
                color: "var(--color-heading)",
              }}
            />
          </div>

          {/* 5. Image Attachments */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--color-muted)] mb-2">
              Attach Images ({attachments.length}/5)
            </label>

            {attachments.length > 0 && (
              <div className="flex flex-wrap gap-2.5 mb-3">
                {attachments.map((att, idx) => (
                  <div
                    key={idx}
                    className="relative group rounded-xl overflow-hidden border border-[var(--color-border)] aspect-video w-24 bg-[var(--color-surface-alt)]"
                  >
                    <img
                      src={att.url}
                      alt={`Upload ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removeAttachment(idx)}
                      className="absolute top-1 right-1 p-1 rounded-full bg-black/70 text-white hover:bg-rose-600 transition"
                    >
                      <FiX size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center gap-2">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/jpeg,image/png,image/webp,image/jpg"
                multiple
                className="hidden"
                id="create-ticket-image-input"
                disabled={uploading || submitting || attachments.length >= 5}
              />
              <label
                htmlFor="create-ticket-image-input"
                className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold cursor-pointer border transition ${
                  attachments.length >= 5 || uploading
                    ? "opacity-50 cursor-not-allowed bg-[var(--color-surface-alt)] text-[var(--color-muted)] border-[var(--color-border)]"
                    : "bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-heading)] hover:bg-[var(--color-surface-alt)]"
                }`}
              >
                {uploading ? (
                  <>
                    <FiLoader className="animate-spin text-[var(--color-accent)]" size={14} />
                    <span>Uploading images...</span>
                  </>
                ) : (
                  <>
                    <FiImage size={15} className="text-[var(--color-accent)]" />
                    <span>+ Add Photos (Receipts, Damage, Slips)</span>
                  </>
                )}
              </label>
              <span className="text-[11px] text-[var(--color-muted)]">
                Up to 5 images • Max 5MB each
              </span>
            </div>
          </div>
        </form>

        {/* Modal Footer */}
        <div className="pt-4 border-t border-[var(--color-border)] flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold border border-[var(--color-border)] hover:bg-[var(--color-surface-alt)] transition text-[var(--color-muted)] hover:text-[var(--color-heading)]"
          >
            Cancel
          </button>

          <button
            id="ticket-submit-btn"
            type="button"
            onClick={handleSubmit}
            disabled={submitting || uploading || !subject.trim() || !message.trim()}
            className="px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white transition flex items-center gap-2 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-95"
            style={{ background: "var(--color-accent)" }}
          >
            {submitting ? (
              <>
                <FiLoader className="animate-spin" size={15} />
                <span>Creating Ticket...</span>
              </>
            ) : (
              <>
                <FiSend size={15} />
                <span>Submit Ticket</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
