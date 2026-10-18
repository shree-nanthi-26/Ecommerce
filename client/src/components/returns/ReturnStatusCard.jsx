import { useState } from "react";
import {
  FiCheckCircle,
  FiClock,
  FiAlertCircle,
  FiTruck,
  FiRefreshCw,
  FiDollarSign,
  FiXCircle,
  FiCheck,
  FiImage,
} from "react-icons/fi";

const RETURN_STAGES = [
  { key: "Requested", label: "Requested", icon: FiClock },
  { key: "Under Review", label: "Under Review", icon: FiRefreshCw },
  { key: "Approved", label: "Approved", icon: FiCheckCircle },
  { key: "Pickup Scheduled", label: "Pickup Scheduled", icon: FiTruck },
  { key: "Returned", label: "Returned", icon: FiCheckCircle },
  { key: "Refund Initiated", label: "Refund Initiated", icon: FiDollarSign },
  { key: "Completed", label: "Completed", icon: FiCheck },
];

const STATUS_BADGE_STYLES = {
  Requested: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  "Under Review": "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
  Approved: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  Rejected: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
  "Pickup Scheduled": "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
  Returned: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20",
  "Refund Initiated": "bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20",
  Completed: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
};

function ReturnStatusCard({ returnData }) {
  const [selectedImage, setSelectedImage] = useState(null);

  if (!returnData) return null;

  const isRejected = returnData.status === "Rejected";
  const stageKeys = RETURN_STAGES.map((s) => s.key);
  const currentStageIndex = stageKeys.indexOf(returnData.status);

  return (
    <div
      className="rounded-3xl p-6 sm:p-8 border shadow-sm space-y-6"
      style={{
        background: "var(--color-surface)",
        borderColor: "var(--color-border)",
      }}
    >
      {/* Top Banner & Status */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
                STATUS_BADGE_STYLES[returnData.status] || "bg-gray-500/10"
              }`}
            >
              <span className="h-2 w-2 rounded-full bg-current animate-pulse" />
              Return {returnData.status}
            </span>
            <span className="text-xs text-[var(--color-muted)] font-mono">
              Req ID: #{returnData._id?.slice(-8).toUpperCase()}
            </span>
          </div>
          <h3 className="text-lg font-serif font-bold text-[var(--color-heading)]">
            Reason: {returnData.reason}
          </h3>
        </div>

        {returnData.refundAmount > 0 && (
          <div className="text-left sm:text-right">
            <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-muted)]">
              Refund Value
            </p>
            <p className="text-xl font-extrabold" style={{ color: "var(--color-accent)" }}>
              ₹{returnData.refundAmount?.toLocaleString("en-IN")}
            </p>
          </div>
        )}
      </div>

      {/* Description & Customer Notes */}
      <div
        className="p-4 rounded-2xl border text-xs space-y-1"
        style={{
          background: "var(--color-surface-alt)",
          borderColor: "var(--color-border)",
        }}
      >
        <p className="font-bold text-[var(--color-heading)]">Customer Description:</p>
        <p className="text-[var(--color-muted)] leading-relaxed">{returnData.description}</p>
      </div>

      {/* Uploaded Supporting Evidence Images */}
      {returnData.images && returnData.images.length > 0 && (
        <div>
          <p className="text-xs font-bold uppercase tracking-wider mb-2 text-[var(--color-muted)]">
            Uploaded Evidence Photos ({returnData.images.length})
          </p>
          <div className="flex items-center gap-3 overflow-x-auto pb-2">
            {returnData.images.map((img, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setSelectedImage(img.url)}
                className="relative h-20 w-20 shrink-0 rounded-2xl overflow-hidden border transition hover:opacity-80 group shadow-sm"
                style={{ borderColor: "var(--color-border)" }}
              >
                <img
                  src={img.url}
                  alt={`Evidence photo ${idx + 1}`}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Rejection Details if Rejected */}
      {isRejected && (
        <div
          className="p-4 rounded-2xl border flex items-start gap-3 text-xs"
          style={{
            background: "rgba(239, 68, 68, 0.08)",
            borderColor: "rgba(239, 68, 68, 0.25)",
            color: "var(--color-danger)",
          }}
        >
          <FiXCircle size={18} className="shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">Return Request Declined</p>
            <p className="mt-0.5 opacity-90">
              {returnData.rejectionReason ||
                "This request did not meet our standard return policy criteria."}
            </p>
          </div>
        </div>
      )}

      {/* Return Progress Stepper (if not rejected) */}
      {!isRejected && (
        <div className="space-y-4 pt-2">
          <p className="text-xs font-bold uppercase tracking-wider text-[var(--color-muted)]">
            Return Lifecycle Progress
          </p>

          <div className="relative py-2">
            {/* Desktop Stepper */}
            <div className="hidden md:grid grid-cols-7 gap-2 text-center">
              {RETURN_STAGES.map((stage, idx) => {
                const isCompleted = idx < currentStageIndex;
                const isCurrent = idx === currentStageIndex;
                const Icon = stage.icon;

                return (
                  <div key={stage.key} className="flex flex-col items-center">
                    <div
                      className={`h-10 w-10 rounded-2xl flex items-center justify-center font-bold text-xs transition shadow-sm ${
                        isCompleted
                          ? "bg-emerald-500 text-white"
                          : isCurrent
                          ? "bg-[var(--color-accent)] text-white ring-4 ring-[var(--color-accent)]/20 scale-105"
                          : "border text-[var(--color-muted)]"
                      }`}
                      style={{
                        background:
                          isCompleted
                            ? "#10B981"
                            : isCurrent
                            ? "var(--color-accent)"
                            : "var(--color-surface-alt)",
                        borderColor: !isCompleted && !isCurrent ? "var(--color-border)" : "transparent",
                      }}
                    >
                      {isCompleted ? <FiCheck size={16} /> : <Icon size={16} />}
                    </div>
                    <span
                      className={`mt-2 text-[11px] font-bold ${
                        isCurrent
                          ? "text-[var(--color-accent)]"
                          : isCompleted
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-[var(--color-muted)]"
                      }`}
                    >
                      {stage.label}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Mobile Vertical Stepper */}
            <div className="md:hidden space-y-3">
              {RETURN_STAGES.map((stage, idx) => {
                const isCompleted = idx < currentStageIndex;
                const isCurrent = idx === currentStageIndex;
                const Icon = stage.icon;

                return (
                  <div
                    key={stage.key}
                    className={`flex items-center gap-3 p-2.5 rounded-2xl border text-xs ${
                      isCurrent
                        ? "border-[var(--color-accent)] bg-[var(--color-accent-light)]/20 font-bold"
                        : "border-[var(--color-border)] opacity-70"
                    }`}
                  >
                    <div
                      className={`h-7 w-7 rounded-xl flex items-center justify-center ${
                        isCompleted
                          ? "bg-emerald-500 text-white"
                          : isCurrent
                          ? "bg-[var(--color-accent)] text-white"
                          : "bg-gray-200 dark:bg-gray-800 text-gray-400"
                      }`}
                    >
                      {isCompleted ? <FiCheck size={13} /> : <Icon size={13} />}
                    </div>
                    <span>{stage.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Admin Notes / Pickup Schedule Feedback */}
      {(returnData.adminNotes || returnData.pickupDate) && (
        <div
          className="p-4 rounded-2xl border text-xs space-y-2"
          style={{
            background: "var(--color-surface-alt)",
            borderColor: "var(--color-border)",
          }}
        >
          {returnData.pickupDate && (
            <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 font-bold">
              <FiTruck size={14} />
              <span>
                Scheduled Pickup:{" "}
                {new Date(returnData.pickupDate).toLocaleDateString("en-IN", {
                  weekday: "short",
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </span>
            </div>
          )}

          {returnData.adminNotes && (
            <div>
              <span className="font-bold text-[var(--color-heading)]">Furniva Support Update:</span>{" "}
              <span className="text-[var(--color-muted)]">{returnData.adminNotes}</span>
            </div>
          )}
        </div>
      )}

      {/* Image Lightbox Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onClick={() => setSelectedImage(null)}
        >
          <div className="max-w-2xl max-h-[85vh] rounded-3xl overflow-hidden border shadow-2xl relative">
            <img src={selectedImage} alt="Enlarged evidence" className="w-full h-full object-contain" />
          </div>
        </div>
      )}
    </div>
  );
}

export default ReturnStatusCard;
