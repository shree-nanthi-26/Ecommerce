import { useState, useRef } from "react";
import {
  FiSend,
  FiImage,
  FiX,
  FiLoader,
  FiAlertCircle,
} from "react-icons/fi";
import { uploadMultipleImages } from "../../services/uploadService";

export default function TicketReplyBox({
  ticketStatus,
  isAdmin = false,
  onReplySubmitted,
}) {
  const [message, setMessage] = useState("");
  const [attachments, setAttachments] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [newStatus, setNewStatus] = useState(
    isAdmin ? "Waiting for Customer" : ""
  );

  const fileInputRef = useRef(null);
  const isClosed = ticketStatus === "Closed";

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    if (attachments.length + files.length > 5) {
      alert("You can attach a maximum of 5 images per message.");
      return;
    }

    try {
      setUploading(true);
      setError(null);
      const uploaded = await uploadMultipleImages(files);
      setAttachments((prev) => [...prev, ...uploaded]);
    } catch (uploadErr) {
      console.error("Image upload failed:", uploadErr);
      setError("Failed to upload image. Please try again with JPEG/PNG files under 5MB.");
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
    if (!message.trim() && attachments.length === 0) {
      setError("Please write a message or attach an image.");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const payload = {
        message: message.trim(),
        attachments: attachments.map((att) => ({
          url: att.url,
          publicId: att.publicId,
        })),
        ...(isAdmin && newStatus ? { newStatus } : {}),
      };

      if (onReplySubmitted) {
        await onReplySubmitted(payload);
      }

      setMessage("");
      setAttachments([]);
    } catch (submitErr) {
      console.error("Error submitting reply:", submitErr);
      setError(
        submitErr.response?.data?.message || "Failed to post message. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="rounded-2xl border p-5 transition shadow-sm"
      style={{
        background: "var(--color-surface)",
        borderColor: "var(--color-border)",
      }}
    >
      {isClosed && (
        <div className="mb-4 flex items-center gap-2 p-3 rounded-xl bg-neutral-500/10 border border-neutral-500/20 text-xs sm:text-sm text-[var(--color-muted)]">
          <FiAlertCircle className="shrink-0 text-amber-600" size={16} />
          <span>
            This ticket is currently marked as <strong>Closed</strong>. Sending a new message
            will automatically reopen the inquiry.
          </span>
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs sm:text-sm text-rose-700 dark:text-rose-300 flex items-center justify-between">
          <span>{error}</span>
          <button
            type="button"
            onClick={() => setError(null)}
            className="text-rose-700 dark:text-rose-300 hover:opacity-75"
          >
            <FiX size={16} />
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Message Input Area */}
        <div>
          <label
            htmlFor="ticket-reply-textarea"
            className="block text-xs font-bold uppercase tracking-wider text-[var(--color-muted)] mb-2"
          >
            {isAdmin ? "Post Support Response" : "Write Your Reply"}
          </label>
          <textarea
            id="ticket-reply-textarea"
            rows={4}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={
              isAdmin
                ? "Type response for customer... Be clear, courteous, and specify next steps or order updates."
                : "Describe your issue, answer questions from our support agent, or provide additional information..."
            }
            className="w-full rounded-xl p-3.5 text-sm border focus:outline-none focus:ring-2 resize-y"
            style={{
              background: "var(--color-surface-alt)",
              borderColor: "var(--color-border)",
              color: "var(--color-heading)",
            }}
          />
        </div>

        {/* Attachment Previews */}
        {attachments.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-[var(--color-muted)]">
              Attached Images ({attachments.length}/5):
            </p>
            <div className="flex flex-wrap gap-2.5">
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
                    title="Remove attachment"
                  >
                    <FiX size={12} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer Bar: Attachments, Admin Status Dropdown, Submit */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
          {/* File Upload Button */}
          <div className="flex items-center gap-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/jpeg,image/png,image/webp,image/jpg"
              multiple
              className="hidden"
              id="ticket-image-input"
              disabled={uploading || submitting || attachments.length >= 5}
            />
            <label
              htmlFor="ticket-image-input"
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer border transition ${
                attachments.length >= 5 || uploading
                  ? "opacity-50 cursor-not-allowed bg-[var(--color-surface-alt)] text-[var(--color-muted)] border-[var(--color-border)]"
                  : "bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-heading)] hover:bg-[var(--color-surface-alt)]"
              }`}
            >
              {uploading ? (
                <>
                  <FiLoader className="animate-spin text-[var(--color-accent)]" size={14} />
                  <span>Uploading...</span>
                </>
              ) : (
                <>
                  <FiImage size={14} className="text-[var(--color-accent)]" />
                  <span>Attach Images ({attachments.length}/5)</span>
                </>
              )}
            </label>
            <span className="text-[11px] text-[var(--color-muted)] hidden md:inline">
              JPG, PNG up to 5MB
            </span>
          </div>

          <div className="flex items-center gap-2.5 justify-end">
            {/* Admin status update alongside reply */}
            {isAdmin && (
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-[var(--color-muted)] hidden sm:inline">
                  Next Status:
                </span>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="px-2.5 py-2 rounded-xl text-xs font-semibold border bg-[var(--color-surface-alt)] text-[var(--color-heading)] border-[var(--color-border)] focus:outline-none"
                >
                  <option value="Waiting for Customer">Waiting for Customer</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Resolved">Resolved</option>
                  <option value="Closed">Closed</option>
                  <option value="Open">Keep Open</option>
                </select>
              </div>
            )}

            {/* Submit Button */}
            <button
              id="ticket-reply-submit-btn"
              type="submit"
              disabled={submitting || uploading || (!message.trim() && attachments.length === 0)}
              className="px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm text-white flex items-center justify-center gap-2 transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-95"
              style={{ background: "var(--color-accent)" }}
            >
              {submitting ? (
                <>
                  <FiLoader className="animate-spin" size={15} />
                  <span>Sending...</span>
                </>
              ) : (
                <>
                  <FiSend size={14} />
                  <span>{isClosed ? "Reopen & Send" : "Send Reply"}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
