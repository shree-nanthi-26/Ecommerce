import { useState, useEffect } from "react";
import SEO from "../components/common/SEO";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiMapPin,
  FiHome,
  FiBriefcase,
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiCheckCircle,
  FiStar,
  FiPhone,
  FiChevronLeft,
  FiAlertCircle,
} from "react-icons/fi";
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";
import AddressFormModal from "../components/address/AddressFormModal";
import {
  getAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
} from "../services/addressService";

export default function Addresses() {
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);

  // Delete Confirm State
  const [deletingId, setDeletingId] = useState(null);

  const fetchAddresses = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await getAddresses();
      setAddresses(res.data || []);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to load addresses.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAddresses();
  }, []);

  const showNotification = (msg) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(""), 4000);
  };

  const handleOpenAdd = () => {
    setEditingAddress(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (addr) => {
    setEditingAddress(addr);
    setIsModalOpen(true);
  };

  const handleSaveAddress = async (formData) => {
    if (editingAddress) {
      await updateAddress(editingAddress._id, formData);
      showNotification("Address updated successfully!");
    } else {
      await createAddress(formData);
      showNotification("New address added successfully!");
    }
    await fetchAddresses();
  };

  const handleSetDefault = async (id) => {
    try {
      await setDefaultAddress(id);
      showNotification("Default delivery address updated!");
      await fetchAddresses();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to set default address");
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteAddress(id);
      setDeletingId(null);
      showNotification("Address removed successfully!");
      await fetchAddresses();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete address");
    }
  };

  const getTypeStyle = (type) => {
    switch (type) {
      case "Home":
        return {
          icon: FiHome,
          bg: "rgba(59, 130, 246, 0.12)",
          color: "#3B82F6",
          borderColor: "rgba(59, 130, 246, 0.25)",
        };
      case "Work":
        return {
          icon: FiBriefcase,
          bg: "rgba(168, 85, 247, 0.12)",
          color: "#A855F7",
          borderColor: "rgba(168, 85, 247, 0.25)",
        };
      default:
        return {
          icon: FiMapPin,
          bg: "rgba(16, 185, 129, 0.12)",
          color: "#10B981",
          borderColor: "rgba(16, 185, 129, 0.25)",
        };
    }
  };

  return (
    <>
      <SEO
        title="My Addresses | Furniva"
        description="Manage your saved shipping and delivery addresses."
        canonicalUrl="/addresses"
        noIndex={true}
      />

      <Navbar />

      <main
        className="min-h-screen px-4 sm:px-8 py-12"
        style={{ background: "var(--color-bg)", color: "var(--color-heading)" }}
      >
        <div className="mx-auto max-w-[1200px]">
          {/* Breadcrumb / Back */}
          <div className="mb-6 flex items-center justify-between">
            <Link
              to="/profile"
              className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider transition hover:text-[var(--color-accent)]"
              style={{ color: "var(--color-muted)" }}
            >
              <FiChevronLeft size={16} /> Back to Profile
            </Link>
          </div>

          {/* Heading and Action */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div>
              <p
                className="text-xs font-bold uppercase tracking-[0.25em]"
                style={{ color: "var(--color-accent)" }}
              >
                Delivery Preferences
              </p>
              <h1 className="mt-1 text-3xl sm:text-4xl font-serif font-bold tracking-tight">
                My Addresses
              </h1>
              <p className="mt-1 text-xs sm:text-sm" style={{ color: "var(--color-muted)" }}>
                Manage saved addresses for express furniture delivery and hassle-free scheduling.
              </p>
            </div>

            <button
              onClick={handleOpenAdd}
              id="add-new-address-btn"
              className="inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3 font-bold text-sm text-white shadow-lg transition hover:opacity-90 self-start sm:self-auto"
              style={{ background: "var(--color-accent)" }}
            >
              <FiPlus size={18} /> Add New Address
            </button>
          </div>

          {/* Alerts */}
          {successMessage && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 flex items-center gap-3 rounded-2xl p-4 text-sm font-medium border"
              style={{
                background: "rgba(16, 185, 129, 0.1)",
                borderColor: "rgba(16, 185, 129, 0.25)",
                color: "#10B981",
              }}
            >
              <FiCheckCircle size={18} className="shrink-0" />
              <span>{successMessage}</span>
            </motion.div>
          )}

          {error && (
            <div
              className="mb-6 flex items-center gap-3 rounded-2xl p-4 text-sm font-medium border"
              style={{
                background: "rgba(239, 68, 68, 0.1)",
                borderColor: "rgba(239, 68, 68, 0.2)",
                color: "var(--color-danger)",
              }}
            >
              <FiAlertCircle size={18} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Content */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="rounded-3xl p-6 border animate-pulse space-y-4"
                  style={{
                    background: "var(--color-surface)",
                    borderColor: "var(--color-border)",
                  }}
                >
                  <div className="h-6 w-24 bg-gray-300 dark:bg-gray-700 rounded-lg" />
                  <div className="h-4 w-40 bg-gray-300 dark:bg-gray-700 rounded" />
                  <div className="h-16 w-full bg-gray-300 dark:bg-gray-700 rounded-xl" />
                  <div className="h-8 w-full bg-gray-300 dark:bg-gray-700 rounded-xl" />
                </div>
              ))}
            </div>
          ) : addresses.length === 0 ? (
            /* Empty State */
            <div
              className="rounded-3xl p-12 text-center border shadow-sm max-w-lg mx-auto my-8"
              style={{
                background: "var(--color-surface)",
                borderColor: "var(--color-border)",
              }}
            >
              <div
                className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl mb-4"
                style={{
                  background: "var(--color-surface-alt)",
                  color: "var(--color-accent)",
                }}
              >
                <FiMapPin size={32} />
              </div>
              <h2 className="text-xl font-bold font-serif">No Addresses Saved Yet</h2>
              <p className="mt-2 text-xs sm:text-sm text-center" style={{ color: "var(--color-muted)" }}>
                Save your home or office address to enjoy seamless 1-click checkout and direct delivery tracking.
              </p>
              <button
                onClick={handleOpenAdd}
                className="mt-6 inline-flex items-center gap-2 rounded-2xl px-6 py-3 text-sm font-bold text-white shadow-md transition hover:opacity-90"
                style={{ background: "var(--color-accent)" }}
              >
                <FiPlus size={16} /> Add Your First Address
              </button>
            </div>
          ) : (
            /* Address Cards Grid */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <AnimatePresence>
                {addresses.map((addr) => {
                  const typeStyle = getTypeStyle(addr.addressType);
                  const TypeIcon = typeStyle.icon;

                  return (
                    <motion.div
                      key={addr._id}
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.25 }}
                      className={`relative flex flex-col justify-between rounded-3xl p-6 border transition-all ${
                        addr.isDefault ? "ring-2 ring-[var(--color-accent)] shadow-md" : "shadow-sm hover:shadow-md"
                      }`}
                      style={{
                        background: "var(--color-surface)",
                        borderColor: addr.isDefault ? "var(--color-accent)" : "var(--color-border)",
                      }}
                    >
                      <div>
                        {/* Top Bar: Type Badge & Default Badge */}
                        <div className="flex items-center justify-between gap-2 mb-4">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border"
                              style={{
                                background: typeStyle.bg,
                                color: typeStyle.color,
                                borderColor: typeStyle.borderColor,
                              }}
                            >
                              <TypeIcon size={13} /> {addr.addressType}
                            </span>

                            {addr.isDefault && (
                              <span
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold text-white shadow-sm"
                                style={{
                                  background: "linear-gradient(135deg, #8B5E3C 0%, #D97706 100%)",
                                }}
                              >
                                <FiStar size={11} /> DEFAULT
                              </span>
                            )}
                          </div>

                          {/* Quick Edit & Delete Icons */}
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleOpenEdit(addr)}
                              title="Edit address"
                              aria-label={`Edit address for ${addr.fullName}`}
                              className="p-2 rounded-xl transition hover:bg-[var(--color-surface-alt)]"
                              style={{ color: "var(--color-muted)" }}
                            >
                              <FiEdit2 size={15} />
                            </button>
                            <button
                              onClick={() => setDeletingId(addr._id)}
                              title="Delete address"
                              aria-label={`Delete address for ${addr.fullName}`}
                              className="p-2 rounded-xl transition hover:bg-red-500/10 text-red-500"
                            >
                              <FiTrash2 size={15} />
                            </button>
                          </div>
                        </div>

                        {/* Customer Info */}
                        <h3 className="text-base font-bold font-serif text-[var(--color-heading)]">
                          {addr.fullName}
                        </h3>

                        <p
                          className="mt-1 flex items-center gap-1.5 text-xs font-semibold"
                          style={{ color: "var(--color-muted)" }}
                        >
                          <FiPhone size={13} /> +91 {addr.phone}
                        </p>

                        {/* Address Details */}
                        <div
                          className="mt-3 text-xs leading-relaxed rounded-2xl p-3 border"
                          style={{
                            background: "var(--color-surface-alt)",
                            borderColor: "var(--color-border)",
                            color: "var(--color-body)",
                          }}
                        >
                          <p className="font-medium text-[var(--color-heading)]">{addr.addressLine1}</p>
                          {addr.addressLine2 && <p className="mt-0.5">{addr.addressLine2}</p>}
                          <p className="mt-1 font-semibold text-[var(--color-heading)]">
                            {addr.city}, {addr.state} – {addr.postalCode}
                          </p>
                          <p className="text-[10px] uppercase font-bold text-[var(--color-muted)] mt-0.5">
                            {addr.country || "India"}
                          </p>
                        </div>
                      </div>

                      {/* Footer Actions */}
                      <div className="mt-5 pt-4 border-t flex items-center justify-between" style={{ borderColor: "var(--color-border)" }}>
                        {!addr.isDefault ? (
                          <button
                            onClick={() => handleSetDefault(addr._id)}
                            className="text-xs font-bold transition hover:underline flex items-center gap-1.5"
                            style={{ color: "var(--color-accent)" }}
                          >
                            <FiCheckCircle size={14} /> Set as Default
                          </button>
                        ) : (
                          <span className="text-xs font-semibold flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                            <FiCheckCircle size={14} /> Default for Orders
                          </span>
                        )}

                        <button
                          onClick={() => handleOpenEdit(addr)}
                          className="text-xs font-semibold transition hover:underline"
                          style={{ color: "var(--color-muted)" }}
                        >
                          Edit Details
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </div>
      </main>

      {/* Address Add / Edit Modal */}
      <AddressFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingAddress(null);
        }}
        onSubmit={handleSaveAddress}
        initialData={editingAddress}
        title={editingAddress ? "Edit Delivery Address" : "Add New Delivery Address"}
      />

      {/* Delete Confirmation Modal */}
      {deletingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div
            className="w-full max-w-sm rounded-3xl p-6 border shadow-2xl text-center"
            style={{
              background: "var(--color-surface)",
              borderColor: "var(--color-border)",
              color: "var(--color-heading)",
            }}
          >
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/10 text-red-500 mb-4">
              <FiTrash2 size={24} />
            </div>
            <h3 className="text-lg font-bold font-serif">Delete this address?</h3>
            <p className="mt-1.5 text-xs" style={{ color: "var(--color-muted)" }}>
              Are you sure you want to remove this address? This action cannot be undone.
            </p>
            <div className="mt-6 flex items-center justify-center gap-3">
              <button
                onClick={() => setDeletingId(null)}
                className="px-4 py-2.5 rounded-xl border text-xs font-bold transition hover:bg-[var(--color-surface-alt)]"
                style={{ borderColor: "var(--color-border)", color: "var(--color-heading)" }}
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deletingId)}
                className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-red-500 hover:bg-red-600 shadow-md transition"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </>
  );
}
