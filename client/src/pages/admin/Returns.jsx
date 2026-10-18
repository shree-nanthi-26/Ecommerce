import { useEffect, useState } from "react";
import {
  FiRefreshCw,
  FiEye,
  FiCheck,
  FiX,
  FiClock,
  FiTruck,
  FiDollarSign,
  FiImage,
  FiSearch,
  FiAlertCircle,
  FiPackage,
  FiUser,
  FiMapPin,
  FiCalendar,
  FiCheckCircle,
} from "react-icons/fi";
import {
  getAllReturnsAdmin,
  updateReturnStatusAdmin,
} from "../../services/returnService";

const RETURN_STATUSES = [
  "All",
  "Requested",
  "Under Review",
  "Approved",
  "Rejected",
  "Pickup Scheduled",
  "Returned",
  "Refund Initiated",
  "Completed",
];

const STATUS_BADGES = {
  Requested: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  "Under Review": "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
  Approved: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  Rejected: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
  "Pickup Scheduled": "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
  Returned: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20",
  "Refund Initiated": "bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20",
  Completed: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
};

function AdminReturns() {
  const [returns, setReturns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedReturn, setSelectedReturn] = useState(null);
  const [enlargedImage, setEnlargedImage] = useState(null);
  const [modalSuccess, setModalSuccess] = useState("");
  const [modalError, setModalError] = useState("");

  // Form states inside modal
  const [editStatus, setEditStatus] = useState("");
  const [adminNotes, setAdminNotes] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [pickupDate, setPickupDate] = useState("");
  const [refundAmount, setRefundAmount] = useState(0);
  const [refundStatus, setRefundStatus] = useState("Pending");
  const [comment, setComment] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  const fetchReturns = async () => {
    try {
      setLoading(true);
      const params = {};
      if (selectedStatus !== "All") {
        params.status = selectedStatus;
      }
      const res = await getAllReturnsAdmin(params);
      setReturns(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReturns();
  }, [selectedStatus]);

  useEffect(() => {
    if (selectedReturn) {
      setEditStatus(selectedReturn.status || "Requested");
      setAdminNotes(selectedReturn.adminNotes || "");
      setRejectionReason(selectedReturn.rejectionReason || "");
      setPickupDate(
        selectedReturn.pickupDate
          ? new Date(selectedReturn.pickupDate).toISOString().split("T")[0]
          : ""
      );
      setRefundAmount(selectedReturn.refundAmount || 0);
      setRefundStatus(selectedReturn.refundStatus || "Pending");
      setComment("");
      setModalSuccess("");
      setModalError("");
    }
  }, [selectedReturn]);

  const handleUpdateStatus = async (statusOverride, customComment) => {
    if (!selectedReturn) return;
    setModalSuccess("");
    setModalError("");

    const targetStatus = statusOverride || editStatus;

    if (targetStatus === "Rejected" && !rejectionReason.trim() && !customComment) {
      setModalError("Please provide a rejection reason when rejecting a return request.");
      return;
    }

    try {
      setIsUpdating(true);
      const payload = {
        status: targetStatus,
        adminNotes: adminNotes.trim(),
        rejectionReason: rejectionReason.trim(),
        pickupDate: pickupDate ? new Date(pickupDate) : null,
        refundAmount: Number(refundAmount),
        refundStatus,
        comment: customComment || comment.trim() || undefined,
      };

      const res = await updateReturnStatusAdmin(selectedReturn._id, payload);
      setModalSuccess("Return request updated successfully!");

      setReturns((prev) =>
        prev.map((r) => (r._id === selectedReturn._id ? res.data : r))
      );
      setSelectedReturn(res.data);
    } catch (err) {
      setModalError(err.response?.data?.message || "Failed to update return.");
    } finally {
      setIsUpdating(false);
    }
  };

  const filteredReturns = returns.filter((ret) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    const retId = (ret._id || "").toLowerCase();
    const orderId = (ret.order?._id || ret.order || "").toLowerCase();
    const userName = (ret.user?.name || "").toLowerCase();
    const userEmail = (ret.user?.email || "").toLowerCase();
    const reason = (ret.reason || "").toLowerCase();
    return (
      retId.includes(term) ||
      orderId.includes(term) ||
      userName.includes(term) ||
      userEmail.includes(term) ||
      reason.includes(term)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[var(--color-heading)]">
            Returns & Refunds Management
          </h1>
          <p className="text-xs sm:text-sm text-[var(--color-muted)] mt-1">
            Review customer return requests, inspect evidence photos, approve reverse pickups, and manage refunds.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchReturns}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border text-xs font-bold transition hover:bg-[var(--color-surface-alt)] self-start sm:self-auto"
          style={{ borderColor: "var(--color-border)", color: "var(--color-heading)" }}
        >
          <FiRefreshCw size={14} className={loading ? "animate-spin" : ""} /> Refresh
        </button>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {RETURN_STATUSES.map((st) => (
            <button
              key={st}
              onClick={() => setSelectedStatus(st)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                selectedStatus === st
                  ? "bg-[var(--color-accent)] text-white shadow-sm"
                  : "border text-[var(--color-muted)] hover:text-white"
              }`}
              style={{
                borderColor: selectedStatus === st ? "transparent" : "var(--color-border)",
                background: selectedStatus === st ? "var(--color-accent)" : "var(--color-surface)",
              }}
            >
              {st}
            </button>
          ))}
        </div>

        <div className="relative">
          <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-muted)]" size={16} />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search returns by Return ID, Order ID, customer name, email, or reason..."
            className="w-full pl-11 pr-4 py-3 rounded-2xl border text-xs focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
            style={{
              background: "var(--color-surface)",
              borderColor: "var(--color-border)",
              color: "var(--color-heading)",
            }}
          />
        </div>
      </div>

      {/* Returns Table */}
      <div
        className="rounded-3xl border overflow-hidden shadow-sm"
        style={{
          background: "var(--color-surface)",
          borderColor: "var(--color-border)",
        }}
      >
        {loading ? (
          <div className="p-12 text-center text-xs text-[var(--color-muted)] animate-pulse">
            Loading return requests...
          </div>
        ) : filteredReturns.length === 0 ? (
          <div className="p-12 text-center">
            <FiRefreshCw size={32} className="mx-auto text-[var(--color-muted)] mb-3 opacity-50" />
            <p className="text-base font-serif font-bold text-[var(--color-heading)]">
              No return requests found
            </p>
            <p className="text-xs text-[var(--color-muted)] mt-1">
              {selectedStatus === "All"
                ? "No customer has submitted a return request yet."
                : `No return requests currently marked as "${selectedStatus}".`}
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
                  <th className="py-3.5 px-4">Return ID / Date</th>
                  <th className="py-3.5 px-4">Customer</th>
                  <th className="py-3.5 px-4">Order ID & Total</th>
                  <th className="py-3.5 px-4">Reason & Description</th>
                  <th className="py-3.5 px-4">Evidence</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: "var(--color-border)" }}>
                {filteredReturns.map((ret) => (
                  <tr
                    key={ret._id}
                    className="hover:bg-[var(--color-surface-alt)]/50 transition cursor-pointer"
                    onClick={() => setSelectedReturn(ret)}
                  >
                    <td className="py-3.5 px-4">
                      <p className="font-mono font-bold text-[var(--color-heading)]">
                        #{ret._id.slice(-8).toUpperCase()}
                      </p>
                      <p className="text-[11px] text-[var(--color-muted)] mt-0.5">
                        {new Date(ret.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                        })}
                      </p>
                    </td>

                    <td className="py-3.5 px-4">
                      <p className="font-semibold text-[var(--color-heading)]">{ret.user?.name || "Customer"}</p>
                      <p className="text-[11px] text-[var(--color-muted)]">{ret.user?.email}</p>
                    </td>

                    <td className="py-3.5 px-4">
                      <p className="font-mono font-bold text-[var(--color-accent)]">
                        #{ret.order?._id?.slice(-8).toUpperCase() || ret.order?.slice(-8).toUpperCase()}
                      </p>
                      <p className="font-bold text-[var(--color-heading)] mt-0.5">
                        ₹{ret.order?.totalAmount?.toLocaleString("en-IN") || ret.refundAmount?.toLocaleString("en-IN")}
                      </p>
                    </td>

                    <td className="py-3.5 px-4 max-w-xs">
                      <p className="font-bold text-[var(--color-heading)]">{ret.reason}</p>
                      <p className="text-[11px] text-[var(--color-muted)] truncate mt-0.5">
                        {ret.description}
                      </p>
                    </td>

                    <td className="py-3.5 px-4" onClick={(e) => e.stopPropagation()}>
                      {ret.images && ret.images.length > 0 ? (
                        <div className="flex items-center gap-1.5">
                          {ret.images.slice(0, 3).map((img, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => setEnlargedImage(img.url)}
                              className="h-8 w-8 rounded-lg overflow-hidden border shrink-0 hover:scale-110 transition"
                              style={{ borderColor: "var(--color-border)" }}
                            >
                              <img src={img.url} alt="Evidence" className="h-full w-full object-cover" />
                            </button>
                          ))}
                          {ret.images.length > 3 && (
                            <span className="text-[10px] font-bold text-[var(--color-muted)]">
                              +{ret.images.length - 3}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-[11px] text-[var(--color-muted)] italic">No photos</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold border ${
                          STATUS_BADGES[ret.status] || "bg-gray-500/10"
                        }`}
                      >
                        {ret.status}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedReturn(ret);
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition hover:bg-[var(--color-surface-alt)]"
                        style={{
                          borderColor: "var(--color-border)",
                          color: "var(--color-accent)",
                        }}
                      >
                        <FiEye size={13} /> Manage
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail & Action Modal */}
      {selectedReturn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto animate-fadeIn">
          <div
            className="w-full max-w-4xl my-8 rounded-3xl p-6 sm:p-8 border shadow-2xl relative"
            style={{
              background: "var(--color-surface)",
              borderColor: "var(--color-border)",
              color: "var(--color-heading)",
            }}
          >
            {/* Close Button */}
            <button
              onClick={() => setSelectedReturn(null)}
              className="absolute top-6 right-6 p-2 rounded-full hover:bg-[var(--color-surface-alt)] transition"
              style={{ color: "var(--color-muted)" }}
            >
              <FiX size={20} />
            </button>

            {/* Modal Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pr-10 border-b pb-5" style={{ borderColor: "var(--color-border)" }}>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                      STATUS_BADGES[selectedReturn.status] || "bg-gray-500/10"
                    }`}
                  >
                    {selectedReturn.status}
                  </span>
                  <span className="text-xs text-[var(--color-muted)] font-mono">
                    Return #{selectedReturn._id?.slice(-8).toUpperCase()}
                  </span>
                </div>
                <h2 className="text-xl font-serif font-bold">
                  Return Request for Order #{selectedReturn.order?._id?.slice(-8).toUpperCase()}
                </h2>
              </div>

              {/* Fast Approve / Reject Quick Actions */}
              <div className="flex items-center gap-2">
                {selectedReturn.status !== "Approved" && (
                  <button
                    type="button"
                    disabled={isUpdating}
                    onClick={() => handleUpdateStatus("Approved", "Return request approved by admin")}
                    className="px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition flex items-center gap-1.5"
                  >
                    <FiCheck size={14} /> Quick Approve
                  </button>
                )}

                {selectedReturn.status !== "Rejected" && (
                  <button
                    type="button"
                    disabled={isUpdating}
                    onClick={() => {
                      const reason = window.prompt("Enter rejection reason for customer:");
                      if (reason) {
                        setRejectionReason(reason);
                        handleUpdateStatus("Rejected", `Return rejected: ${reason}`);
                      }
                    }}
                    className="px-3.5 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-sm transition flex items-center gap-1.5"
                  >
                    <FiX size={14} /> Reject Request
                  </button>
                )}
              </div>
            </div>

            {modalSuccess && (
              <div
                className="mt-4 p-3.5 rounded-2xl border text-xs flex items-center gap-2.5"
                style={{
                  background: "rgba(16, 185, 129, 0.1)",
                  borderColor: "rgba(16, 185, 129, 0.3)",
                  color: "#10B981",
                }}
              >
                <FiCheckCircle size={16} className="shrink-0" />
                <span className="font-semibold">{modalSuccess}</span>
              </div>
            )}

            {modalError && (
              <div
                className="mt-4 p-3.5 rounded-2xl border text-xs flex items-center gap-2.5"
                style={{
                  background: "rgba(239, 68, 68, 0.1)",
                  borderColor: "rgba(239, 68, 68, 0.3)",
                  color: "#EF4444",
                }}
              >
                <FiAlertCircle size={16} className="shrink-0" />
                <span className="font-semibold">{modalError}</span>
              </div>
            )}

            <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column: Customer Evidence & Order Details */}
              <div className="space-y-5">
                {/* Customer Information */}
                <div
                  className="p-4 rounded-2xl border space-y-2 text-xs"
                  style={{
                    background: "var(--color-surface-alt)",
                    borderColor: "var(--color-border)",
                  }}
                >
                  <p className="font-bold uppercase tracking-wider text-[var(--color-accent)] flex items-center gap-1.5">
                    <FiUser size={13} /> Customer Details
                  </p>
                  <p className="font-semibold text-sm text-[var(--color-heading)]">
                    {selectedReturn.user?.name}
                  </p>
                  <p className="text-[var(--color-muted)]">{selectedReturn.user?.email}</p>
                </div>

                {/* Reason & Customer Statement */}
                <div
                  className="p-4 rounded-2xl border space-y-2 text-xs"
                  style={{
                    background: "var(--color-surface-alt)",
                    borderColor: "var(--color-border)",
                  }}
                >
                  <p className="font-bold uppercase tracking-wider text-[var(--color-accent)] flex items-center gap-1.5">
                    <FiAlertCircle size={13} /> Return Statement
                  </p>
                  <p className="font-bold text-sm text-[var(--color-heading)]">
                    Reason: {selectedReturn.reason}
                  </p>
                  <p className="text-[var(--color-muted)] leading-relaxed whitespace-pre-wrap">
                    {selectedReturn.description}
                  </p>
                </div>

                {/* Uploaded Cloudinary Evidence Photos */}
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider mb-2 text-[var(--color-muted)] flex items-center gap-1.5">
                    <FiImage size={13} /> Uploaded Evidence ({selectedReturn.images?.length || 0})
                  </p>

                  {selectedReturn.images && selectedReturn.images.length > 0 ? (
                    <div className="grid grid-cols-3 gap-3">
                      {selectedReturn.images.map((img, idx) => (
                        <div
                          key={idx}
                          onClick={() => setEnlargedImage(img.url)}
                          className="relative aspect-square rounded-2xl overflow-hidden border cursor-pointer hover:opacity-90 transition group shadow-sm"
                          style={{ borderColor: "var(--color-border)" }}
                        >
                          <img src={img.url} alt={`Evidence ${idx + 1}`} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                            <FiEye size={20} className="text-white" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs italic text-[var(--color-muted)]">No photos attached</p>
                  )}
                </div>

                {/* Return Items */}
                <div
                  className="p-4 rounded-2xl border space-y-2 text-xs"
                  style={{
                    background: "var(--color-surface-alt)",
                    borderColor: "var(--color-border)",
                  }}
                >
                  <p className="font-bold uppercase tracking-wider text-[var(--color-accent)] flex items-center gap-1.5">
                    <FiPackage size={13} /> Order Items
                  </p>
                  <div className="divide-y" style={{ borderColor: "var(--color-border)" }}>
                    {selectedReturn.items?.map((item, idx) => (
                      <div key={idx} className="py-2 flex justify-between items-center text-xs first:pt-0 last:pb-0">
                        <span className="font-medium text-[var(--color-heading)]">{item.name} × {item.quantity}</span>
                        <span className="font-bold">₹{(item.price * item.quantity).toLocaleString("en-IN")}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Column: Admin Management & Status Workflow */}
              <div className="space-y-5">
                <div
                  className="p-5 rounded-2xl border space-y-4 text-xs"
                  style={{
                    background: "var(--color-surface)",
                    borderColor: "var(--color-border)",
                  }}
                >
                  <h3 className="font-bold uppercase tracking-wider text-[var(--color-accent)]">
                    Update Return Status & Lifecycle
                  </h3>

                  {/* Status Dropdown */}
                  <div>
                    <label className="block font-bold mb-1.5">Return Status</label>
                    <select
                      value={editStatus}
                      onChange={(e) => setEditStatus(e.target.value)}
                      className="w-full p-2.5 rounded-xl border text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
                      style={{
                        background: "var(--color-surface-alt)",
                        borderColor: "var(--color-border)",
                        color: "var(--color-heading)",
                      }}
                    >
                      {RETURN_STATUSES.filter((s) => s !== "All").map((st) => (
                        <option key={st} value={st}>
                          {st}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Pickup Date (if Pickup Scheduled or approved) */}
                  <div>
                    <label className="block font-bold mb-1.5">Scheduled Reverse Pickup Date</label>
                    <input
                      type="date"
                      value={pickupDate}
                      onChange={(e) => setPickupDate(e.target.value)}
                      className="w-full p-2.5 rounded-xl border text-xs focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
                      style={{
                        background: "var(--color-surface-alt)",
                        borderColor: "var(--color-border)",
                        color: "var(--color-heading)",
                      }}
                    />
                  </div>

                  {/* Refund Amount & Status */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold mb-1.5">Refund Value (₹)</label>
                      <input
                        type="number"
                        value={refundAmount}
                        onChange={(e) => setRefundAmount(e.target.value)}
                        className="w-full p-2.5 rounded-xl border text-xs focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
                        style={{
                          background: "var(--color-surface-alt)",
                          borderColor: "var(--color-border)",
                          color: "var(--color-heading)",
                        }}
                      />
                    </div>
                    <div>
                      <label className="block font-bold mb-1.5">Refund Status</label>
                      <select
                        value={refundStatus}
                        onChange={(e) => setRefundStatus(e.target.value)}
                        className="w-full p-2.5 rounded-xl border text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
                        style={{
                          background: "var(--color-surface-alt)",
                          borderColor: "var(--color-border)",
                          color: "var(--color-heading)",
                        }}
                      >
                        <option value="Pending">Pending</option>
                        <option value="Processed">Processed</option>
                        <option value="Failed">Failed</option>
                        <option value="Not Applicable">Not Applicable</option>
                      </select>
                    </div>
                  </div>

                  {/* Admin Notes (Visible to Customer) */}
                  <div>
                    <label className="block font-bold mb-1.5">Admin Notes (Visible to Customer)</label>
                    <textarea
                      rows={2}
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      placeholder="e.g. Courier executive assigned. Pickup scheduled between 2-5 PM."
                      className="w-full p-2.5 rounded-xl border text-xs focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] resize-none"
                      style={{
                        background: "var(--color-surface-alt)",
                        borderColor: "var(--color-border)",
                        color: "var(--color-heading)",
                      }}
                    />
                  </div>

                  {/* Rejection Reason (if rejected) */}
                  {editStatus === "Rejected" && (
                    <div>
                      <label className="block font-bold mb-1.5 text-rose-500">Rejection Reason</label>
                      <textarea
                        rows={2}
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        placeholder="Explain reason for rejecting the return request..."
                        className="w-full p-2.5 rounded-xl border text-xs focus:outline-none focus:ring-2 focus:ring-rose-500 resize-none"
                        style={{
                          background: "rgba(239, 68, 68, 0.05)",
                          borderColor: "rgba(239, 68, 68, 0.3)",
                          color: "var(--color-heading)",
                        }}
                      />
                    </div>
                  )}

                  {/* Internal Comment */}
                  <div>
                    <label className="block font-bold mb-1.5 text-[var(--color-muted)]">
                      Internal Audit Comment
                    </label>
                    <input
                      type="text"
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="Optional internal note for audit logs..."
                      className="w-full p-2.5 rounded-xl border text-xs focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
                      style={{
                        background: "var(--color-surface-alt)",
                        borderColor: "var(--color-border)",
                        color: "var(--color-heading)",
                      }}
                    />
                  </div>

                  {/* Save Button */}
                  <button
                    type="button"
                    disabled={isUpdating}
                    onClick={() => handleUpdateStatus()}
                    className="w-full py-2.5 rounded-xl font-bold text-xs text-white shadow-md transition disabled:opacity-50"
                    style={{ background: "var(--color-accent)" }}
                  >
                    {isUpdating ? "Saving Changes..." : "Save Return Details"}
                  </button>
                </div>

                {/* Status History Logs */}
                {selectedReturn.statusHistory && selectedReturn.statusHistory.length > 0 && (
                  <div
                    className="p-4 rounded-2xl border text-xs space-y-2"
                    style={{
                      background: "var(--color-surface-alt)",
                      borderColor: "var(--color-border)",
                    }}
                  >
                    <p className="font-bold uppercase tracking-wider text-[var(--color-muted)] flex items-center gap-1.5">
                      <FiClock size={13} /> Status Audit History
                    </p>
                    <div className="divide-y space-y-2 max-h-40 overflow-y-auto pr-1" style={{ borderColor: "var(--color-border)" }}>
                      {selectedReturn.statusHistory.map((h, idx) => (
                        <div key={idx} className="pt-2 first:pt-0">
                          <div className="flex justify-between items-center text-[11px]">
                            <span className="font-bold text-[var(--color-heading)]">{h.status}</span>
                            <span className="text-[var(--color-muted)]">
                              {new Date(h.timestamp).toLocaleDateString("en-IN", {
                                day: "numeric",
                                month: "short",
                              })}{" "}
                              {new Date(h.timestamp).toLocaleTimeString("en-IN", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>
                          {h.comment && <p className="text-[11px] text-[var(--color-muted)] mt-0.5">{h.comment}</p>}
                          {h.updatedBy && <p className="text-[10px] text-[var(--color-accent)]">By {h.updatedBy}</p>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox for Image Zoom */}
      {enlargedImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm cursor-pointer"
          onClick={() => setEnlargedImage(null)}
        >
          <div className="max-w-3xl max-h-[90vh] rounded-3xl overflow-hidden border shadow-2xl relative">
            <img src={enlargedImage} alt="Enlarged evidence" className="w-full h-full object-contain" />
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminReturns;
