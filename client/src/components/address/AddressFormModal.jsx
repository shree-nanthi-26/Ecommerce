import { useState, useEffect } from "react";
import { FiX, FiHome, FiBriefcase, FiMapPin, FiCheck } from "react-icons/fi";

export const INDIAN_STATES = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  "Andaman and Nicobar Islands",
  "Chandigarh",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi",
  "Jammu and Kashmir",
  "Ladakh",
  "Lakshadweep",
  "Puducherry",
];

export default function AddressFormModal({
  isOpen,
  onClose,
  onSubmit,
  initialData = null,
  title = "Add Delivery Address",
}) {
  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "Karnataka",
    postalCode: "",
    country: "India",
    addressType: "Home",
    isDefault: false,
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState("");

  useEffect(() => {
    if (initialData) {
      setFormData({
        fullName: initialData.fullName || "",
        phone: initialData.phone || "",
        addressLine1: initialData.addressLine1 || "",
        addressLine2: initialData.addressLine2 || "",
        city: initialData.city || "",
        state: initialData.state || "Karnataka",
        postalCode: initialData.postalCode || initialData.pincode || "",
        country: initialData.country || "India",
        addressType: initialData.addressType || "Home",
        isDefault: Boolean(initialData.isDefault),
      });
    } else {
      setFormData({
        fullName: "",
        phone: "",
        addressLine1: "",
        addressLine2: "",
        city: "",
        state: "Karnataka",
        postalCode: "",
        country: "India",
        addressType: "Home",
        isDefault: false,
      });
    }
    setErrors({});
    setApiError("");
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const validate = () => {
    const errs = {};
    if (!formData.fullName.trim()) errs.fullName = "Full name is required";
    
    const cleanPhone = formData.phone.replace(/[\s\-+]/g, "");
    if (!cleanPhone) {
      errs.phone = "Phone number is required";
    } else if (!/^[6-9]\d{9}$/.test(cleanPhone.slice(-10))) {
      errs.phone = "Enter a valid 10-digit Indian mobile number (e.g. 9876543210)";
    }

    if (!formData.addressLine1.trim()) errs.addressLine1 = "Flat / House no. / Street is required";
    if (!formData.city.trim()) errs.city = "City is required";
    if (!formData.state.trim()) errs.state = "State is required";

    const cleanPin = formData.postalCode.trim();
    if (!cleanPin) {
      errs.postalCode = "PIN code is required";
    } else if (!/^[1-9][0-9]{5}$/.test(cleanPin)) {
      errs.postalCode = "Enter a valid 6-digit Indian PIN code (e.g. 560001)";
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError("");

    if (!validate()) return;

    try {
      setIsSubmitting(true);
      await onSubmit({
        ...formData,
        phone: formData.phone.replace(/[\s\-+]/g, "").slice(-10),
        postalCode: formData.postalCode.trim(),
      });
      onClose();
    } catch (err) {
      setApiError(err.response?.data?.message || err.message || "Failed to save address");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div
        className="relative w-full max-w-xl rounded-3xl p-6 sm:p-8 border shadow-2xl transition-all my-8"
        style={{
          background: "var(--color-surface)",
          borderColor: "var(--color-border)",
          color: "var(--color-heading)",
        }}
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b" style={{ borderColor: "var(--color-border)" }}>
          <div>
            <h3 className="text-xl font-bold font-serif">{title}</h3>
            <p className="text-xs mt-0.5" style={{ color: "var(--color-muted)" }}>
              Ensure delivery details are accurate for scheduled furniture delivery.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-[var(--color-surface-alt)] transition"
            aria-label="Close modal"
          >
            <FiX size={20} />
          </button>
        </div>

        {apiError && (
          <div
            className="mt-4 rounded-xl p-3 text-xs font-medium border"
            style={{
              background: "rgba(239, 68, 68, 0.1)",
              borderColor: "rgba(239, 68, 68, 0.2)",
              color: "var(--color-danger)",
            }}
          >
            {apiError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {/* Address Type Selection */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: "var(--color-muted)" }}>
              Address Type
            </label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { type: "Home", icon: FiHome, desc: "All-day delivery" },
                { type: "Work", icon: FiBriefcase, desc: "10 AM - 6 PM" },
                { type: "Other", icon: FiMapPin, desc: "Friends/Relatives" },
              ].map(({ type, icon: Icon, desc }) => {
                const isSelected = formData.addressType === type;
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setFormData({ ...formData, addressType: type })}
                    className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-all text-center ${
                      isSelected
                        ? "border-[var(--color-accent)] ring-2 ring-[var(--color-accent)]/20 shadow-sm"
                        : "border-[var(--color-border)] hover:border-[var(--color-accent)]/50"
                    }`}
                    style={{
                      background: isSelected ? "var(--color-surface-alt)" : "transparent",
                    }}
                  >
                    <Icon
                      size={18}
                      className={isSelected ? "text-[var(--color-accent)]" : "text-[var(--color-muted)]"}
                    />
                    <span className="mt-1 font-semibold text-xs">{type}</span>
                    <span className="text-[10px] text-[var(--color-muted)]">{desc}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Full Name & Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold mb-1" style={{ color: "var(--color-muted)" }}>
                Full Name *
              </label>
              <input
                type="text"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                placeholder="Receiver's full name"
                className={`w-full rounded-xl px-3.5 py-2.5 text-sm outline-none border transition ${
                  errors.fullName ? "border-red-500" : "border-[var(--color-border)] focus:border-[var(--color-accent)]"
                }`}
                style={{ background: "var(--color-surface-alt)", color: "var(--color-heading)" }}
              />
              {errors.fullName && <p className="text-[11px] text-red-500 mt-1">{errors.fullName}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1" style={{ color: "var(--color-muted)" }}>
                Mobile Number *
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-3 text-xs font-semibold text-[var(--color-muted)]">+91</span>
                <input
                  type="tel"
                  maxLength={10}
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value.replace(/\D/g, "") })}
                  placeholder="9876543210"
                  className={`w-full rounded-xl pl-11 pr-3.5 py-2.5 text-sm outline-none border transition ${
                    errors.phone ? "border-red-500" : "border-[var(--color-border)] focus:border-[var(--color-accent)]"
                  }`}
                  style={{ background: "var(--color-surface-alt)", color: "var(--color-heading)" }}
                />
              </div>
              {errors.phone && <p className="text-[11px] text-red-500 mt-1">{errors.phone}</p>}
            </div>
          </div>

          {/* Address Line 1 */}
          <div>
            <label className="block text-xs font-semibold mb-1" style={{ color: "var(--color-muted)" }}>
              Flat, House No., Building, Apartment *
            </label>
            <input
              type="text"
              value={formData.addressLine1}
              onChange={(e) => setFormData({ ...formData, addressLine1: e.target.value })}
              placeholder="e.g. Flat 302, Green Glen Apartments, 4th Block"
              className={`w-full rounded-xl px-3.5 py-2.5 text-sm outline-none border transition ${
                errors.addressLine1 ? "border-red-500" : "border-[var(--color-border)] focus:border-[var(--color-accent)]"
              }`}
              style={{ background: "var(--color-surface-alt)", color: "var(--color-heading)" }}
            />
            {errors.addressLine1 && <p className="text-[11px] text-red-500 mt-1">{errors.addressLine1}</p>}
          </div>

          {/* Address Line 2 */}
          <div>
            <label className="block text-xs font-semibold mb-1" style={{ color: "var(--color-muted)" }}>
              Area, Street, Sector, Landmark (Optional)
            </label>
            <input
              type="text"
              value={formData.addressLine2}
              onChange={(e) => setFormData({ ...formData, addressLine2: e.target.value })}
              placeholder="e.g. Near HDFC Bank, Sarjapur Main Road"
              className="w-full rounded-xl px-3.5 py-2.5 text-sm outline-none border border-[var(--color-border)] focus:border-[var(--color-accent)] transition"
              style={{ background: "var(--color-surface-alt)", color: "var(--color-heading)" }}
            />
          </div>

          {/* City, State, PIN code */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold mb-1" style={{ color: "var(--color-muted)" }}>
                City *
              </label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                placeholder="e.g. Bengaluru"
                className={`w-full rounded-xl px-3.5 py-2.5 text-sm outline-none border transition ${
                  errors.city ? "border-red-500" : "border-[var(--color-border)] focus:border-[var(--color-accent)]"
                }`}
                style={{ background: "var(--color-surface-alt)", color: "var(--color-heading)" }}
              />
              {errors.city && <p className="text-[11px] text-red-500 mt-1">{errors.city}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1" style={{ color: "var(--color-muted)" }}>
                State *
              </label>
              <select
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                className="w-full rounded-xl px-3.5 py-2.5 text-sm outline-none border border-[var(--color-border)] focus:border-[var(--color-accent)] transition cursor-pointer"
                style={{ background: "var(--color-surface-alt)", color: "var(--color-heading)" }}
              >
                {INDIAN_STATES.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
              {errors.state && <p className="text-[11px] text-red-500 mt-1">{errors.state}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1" style={{ color: "var(--color-muted)" }}>
                PIN Code *
              </label>
              <input
                type="text"
                maxLength={6}
                value={formData.postalCode}
                onChange={(e) => setFormData({ ...formData, postalCode: e.target.value.replace(/\D/g, "") })}
                placeholder="6-digit PIN"
                className={`w-full rounded-xl px-3.5 py-2.5 text-sm outline-none border transition ${
                  errors.postalCode ? "border-red-500" : "border-[var(--color-border)] focus:border-[var(--color-accent)]"
                }`}
                style={{ background: "var(--color-surface-alt)", color: "var(--color-heading)" }}
              />
              {errors.postalCode && <p className="text-[11px] text-red-500 mt-1">{errors.postalCode}</p>}
            </div>
          </div>

          {/* Set as Default Checkbox */}
          <div className="pt-2">
            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={formData.isDefault}
                onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                className="h-4 w-4 rounded accent-[#8B5E3C] cursor-pointer"
              />
              <span className="text-xs font-semibold">Make this my default delivery address</span>
            </label>
          </div>

          {/* Action Buttons */}
          <div className="pt-4 flex items-center justify-end gap-3 border-t" style={{ borderColor: "var(--color-border)" }}>
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border font-semibold text-xs transition hover:bg-[var(--color-surface-alt)]"
              style={{ borderColor: "var(--color-border)", color: "var(--color-heading)" }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl font-bold text-xs text-white shadow-md transition disabled:opacity-50 flex items-center gap-1.5"
              style={{ background: "var(--color-accent)" }}
            >
              {isSubmitting ? "Saving..." : <><FiCheck size={14} /> Save Address</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
