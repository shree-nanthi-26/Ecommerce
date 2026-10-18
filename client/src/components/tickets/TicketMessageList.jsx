import { useState } from "react";
import { FiUser, FiShield, FiPaperclip, FiX, FiExternalLink } from "react-icons/fi";

function formatTimestamp(dateString) {
  if (!dateString) return "";
  const d = new Date(dateString);
  return d.toLocaleString("en-IN", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function TicketMessageList({ messages = [], currentUserId }) {
  const [activeImage, setActiveImage] = useState(null);

  if (!messages || messages.length === 0) {
    return (
      <div className="py-12 text-center text-sm text-[var(--color-muted)]">
        No messages in this conversation yet.
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {messages.map((msg, index) => {
          const isAdmin = msg.senderRole === "admin";
          const isCurrentUser =
            currentUserId &&
            (msg.sender?._id === currentUserId ||
              msg.sender === currentUserId ||
              msg.sender?.id === currentUserId);

          return (
            <div
              key={msg._id || index}
              className={`flex flex-col rounded-2xl p-5 border transition shadow-sm ${
                isAdmin
                  ? "bg-[var(--color-surface)] border-amber-500/30 dark:border-amber-500/20 shadow-amber-500/[0.03]"
                  : "bg-[var(--color-surface-alt)]/60 border-[var(--color-border)]"
              }`}
            >
              {/* Header */}
              <div className="flex items-center justify-between gap-3 mb-3 pb-2.5 border-b border-[var(--color-border)]/60 flex-wrap">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs uppercase shadow-sm ${
                      isAdmin
                        ? "bg-[var(--color-accent)] text-white"
                        : "bg-[var(--color-surface-alt)] text-[var(--color-heading)] border border-[var(--color-border)]"
                    }`}
                  >
                    {isAdmin ? <FiShield size={16} /> : <FiUser size={16} />}
                  </div>

                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-serif font-bold text-sm text-[var(--color-heading)]">
                        {msg.senderName || (isAdmin ? "Support Specialist" : "Customer")}
                      </span>
                      {isAdmin ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide bg-amber-500/15 text-amber-900 dark:text-amber-300 border border-amber-500/25">
                          Furniva Support Staff
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[var(--color-surface-alt)] text-[var(--color-muted)] border border-[var(--color-border)]">
                          Customer
                        </span>
                      )}
                      {isCurrentUser && (
                        <span className="text-[11px] font-medium text-[var(--color-muted)]">
                          (You)
                        </span>
                      )}
                    </div>
                    {msg.senderEmail && (
                      <p className="text-[11px] text-[var(--color-muted)]">
                        {msg.senderEmail}
                      </p>
                    )}
                  </div>
                </div>

                <time
                  dateTime={msg.createdAt}
                  className="text-xs text-[var(--color-muted)]"
                >
                  {formatTimestamp(msg.createdAt)}
                </time>
              </div>

              {/* Message Body */}
              <div className="text-sm leading-relaxed text-[var(--color-heading)] whitespace-pre-wrap break-words">
                {msg.message}
              </div>

              {/* Attachments */}
              {msg.attachments && msg.attachments.length > 0 && (
                <div className="mt-4 pt-3 border-t border-[var(--color-border)]/60">
                  <p className="text-xs font-bold uppercase tracking-wider text-[var(--color-muted)] mb-2 flex items-center gap-1.5">
                    <FiPaperclip size={13} />
                    <span>Attachments ({msg.attachments.length})</span>
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {msg.attachments.map((att, attIdx) => {
                      const url = att.url || (typeof att === "string" ? att : "");
                      if (!url) return null;

                      return (
                        <div
                          key={attIdx}
                          className="group relative rounded-xl overflow-hidden border border-[var(--color-border)] bg-[var(--color-surface)] aspect-video cursor-pointer"
                          onClick={() => setActiveImage(url)}
                        >
                          <img
                            src={url}
                            alt={att.name || `Attachment ${attIdx + 1}`}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-semibold gap-1">
                            <FiExternalLink size={14} /> View
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Image Lightbox Modal */}
      {activeImage && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn"
          onClick={() => setActiveImage(null)}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] overflow-hidden rounded-2xl bg-neutral-900 border border-neutral-700 p-2 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setActiveImage(null)}
              className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/60 text-white hover:bg-black/90 transition"
              aria-label="Close image preview"
            >
              <FiX size={20} />
            </button>
            <img
              src={activeImage}
              alt="Attachment Full View"
              className="max-h-[85vh] w-auto max-w-full rounded-xl object-contain mx-auto"
            />
          </div>
        </div>
      )}
    </>
  );
}
