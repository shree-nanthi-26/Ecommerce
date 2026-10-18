import { useState } from "react";
import { FiX, FiUploadCloud, FiImage, FiTrash2, FiAlertCircle } from "react-icons/fi";
import { createReturnRequest } from "../../services/returnService";
import { uploadMultipleImages } from "../../services/uploadService";
import { useNotification } from "../../context/NotificationContext";

const RETURN_REASONS = [
  "Damaged product",
  "Wrong product",
  "Product not as expected",
  "Changed mind",
  "Other",
];

function ReturnRequestModal({ order, isOpen, onClose, onSuccess }) {
  const { addNotification } = useNotification();
  const [reason, setReason] = useState(RETURN_REASONS[0]);
  const [description, setDescription] = useState("");
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen || !order) return null;

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    if (selectedFiles.length + files.length > 5) {
      setError("You can upload a maximum of 5 supporting images.");
      return;
    }

    setError("");
    const newFiles = [...selectedFiles, ...files];
    setSelectedFiles(newFiles);

    const newPreviews = files.map((file) => URL.createObjectURL(file));
    setPreviews((prev) => [...prev, ...newPreviews]);
  };

  const handleRemoveImage = (index) => {
    const newFiles = [...selectedFiles];
    newFiles.splice(index, 1);
    setSelectedFiles(newFiles);

    const newPreviews = [...previews];
    URL.revokeObjectURL(newPreviews[index]);
    newPreviews.splice(index, 1);
    setPreviews(newPreviews);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!description.trim()) {
      setError("Please provide a description explaining why you want to return the product.");
      return;
    }

    try {
      setSubmitting(true);
      let uploadedImages = [];

      // If user selected files, upload to Cloudinary first
      if (selectedFiles.length > 0) {
        setUploading(true);
        const uploadRes = await uploadMultipleImages(selectedFiles);
        // uploadRes is array of { url, publicId }
        uploadedImages = Array.isArray(uploadRes)
          ? uploadRes.map((img) => ({
              url: img.url,
              publicId: img.publicId,
            }))
          : [];
        setUploading(false);
      }

      await createReturnRequest({
        orderId: order._id,
        reason,
        description: description.trim(),
        images: uploadedImages,
      });

      addNotification({
        type: "return_update",
        title: "Return Request Submitted",
        message: `Your return request for order #${order._id.toString().slice(-6).toUpperCase()} has been submitted and is under review.`,
        link: "/orders",
        metadata: { orderId: order._id, reason },
      });

      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to submit return request.");
    } finally {
      setUploading(false);
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto animate-fadeIn">
      <div
        className="w-full max-w-xl my-8 rounded-3xl p-6 sm:p-8 border shadow-2xl relative"
        style={{
          background: "var(--color-surface)",
          borderColor: "var(--color-border)",
          color: "var(--color-heading)",
        }}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-full hover:bg-[var(--color-surface-alt)] transition"
          style={{ color: "var(--color-muted)" }}
        >
          <FiX size={20} />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3">
          <div
            className="p-3 rounded-2xl"
            style={{
              background: "var(--color-accent-light)",
              color: "var(--color-accent)",
            }}
          >
            <FiUploadCloud size={24} />
          </div>
          <div>
            <h2 className="text-xl font-serif font-bold">Request Return / Replacement</h2>
            <p className="text-xs text-[var(--color-muted)]">
              Order #{order._id?.slice(-8).toUpperCase()} • Delivered Furniture
            </p>
          </div>
        </div>

        {error && (
          <div
            className="mt-4 p-3 rounded-xl border text-xs flex items-center gap-2"
            style={{
              background: "rgba(239, 68, 68, 0.1)",
              borderColor: "rgba(239, 68, 68, 0.3)",
              color: "#EF4444",
            }}
          >
            <FiAlertCircle size={15} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          {/* Reason Selection */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider mb-2">
              Select Return Reason <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {RETURN_REASONS.map((r) => (
                <label
                  key={r}
                  className={`flex items-center gap-3 p-3 rounded-2xl border cursor-pointer text-xs font-medium transition ${
                    reason === r
                      ? "border-[var(--color-accent)] bg-[var(--color-accent-light)]/20 text-[var(--color-accent)] font-bold"
                      : "border-[var(--color-border)] hover:bg-[var(--color-surface-alt)] text-[var(--color-body)]"
                  }`}
                >
                  <input
                    type="radio"
                    name="returnReason"
                    value={r}
                    checked={reason === r}
                    onChange={(e) => setReason(e.target.value)}
                    className="accent-[var(--color-accent)]"
                  />
                  <span>{r}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider mb-1">
              Detailed Description <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={4}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Please explain the issue in detail (e.g. specific damage, mismatch in dimensions/color, or reason for return)..."
              className="w-full rounded-2xl p-3 text-xs border focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] resize-none"
              style={{
                background: "var(--color-surface-alt)",
                borderColor: "var(--color-border)",
                color: "var(--color-heading)",
              }}
            />
          </div>

          {/* Cloudinary Image Upload Section */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-bold uppercase tracking-wider">
                Upload Evidence Photos (Cloudinary)
              </label>
              <span className="text-[11px] text-[var(--color-muted)] font-medium">
                {previews.length}/5 photos
              </span>
            </div>

            {/* Previews Grid */}
            {previews.length > 0 && (
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 mb-3">
                {previews.map((preview, idx) => (
                  <div
                    key={idx}
                    className="relative aspect-square rounded-2xl overflow-hidden border group shadow-sm"
                    style={{ borderColor: "var(--color-border)" }}
                  >
                    <img
                      src={preview}
                      alt={`Evidence ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(idx)}
                      className="absolute top-1 right-1 p-1.5 rounded-full bg-black/70 text-white hover:bg-red-600 transition"
                    >
                      <FiTrash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {previews.length < 5 && (
              <label
                className="flex flex-col items-center justify-center p-5 rounded-2xl border-2 border-dashed cursor-pointer transition hover:border-[var(--color-accent)] hover:bg-[var(--color-surface-alt)]"
                style={{ borderColor: "var(--color-border)" }}
              >
                <FiImage size={24} className="text-[var(--color-accent)] mb-1" />
                <span className="text-xs font-bold text-[var(--color-heading)]">
                  Click to add photos of the product
                </span>
                <span className="text-[10px] text-[var(--color-muted)] mt-0.5">
                  Clear photos of damage, labels, or defects help us approve requests faster
                </span>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            )}
          </div>

          {/* Policy Note */}
          <div
            className="p-3.5 rounded-2xl border text-[11px] flex items-start gap-2.5"
            style={{
              background: "var(--color-surface-alt)",
              borderColor: "var(--color-border)",
              color: "var(--color-muted)",
            }}
          >
            <FiAlertCircle size={16} className="text-[var(--color-accent)] shrink-0 mt-0.5" />
            <span>
              Once approved, our white-glove logistics team will schedule a doorstep reverse pickup and inspect the furniture item prior to issuing your full refund.
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t" style={{ borderColor: "var(--color-border)" }}>
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-2xl border text-xs font-bold transition hover:bg-[var(--color-surface-alt)]"
              style={{ borderColor: "var(--color-border)", color: "var(--color-muted)" }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || uploading}
              className="px-6 py-2.5 rounded-2xl text-xs font-bold text-white shadow-md transition disabled:opacity-50"
              style={{ background: "var(--color-accent)" }}
            >
              {uploading
                ? "Uploading Images..."
                : submitting
                ? "Submitting Request..."
                : "Submit Return Request"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ReturnRequestModal;
