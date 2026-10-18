import { useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import SEO from "../components/common/SEO";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiShield,
  FiTruck,
  FiPlus,
  FiHome,
  FiBriefcase,
  FiMapPin,
  FiCheckCircle,
  FiEdit2,
  FiStar,
  FiPhone,
  FiCheck,
  FiCreditCard,
  FiDollarSign,
  FiCheckSquare,
  FiClock,
  FiChevronRight,
  FiChevronLeft,
  FiTag,
  FiX,
  FiAlertCircle,
  FiLock,
  FiPackage,
  FiInfo,
} from "react-icons/fi";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { useNotification } from "../context/NotificationContext";
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";
import { createOrder, calculateOrderSummary } from "../services/orderService";
import { createPaymentOrder, verifyPayment } from "../services/paymentService";
import { getAddresses, createAddress, updateAddress } from "../services/addressService";
import { getPublicCoupons } from "../services/couponService";
import AddressFormModal, { INDIAN_STATES } from "../components/address/AddressFormModal";

const CHECKOUT_STEPS = [
  { id: 1, name: "Address", icon: FiMapPin, label: "Delivery Address" },
  { id: 2, name: "Delivery", icon: FiTruck, label: "Shipping Method" },
  { id: 3, name: "Payment", icon: FiCreditCard, label: "Payment Option" },
  { id: 4, name: "Review", icon: FiCheckSquare, label: "Order Review" },
];

function Checkout() {
  const { cart, cartTotal, clearCart } = useCart();
  const { user } = useAuth();
  const { addNotification } = useNotification();
  const navigate = useNavigate();
  const location = useLocation();

  // Step Management
  const [currentStep, setCurrentStep] = useState(1);

  // Address State
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [loadingAddresses, setLoadingAddresses] = useState(false);
  const [isManualAddress, setIsManualAddress] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);

  // Form Fields State
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [addressLine1, setAddressLine1] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [city, setCity] = useState("");
  const [stateValue, setStateValue] = useState("Karnataka");
  const [pincode, setPincode] = useState("");
  const [saveToAddresses, setSaveToAddresses] = useState(false);

  // Delivery Method State
  const [deliverySpeed, setDeliverySpeed] = useState("standard");
  const [deliveryInstructions, setDeliveryInstructions] = useState("");

  // Payment Method State
  const [paymentMethod, setPaymentMethod] = useState("ONLINE");

  // Coupon State
  const [couponInput, setCouponInput] = useState(location.state?.coupon?.code || "");
  const [appliedCouponCode, setAppliedCouponCode] = useState(location.state?.coupon?.code || "");
  const [couponError, setCouponError] = useState("");
  const [couponSuccess, setCouponSuccess] = useState("");
  const [availableCoupons, setAvailableCoupons] = useState([]);
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);

  // Terms & Conditions State
  const [termsAgreed, setTermsAgreed] = useState(false);

  // Server Calculation & Summary State
  const [serverCalculation, setServerCalculation] = useState(null);
  const [isCalculating, setIsCalculating] = useState(false);

  // Submission State
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (cart.length === 0) {
      navigate("/cart");
    }
  }, [cart, navigate]);

  // Load public coupons on mount
  useEffect(() => {
    async function fetchCoupons() {
      try {
        const coupons = await getPublicCoupons();
        setAvailableCoupons(coupons || []);
      } catch {
        setAvailableCoupons([]);
      }
    }
    fetchCoupons();
  }, []);

  // Fetch saved addresses if logged in
  const fetchSavedAddresses = async (preferredId = null) => {
    if (!user) return;
    try {
      setLoadingAddresses(true);
      const res = await getAddresses();
      const addrs = res.data || [];
      setSavedAddresses(addrs);

      if (addrs.length > 0) {
        let target = null;
        if (preferredId) {
          target = addrs.find((a) => a._id === preferredId);
        }
        if (!target) {
          target = addrs.find((a) => a.isDefault) || addrs[0];
        }

        if (target && !isManualAddress) {
          selectSavedAddress(target);
        }
      } else {
        setIsManualAddress(true);
      }
    } catch {
      setIsManualAddress(true);
    } finally {
      setLoadingAddresses(false);
    }
  };

  useEffect(() => {
    fetchSavedAddresses();
  }, [user]);

  const selectSavedAddress = (addr) => {
    setSelectedAddressId(addr._id);
    setIsManualAddress(false);
    setFullName(addr.fullName || "");
    setPhone(addr.phone || "");
    setAddressLine1(addr.addressLine1 || "");
    setAddressLine2(addr.addressLine2 || "");
    setCity(addr.city || "");
    setStateValue(addr.state || "Karnataka");
    setPincode(addr.postalCode || addr.pincode || "");
  };

  const handleOpenAddAddress = () => {
    setEditingAddress(null);
    setIsModalOpen(true);
  };

  const handleOpenEditAddress = (addr, e) => {
    e.stopPropagation();
    setEditingAddress(addr);
    setIsModalOpen(true);
  };

  const handleModalSaveAddress = async (formData) => {
    if (editingAddress) {
      const res = await updateAddress(editingAddress._id, formData);
      await fetchSavedAddresses(res.data?._id || editingAddress._id);
    } else {
      const res = await createAddress(formData);
      await fetchSavedAddresses(res.data?._id);
    }
  };

  // Recalculate order summary on backend whenever cart, coupon, or deliverySpeed changes
  const refreshServerCalculations = async (codeToUse = appliedCouponCode, speedToUse = deliverySpeed) => {
    if (cart.length === 0) return;
    try {
      setIsCalculating(true);
      const payload = {
        items: cart.map((item) => ({
          product: item.id,
          quantity: item.quantity,
        })),
        couponCode: codeToUse ? String(codeToUse).trim().toUpperCase() : undefined,
        deliverySpeed: speedToUse,
      };

      const res = await calculateOrderSummary(payload);
      if (res.success && res.data) {
        setServerCalculation(res.data);
      }
    } catch (err) {
      console.warn("Backend calculation fallback:", err.message);
    } finally {
      setIsCalculating(false);
    }
  };

  useEffect(() => {
    refreshServerCalculations(appliedCouponCode, deliverySpeed);
  }, [cart, appliedCouponCode, deliverySpeed]);

  // Handle Coupon Apply
  const handleApplyCoupon = async (code) => {
    const cleanCode = (code || couponInput).trim().toUpperCase();
    if (!cleanCode) {
      setCouponError("Please enter a coupon code");
      return;
    }

    setCouponError("");
    setCouponSuccess("");
    setIsApplyingCoupon(true);

    try {
      const payload = {
        items: cart.map((item) => ({
          product: item.id,
          quantity: item.quantity,
        })),
        couponCode: cleanCode,
        deliverySpeed,
      };

      const res = await calculateOrderSummary(payload);
      if (res.success && res.data) {
        setServerCalculation(res.data);
        setAppliedCouponCode(cleanCode);
        setCouponInput(cleanCode);
        setCouponSuccess(`Coupon ${cleanCode} applied! Saved ₹${res.data.discountAmount}`);
      }
    } catch (err) {
      setCouponError(err.response?.data?.message || "Invalid or ineligible coupon code");
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCouponCode("");
    setCouponInput("");
    setCouponError("");
    setCouponSuccess("");
    refreshServerCalculations("", deliverySpeed);
  };

  // Address Validation
  const isAddressValid =
    fullName.trim() &&
    phone.replace(/\D/g, "").length === 10 &&
    /^[6-9]\d{9}$/.test(phone.replace(/\D/g, "").slice(-10)) &&
    addressLine1.trim() &&
    city.trim() &&
    stateValue.trim() &&
    pincode.trim().length === 6 &&
    /^[1-9][0-9]{5}$/.test(pincode.trim());

  // Calculations Fallback
  const displayItemsTotal = serverCalculation?.itemsTotal ?? cartTotal;
  const displayDiscount = serverCalculation?.discountAmount ?? 0;
  const displayDeliveryFee = serverCalculation?.deliveryFee ?? (cartTotal > 999 ? 0 : 99);
  const displayTotalAmount = serverCalculation?.totalAmount ?? Math.max(0, cartTotal + displayDeliveryFee - displayDiscount);
  const displayTotalSavings = serverCalculation?.totalSavings ?? displayDiscount;

  // Step Navigation Handlers
  const handleProceedToDelivery = (e) => {
    e?.preventDefault?.();
    setError("");
    if (!isAddressValid) {
      setError("Please select or complete a valid delivery address with 10-digit phone & 6-digit PIN.");
      return;
    }
    setCurrentStep(2);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleProceedToPayment = (e) => {
    e?.preventDefault?.();
    setError("");
    setCurrentStep(3);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleProceedToReview = (e) => {
    e?.preventDefault?.();
    setError("");
    setCurrentStep(4);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Final Order Submission
  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    setError("");

    if (!isAddressValid) {
      setError("Delivery address is incomplete. Please check your address details.");
      setCurrentStep(1);
      return;
    }

    if (!termsAgreed) {
      setError("Please accept the Terms & Conditions to complete your order.");
      return;
    }

    const cleanPhone = phone.replace(/\D/g, "").slice(-10);
    const cleanPin = pincode.trim();

    // If manual address and user checked save
    if (user && isManualAddress && saveToAddresses) {
      try {
        await createAddress({
          fullName: fullName.trim(),
          phone: cleanPhone,
          addressLine1: addressLine1.trim(),
          addressLine2: addressLine2.trim(),
          city: city.trim(),
          state: stateValue.trim(),
          postalCode: cleanPin,
          addressType: "Home",
          isDefault: savedAddresses.length === 0,
        });
      } catch {
        // Non-blocking
      }
    }

    const orderData = {
      items: cart.map((item) => ({
        product: item.id,
        name: item.name,
        quantity: item.quantity,
      })),
      shippingAddress: {
        fullName: fullName.trim(),
        phone: cleanPhone,
        addressLine1: addressLine1.trim(),
        addressLine2: addressLine2.trim() + (deliveryInstructions ? ` [Note: ${deliveryInstructions.trim()}]` : ""),
        city: city.trim(),
        state: stateValue.trim(),
        pincode: cleanPin,
      },
      couponCode: appliedCouponCode || undefined,
      deliverySpeed,
    };

    try {
      setIsSubmitting(true);

      if (paymentMethod === "ONLINE") {
        const paymentOrder = await createPaymentOrder({
          amount: displayTotalAmount,
          couponCode: appliedCouponCode || undefined,
        });

        const order = await openRazorpayCheckout(paymentOrder, {
          ...orderData,
          paymentMethod: "ONLINE",
        });

        await clearCart();
        addNotification({
          type: "order_placed",
          title: "Order Placed Successfully",
          message: `Your order #${order._id?.toString().slice(-6).toUpperCase()} has been placed and received.`,
          link: "/orders",
          metadata: { orderId: order._id, amount: displayTotalAmount },
        });
        navigate(`/order-confirmation/${order._id}`);
      } else {
        const order = await createOrder({
          ...orderData,
          paymentMethod: "COD",
        });

        await clearCart();
        addNotification({
          type: "order_placed",
          title: "Order Placed Successfully",
          message: `Your order #${order._id?.toString().slice(-6).toUpperCase()} has been placed and received.`,
          link: "/orders",
          metadata: { orderId: order._id, amount: displayTotalAmount },
        });
        navigate(`/order-confirmation/${order._id}`);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Unable to place order.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const openRazorpayCheckout = (paymentOrder, orderData) => {
    return new Promise((resolve, reject) => {
      if (!window.Razorpay) {
        reject(new Error("Razorpay SDK failed to load. Please refresh and try again."));
        return;
      }

      const options = {
        key: paymentOrder.keyId,
        amount: paymentOrder.amount,
        currency: paymentOrder.currency,
        name: "Furniva Living",
        description: "Handcrafted Luxury Furniture Order",
        order_id: paymentOrder.orderId,
        handler: async function (response) {
          try {
            await verifyPayment(response);
            const order = await createOrder({
              ...orderData,
              paymentMethod: "ONLINE",
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });
            resolve(order);
          } catch (error) {
            reject(error);
          }
        },
        modal: {
          ondismiss: function () {
            reject(new Error("Payment was cancelled. You can retry anytime."));
          },
        },
        prefill: {
          name: fullName,
          contact: phone,
          email: user?.email || "",
        },
        theme: {
          color: "#8B5E3C",
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", function (response) {
        reject(new Error(response.error?.description || "Payment failed. Please try again."));
      });
      rzp.open();
    });
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case "Home":
        return FiHome;
      case "Work":
        return FiBriefcase;
      default:
        return FiMapPin;
    }
  };

  return (
    <>
      <SEO
        title={`Secure Checkout – Step ${currentStep} of 4 | Furniva`}
        description="Secure checkout for your Furniva furniture order."
        canonicalUrl="/checkout"
        noIndex={true}
      />

      <Navbar />

      <main
        className="min-h-screen px-4 sm:px-8 py-10"
        style={{ background: "var(--color-bg)", color: "var(--color-heading)" }}
      >
        <div className="mx-auto max-w-[1500px]">
          {/* Header */}
          <div className="mb-8 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div>
              <p
                className="text-xs font-bold uppercase tracking-[0.25em]"
                style={{ color: "var(--color-accent)" }}
              >
                Secure Order Processing
              </p>
              <h1 className="mt-1 text-3xl sm:text-4xl font-serif font-bold tracking-tight">
                Furniva Express Checkout
              </h1>
            </div>
            <div className="flex items-center gap-4 text-xs" style={{ color: "var(--color-muted)" }}>
              <span className="flex items-center gap-1.5"><FiLock className="text-emerald-500" /> 256-Bit SSL Encrypted</span>
              <span className="flex items-center gap-1.5"><FiTruck className="text-[var(--color-accent)]" /> White-Glove Transit</span>
            </div>
          </div>

          {/* Visual Progress Stepper Indicator */}
          <div
            className="mb-10 rounded-3xl p-4 sm:p-6 border shadow-sm"
            style={{
              background: "var(--color-surface)",
              borderColor: "var(--color-border)",
            }}
          >
            <div className="relative flex items-center justify-between max-w-4xl mx-auto">
              {/* Step Connecting Line */}
              <div className="absolute top-1/2 left-6 right-6 -translate-y-1/2 h-1 bg-gray-200 dark:bg-gray-800 -z-0 rounded-full">
                <div
                  className="h-full transition-all duration-500 rounded-full"
                  style={{
                    background: "linear-gradient(90deg, var(--color-accent) 0%, #D97706 100%)",
                    width: `${((currentStep - 1) / (CHECKOUT_STEPS.length - 1)) * 100}%`,
                  }}
                />
              </div>

              {CHECKOUT_STEPS.map((step) => {
                const StepIcon = step.icon;
                const isCompleted = currentStep > step.id;
                const isCurrent = currentStep === step.id;
                const isClickable = isCompleted || step.id === currentStep;

                return (
                  <button
                    key={step.id}
                    type="button"
                    onClick={() => {
                      if (isClickable) {
                        setCurrentStep(step.id);
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }
                    }}
                    disabled={!isClickable}
                    className={`relative z-10 flex flex-col items-center group transition ${
                      !isClickable ? "cursor-not-allowed opacity-60" : "cursor-pointer"
                    }`}
                  >
                    <div
                      className={`flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-2xl font-bold text-sm sm:text-base transition-all shadow-md ${
                        isCurrent
                          ? "ring-4 ring-[var(--color-accent)]/20 scale-105 text-white"
                          : isCompleted
                          ? "bg-emerald-500 text-white"
                          : "border text-[var(--color-muted)]"
                      }`}
                      style={{
                        background: isCurrent
                          ? "var(--color-accent)"
                          : isCompleted
                          ? "#10B981"
                          : "var(--color-surface-alt)",
                        borderColor: isCurrent || isCompleted ? "transparent" : "var(--color-border)",
                      }}
                    >
                      {isCompleted ? <FiCheck size={20} /> : <StepIcon size={18} />}
                    </div>

                    <div className="mt-2 text-center">
                      <p
                        className={`text-xs font-bold transition ${
                          isCurrent
                            ? "text-[var(--color-accent)]"
                            : isCompleted
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-[var(--color-muted)]"
                        }`}
                      >
                        {step.id}. {step.name}
                      </p>
                      <p className="hidden sm:block text-[10px] text-[var(--color-muted)]">{step.label}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid gap-8 lg:grid-cols-3">
            {/* Step Wizard Main Container */}
            <div className="lg:col-span-2 space-y-6">
              <AnimatePresence mode="wait">
                {/* ========================================================================= */}
                {/* STEP 1: ADDRESS */}
                {/* ========================================================================= */}
                {currentStep === 1 && (
                  <motion.div
                    key="step-1"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.3 }}
                    className="rounded-3xl p-6 sm:p-8 border shadow-sm space-y-6"
                    style={{
                      background: "var(--color-surface)",
                      borderColor: "var(--color-border)",
                    }}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b" style={{ borderColor: "var(--color-border)" }}>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--color-accent)] text-white text-xs font-bold">
                            1
                          </span>
                          <h2 className="text-xl font-bold font-serif">Delivery Address</h2>
                        </div>
                        <p className="text-xs mt-1" style={{ color: "var(--color-muted)" }}>
                          Choose or add the delivery address for white-glove setup.
                        </p>
                      </div>

                      {user && (
                        <button
                          type="button"
                          onClick={handleOpenAddAddress}
                          id="checkout-add-new-address"
                          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold border transition self-start sm:self-auto hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
                          style={{
                            background: "var(--color-surface-alt)",
                            borderColor: "var(--color-border)",
                            color: "var(--color-heading)",
                          }}
                        >
                          <FiPlus size={15} /> Add New Address
                        </button>
                      )}
                    </div>

                    {/* Saved Address Cards */}
                    {user && savedAddresses.length > 0 && !isManualAddress && (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {savedAddresses.map((addr) => {
                            const isSelected = selectedAddressId === addr._id;
                            const TypeIcon = getTypeIcon(addr.addressType);

                            return (
                              <div
                                key={addr._id}
                                onClick={() => selectSavedAddress(addr)}
                                className={`cursor-pointer rounded-2xl p-4 border transition-all relative flex flex-col justify-between ${
                                  isSelected
                                    ? "border-[var(--color-accent)] ring-2 ring-[var(--color-accent)]/20 shadow-md"
                                    : "border-[var(--color-border)] hover:border-[var(--color-accent)]/50"
                                }`}
                                style={{
                                  background: isSelected ? "var(--color-surface-alt)" : "transparent",
                                }}
                              >
                                <div>
                                  <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                      <span
                                        className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full"
                                        style={{
                                          background: "rgba(139, 94, 60, 0.12)",
                                          color: "var(--color-accent)",
                                        }}
                                      >
                                        <TypeIcon size={12} /> {addr.addressType}
                                      </span>
                                      {addr.isDefault && (
                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400">
                                          DEFAULT
                                        </span>
                                      )}
                                    </div>

                                    <button
                                      type="button"
                                      onClick={(e) => handleOpenEditAddress(addr, e)}
                                      className="p-1 text-xs text-[var(--color-muted)] hover:text-[var(--color-accent)]"
                                      title="Edit this address"
                                    >
                                      <FiEdit2 size={13} />
                                    </button>
                                  </div>

                                  <p className="font-bold text-sm text-[var(--color-heading)]">{addr.fullName}</p>
                                  <p className="text-xs text-[var(--color-muted)] mt-0.5">+91 {addr.phone}</p>
                                  <p className="text-xs mt-2 text-[var(--color-body)] leading-relaxed">
                                    {addr.addressLine1}
                                    {addr.addressLine2 ? `, ${addr.addressLine2}` : ""}
                                    <br />
                                    {addr.city}, {addr.state} – {addr.postalCode}
                                  </p>
                                </div>

                                <div className="mt-3 pt-2 border-t flex items-center justify-between" style={{ borderColor: "var(--color-border)" }}>
                                  <span
                                    className={`text-xs font-bold flex items-center gap-1.5 ${
                                      isSelected ? "text-[var(--color-accent)]" : "text-[var(--color-muted)]"
                                    }`}
                                  >
                                    {isSelected ? (
                                      <>
                                        <FiCheckCircle size={14} /> Selected Address
                                      </>
                                    ) : (
                                      "Click to choose"
                                    )}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        <div className="flex items-center justify-between text-xs pt-2">
                          <button
                            type="button"
                            onClick={() => {
                              setIsManualAddress(true);
                              setSelectedAddressId(null);
                            }}
                            className="font-semibold text-[var(--color-muted)] hover:text-[var(--color-accent)] transition underline"
                          >
                            Enter custom delivery address
                          </button>

                          <Link
                            to="/addresses"
                            className="font-semibold text-[var(--color-accent)] hover:underline"
                          >
                            Manage Saved Addresses →
                          </Link>
                        </div>
                      </div>
                    )}

                    {/* Manual Address Form (for guests or custom overrides) */}
                    {(isManualAddress || !user || savedAddresses.length === 0) && (
                      <div className="space-y-4 rounded-2xl p-5 border" style={{ background: "var(--color-surface-alt)", borderColor: "var(--color-border)" }}>
                        {user && savedAddresses.length > 0 && (
                          <div className="flex items-center justify-between pb-3 border-b" style={{ borderColor: "var(--color-border)" }}>
                            <span className="text-xs font-bold">Manual Address Input</span>
                            <button
                              type="button"
                              onClick={() => {
                                setIsManualAddress(false);
                                if (savedAddresses.length > 0) {
                                  selectSavedAddress(savedAddresses[0]);
                                }
                              }}
                              className="text-xs font-bold text-[var(--color-accent)] hover:underline"
                            >
                              ← Back to Saved Addresses
                            </button>
                          </div>
                        )}

                        <div className="grid gap-4 sm:grid-cols-2">
                          <label className="block">
                            <span className="text-xs font-semibold" style={{ color: "var(--color-muted)" }}>
                              Full Name *
                            </span>
                            <input
                              value={fullName}
                              onChange={(e) => setFullName(e.target.value)}
                              className="mt-1.5 w-full rounded-xl px-3.5 py-2.5 text-sm outline-none border focus:ring-2 focus:ring-[var(--color-accent)]"
                              style={{
                                background: "var(--color-surface)",
                                borderColor: "var(--color-border)",
                                color: "var(--color-heading)",
                              }}
                              placeholder="Receiver's full name"
                              required
                            />
                          </label>
                          <label className="block">
                            <span className="text-xs font-semibold" style={{ color: "var(--color-muted)" }}>
                              Mobile Number *
                            </span>
                            <div className="relative flex items-center mt-1.5">
                              <span className="absolute left-3 text-xs font-semibold text-[var(--color-muted)]">+91</span>
                              <input
                                type="tel"
                                maxLength={10}
                                value={phone}
                                onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                                className="w-full rounded-xl pl-11 pr-3.5 py-2.5 text-sm outline-none border focus:ring-2 focus:ring-[var(--color-accent)]"
                                style={{
                                  background: "var(--color-surface)",
                                  borderColor: "var(--color-border)",
                                  color: "var(--color-heading)",
                                }}
                                placeholder="10-digit mobile number"
                                required
                              />
                            </div>
                          </label>
                        </div>

                        <label className="block">
                          <span className="text-xs font-semibold" style={{ color: "var(--color-muted)" }}>
                            Flat, House no., Apartment *
                          </span>
                          <input
                            value={addressLine1}
                            onChange={(e) => setAddressLine1(e.target.value)}
                            className="mt-1.5 w-full rounded-xl px-3.5 py-2.5 text-sm outline-none border focus:ring-2 focus:ring-[var(--color-accent)]"
                            style={{
                              background: "var(--color-surface)",
                              borderColor: "var(--color-border)",
                              color: "var(--color-heading)",
                            }}
                            placeholder="Flat / Building details"
                            required
                          />
                        </label>

                        <label className="block">
                          <span className="text-xs font-semibold" style={{ color: "var(--color-muted)" }}>
                            Area, Street, Landmark
                          </span>
                          <input
                            value={addressLine2}
                            onChange={(e) => setAddressLine2(e.target.value)}
                            className="mt-1.5 w-full rounded-xl px-3.5 py-2.5 text-sm outline-none border focus:ring-2 focus:ring-[var(--color-accent)]"
                            style={{
                              background: "var(--color-surface)",
                              borderColor: "var(--color-border)",
                              color: "var(--color-heading)",
                            }}
                            placeholder="Nearby landmark or area"
                          />
                        </label>

                        <div className="grid gap-4 sm:grid-cols-3">
                          <label className="block">
                            <span className="text-xs font-semibold" style={{ color: "var(--color-muted)" }}>
                              City *
                            </span>
                            <input
                              value={city}
                              onChange={(e) => setCity(e.target.value)}
                              className="mt-1.5 w-full rounded-xl px-3.5 py-2.5 text-sm outline-none border focus:ring-2 focus:ring-[var(--color-accent)]"
                              style={{
                                background: "var(--color-surface)",
                                borderColor: "var(--color-border)",
                                color: "var(--color-heading)",
                              }}
                              placeholder="e.g. Bangalore"
                              required
                            />
                          </label>
                          <label className="block">
                            <span className="text-xs font-semibold" style={{ color: "var(--color-muted)" }}>
                              State *
                            </span>
                            <select
                              value={stateValue}
                              onChange={(e) => setStateValue(e.target.value)}
                              className="mt-1.5 w-full rounded-xl px-3.5 py-2.5 text-sm outline-none border focus:ring-2 focus:ring-[var(--color-accent)] cursor-pointer"
                              style={{
                                background: "var(--color-surface)",
                                borderColor: "var(--color-border)",
                                color: "var(--color-heading)",
                              }}
                              required
                            >
                              {INDIAN_STATES.map((st) => (
                                <option key={st} value={st}>
                                  {st}
                                </option>
                              ))}
                            </select>
                          </label>
                          <label className="block">
                            <span className="text-xs font-semibold" style={{ color: "var(--color-muted)" }}>
                              PIN Code *
                            </span>
                            <input
                              type="text"
                              maxLength={6}
                              value={pincode}
                              onChange={(e) => setPincode(e.target.value.replace(/\D/g, ""))}
                              className="mt-1.5 w-full rounded-xl px-3.5 py-2.5 text-sm outline-none border focus:ring-2 focus:ring-[var(--color-accent)]"
                              style={{
                                background: "var(--color-surface)",
                                borderColor: "var(--color-border)",
                                color: "var(--color-heading)",
                              }}
                              placeholder="6-digit PIN"
                              required
                            />
                          </label>
                        </div>

                        {user && (
                          <label className="flex items-center gap-2.5 pt-2 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={saveToAddresses}
                              onChange={(e) => setSaveToAddresses(e.target.checked)}
                              className="h-4 w-4 rounded accent-[#8B5E3C] cursor-pointer"
                            />
                            <span className="text-xs font-medium">Save to My Addresses for future orders</span>
                          </label>
                        )}
                      </div>
                    )}

                    {/* Step 1 Actions */}
                    <div className="pt-4 flex justify-end">
                      <button
                        type="button"
                        onClick={handleProceedToDelivery}
                        disabled={!isAddressValid}
                        id="proceed-to-delivery-btn"
                        className="inline-flex items-center gap-2 rounded-2xl px-8 py-4 font-bold text-sm text-white shadow-md transition disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{ background: "var(--color-accent)" }}
                      >
                        Continue to Delivery Method <FiChevronRight size={16} />
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* ========================================================================= */}
                {/* STEP 2: DELIVERY METHOD */}
                {/* ========================================================================= */}
                {currentStep === 2 && (
                  <motion.div
                    key="step-2"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.3 }}
                    className="rounded-3xl p-6 sm:p-8 border shadow-sm space-y-6"
                    style={{
                      background: "var(--color-surface)",
                      borderColor: "var(--color-border)",
                    }}
                  >
                    <div className="flex items-center justify-between pb-4 border-b" style={{ borderColor: "var(--color-border)" }}>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--color-accent)] text-white text-xs font-bold">
                            2
                          </span>
                          <h2 className="text-xl font-bold font-serif">Delivery Speed & Assembly</h2>
                        </div>
                        <p className="text-xs mt-1" style={{ color: "var(--color-muted)" }}>
                          All options include doorstep transport and certified carpenter assembly.
                        </p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      {/* Standard Delivery Option */}
                      <label
                        onClick={() => setDeliverySpeed("standard")}
                        className={`flex items-start gap-4 p-5 rounded-2xl border cursor-pointer transition-all ${
                          deliverySpeed === "standard"
                            ? "border-[var(--color-accent)] ring-2 ring-[var(--color-accent)]/20 shadow-md"
                            : "border-[var(--color-border)] hover:border-[var(--color-accent)]/40"
                        }`}
                        style={{
                          background: deliverySpeed === "standard" ? "var(--color-surface-alt)" : "transparent",
                        }}
                      >
                        <input
                          type="radio"
                          name="deliverySpeed"
                          checked={deliverySpeed === "standard"}
                          onChange={() => setDeliverySpeed("standard")}
                          className="mt-1 accent-[#8B5E3C]"
                        />
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-sm text-[var(--color-heading)] flex items-center gap-2">
                              <FiTruck className="text-[var(--color-accent)]" /> Standard White-Glove Delivery
                            </span>
                            <span className="font-extrabold text-sm text-emerald-600 dark:text-emerald-400">
                              {cartTotal > 999 ? "FREE" : "₹99"}
                            </span>
                          </div>
                          <p className="text-xs text-[var(--color-muted)] mt-1">
                            Estimated delivery in <strong>3 to 5 business days</strong>. Includes free room-of-choice placement and packaging disposal.
                          </p>
                          <div className="mt-2 flex items-center gap-2 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                            <FiCheck size={13} /> Free Carpenter Assembly Included
                          </div>
                        </div>
                      </label>

                      {/* Express Priority Delivery Option */}
                      <label
                        onClick={() => setDeliverySpeed("express")}
                        className={`flex items-start gap-4 p-5 rounded-2xl border cursor-pointer transition-all ${
                          deliverySpeed === "express"
                            ? "border-[var(--color-accent)] ring-2 ring-[var(--color-accent)]/20 shadow-md"
                            : "border-[var(--color-border)] hover:border-[var(--color-accent)]/40"
                        }`}
                        style={{
                          background: deliverySpeed === "express" ? "var(--color-surface-alt)" : "transparent",
                        }}
                      >
                        <input
                          type="radio"
                          name="deliverySpeed"
                          checked={deliverySpeed === "express"}
                          onChange={() => setDeliverySpeed("express")}
                          className="mt-1 accent-[#8B5E3C]"
                        />
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-sm text-[var(--color-heading)] flex items-center gap-2">
                              <FiClock className="text-amber-500" /> Express Priority Delivery & Scheduled Setup
                            </span>
                            <span className="font-extrabold text-sm" style={{ color: "var(--color-accent)" }}>
                              ₹199
                            </span>
                          </div>
                          <p className="text-xs text-[var(--color-muted)] mt-1">
                            Guaranteed delivery in <strong>24 to 48 hours</strong> with priority evening or weekend assembly slot reservation.
                          </p>
                          <div className="mt-2 flex items-center gap-2 text-[11px] font-semibold text-amber-600 dark:text-amber-400">
                            <FiStar size={13} /> Dedicated Delivery Specialist & Fast-Track Assembly
                          </div>
                        </div>
                      </label>
                    </div>

                    {/* Delivery Instructions */}
                    <div className="pt-2">
                      <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--color-muted)" }}>
                        Delivery Instructions or Landmark Notes (Optional)
                      </label>
                      <input
                        type="text"
                        value={deliveryInstructions}
                        onChange={(e) => setDeliveryInstructions(e.target.value)}
                        placeholder="e.g. Service lift available, 4th floor, please call 30 mins before arrival"
                        className="w-full rounded-xl px-4 py-3 text-xs outline-none border transition border-[var(--color-border)] focus:border-[var(--color-accent)]"
                        style={{ background: "var(--color-surface-alt)", color: "var(--color-heading)" }}
                      />
                    </div>

                    {/* Step 2 Actions */}
                    <div className="pt-4 flex items-center justify-between border-t" style={{ borderColor: "var(--color-border)" }}>
                      <button
                        type="button"
                        onClick={() => setCurrentStep(1)}
                        className="inline-flex items-center gap-1.5 px-5 py-3 rounded-xl border text-xs font-bold transition hover:bg-[var(--color-surface-alt)]"
                        style={{ borderColor: "var(--color-border)", color: "var(--color-heading)" }}
                      >
                        <FiChevronLeft size={16} /> Back to Address
                      </button>

                      <button
                        type="button"
                        onClick={handleProceedToPayment}
                        id="proceed-to-payment-btn"
                        className="inline-flex items-center gap-2 rounded-2xl px-8 py-4 font-bold text-sm text-white shadow-md transition hover:opacity-90"
                        style={{ background: "var(--color-accent)" }}
                      >
                        Continue to Payment <FiChevronRight size={16} />
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* ========================================================================= */}
                {/* STEP 3: PAYMENT METHOD */}
                {/* ========================================================================= */}
                {currentStep === 3 && (
                  <motion.div
                    key="step-3"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.3 }}
                    className="rounded-3xl p-6 sm:p-8 border shadow-sm space-y-6"
                    style={{
                      background: "var(--color-surface)",
                      borderColor: "var(--color-border)",
                    }}
                  >
                    <div className="flex items-center justify-between pb-4 border-b" style={{ borderColor: "var(--color-border)" }}>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--color-accent)] text-white text-xs font-bold">
                            3
                          </span>
                          <h2 className="text-xl font-bold font-serif">Payment Method</h2>
                        </div>
                        <p className="text-xs mt-1" style={{ color: "var(--color-muted)" }}>
                          Choose your preferred payment gateway. All transactions are encrypted.
                        </p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      {/* Razorpay Online Option */}
                      <label
                        onClick={() => setPaymentMethod("ONLINE")}
                        className={`flex items-start gap-4 p-5 rounded-2xl border cursor-pointer transition-all ${
                          paymentMethod === "ONLINE"
                            ? "border-[var(--color-accent)] ring-2 ring-[var(--color-accent)]/20 shadow-md"
                            : "border-[var(--color-border)] hover:border-[var(--color-accent)]/40"
                        }`}
                        style={{
                          background: paymentMethod === "ONLINE" ? "var(--color-surface-alt)" : "transparent",
                        }}
                      >
                        <input
                          type="radio"
                          name="payment"
                          value="ONLINE"
                          checked={paymentMethod === "ONLINE"}
                          onChange={() => setPaymentMethod("ONLINE")}
                          className="mt-1 accent-[#8B5E3C]"
                        />
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-sm text-[var(--color-heading)] flex items-center gap-2">
                              <FiCreditCard className="text-[var(--color-accent)]" /> Online Payment (Razorpay Secure)
                            </span>
                            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600">
                              Instant & Safe
                            </span>
                          </div>
                          <p className="text-xs text-[var(--color-muted)] mt-1">
                            Pay securely via <strong>UPI (GPay, PhonePe, Paytm), Debit/Credit Cards, Net Banking, or EMI</strong>.
                          </p>
                          <div className="mt-2.5 flex items-center gap-3 text-[11px] text-[var(--color-muted)]">
                            <span className="flex items-center gap-1"><FiShield className="text-emerald-500" /> Razorpay Verified</span>
                            <span className="flex items-center gap-1"><FiLock className="text-emerald-500" /> 256-Bit SSL</span>
                          </div>
                        </div>
                      </label>

                      {/* Cash on Delivery Option */}
                      <label
                        onClick={() => setPaymentMethod("COD")}
                        className={`flex items-start gap-4 p-5 rounded-2xl border cursor-pointer transition-all ${
                          paymentMethod === "COD"
                            ? "border-[var(--color-accent)] ring-2 ring-[var(--color-accent)]/20 shadow-md"
                            : "border-[var(--color-border)] hover:border-[var(--color-accent)]/40"
                        }`}
                        style={{
                          background: paymentMethod === "COD" ? "var(--color-surface-alt)" : "transparent",
                        }}
                      >
                        <input
                          type="radio"
                          name="payment"
                          value="COD"
                          checked={paymentMethod === "COD"}
                          onChange={() => setPaymentMethod("COD")}
                          className="mt-1 accent-[#8B5E3C]"
                        />
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-sm text-[var(--color-heading)] flex items-center gap-2">
                              <FiDollarSign className="text-emerald-600" /> Cash on Delivery (COD)
                            </span>
                            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600">
                              Pay on Delivery
                            </span>
                          </div>
                          <p className="text-xs text-[var(--color-muted)] mt-1">
                            Inspect your handcrafted furniture upon delivery and pay via cash or UPI to the delivery executive.
                          </p>
                        </div>
                      </label>
                    </div>

                    {/* Step 3 Actions */}
                    <div className="pt-4 flex items-center justify-between border-t" style={{ borderColor: "var(--color-border)" }}>
                      <button
                        type="button"
                        onClick={() => setCurrentStep(2)}
                        className="inline-flex items-center gap-1.5 px-5 py-3 rounded-xl border text-xs font-bold transition hover:bg-[var(--color-surface-alt)]"
                        style={{ borderColor: "var(--color-border)", color: "var(--color-heading)" }}
                      >
                        <FiChevronLeft size={16} /> Back to Delivery
                      </button>

                      <button
                        type="button"
                        onClick={handleProceedToReview}
                        id="proceed-to-review-btn"
                        className="inline-flex items-center gap-2 rounded-2xl px-8 py-4 font-bold text-sm text-white shadow-md transition hover:opacity-90"
                        style={{ background: "var(--color-accent)" }}
                      >
                        Continue to Order Review <FiChevronRight size={16} />
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* ========================================================================= */}
                {/* STEP 4: ORDER REVIEW & CONFIRMATION */}
                {/* ========================================================================= */}
                {currentStep === 4 && (
                  <motion.div
                    key="step-4"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.3 }}
                    className="rounded-3xl p-6 sm:p-8 border shadow-sm space-y-6"
                    style={{
                      background: "var(--color-surface)",
                      borderColor: "var(--color-border)",
                    }}
                  >
                    <div className="flex items-center justify-between pb-4 border-b" style={{ borderColor: "var(--color-border)" }}>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--color-accent)] text-white text-xs font-bold">
                            4
                          </span>
                          <h2 className="text-xl font-bold font-serif">Final Order Review</h2>
                        </div>
                        <p className="text-xs mt-1" style={{ color: "var(--color-muted)" }}>
                          Please review your order details before confirming purchase.
                        </p>
                      </div>
                    </div>

                    {/* Review Info Cards Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {/* Address Card */}
                      <div
                        className="rounded-2xl p-4 border relative"
                        style={{ background: "var(--color-surface-alt)", borderColor: "var(--color-border)" }}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs font-bold text-[var(--color-accent)] flex items-center gap-1">
                            <FiMapPin size={12} /> Delivery To
                          </span>
                          <button
                            type="button"
                            onClick={() => setCurrentStep(1)}
                            className="text-[11px] font-bold text-[var(--color-muted)] hover:text-[var(--color-accent)] underline"
                          >
                            Change
                          </button>
                        </div>
                        <p className="font-bold text-xs text-[var(--color-heading)] truncate">{fullName}</p>
                        <p className="text-[11px] text-[var(--color-muted)] mt-0.5">+91 {phone}</p>
                        <p className="text-[11px] text-[var(--color-body)] mt-1 line-clamp-2 leading-relaxed">
                          {addressLine1}, {city}, {stateValue} – {pincode}
                        </p>
                      </div>

                      {/* Delivery Method Card */}
                      <div
                        className="rounded-2xl p-4 border relative"
                        style={{ background: "var(--color-surface-alt)", borderColor: "var(--color-border)" }}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs font-bold text-[var(--color-accent)] flex items-center gap-1">
                            <FiTruck size={12} /> Shipping
                          </span>
                          <button
                            type="button"
                            onClick={() => setCurrentStep(2)}
                            className="text-[11px] font-bold text-[var(--color-muted)] hover:text-[var(--color-accent)] underline"
                          >
                            Change
                          </button>
                        </div>
                        <p className="font-bold text-xs text-[var(--color-heading)]">
                          {deliverySpeed === "express" ? "Express Priority (24-48h)" : "Standard White-Glove (3-5d)"}
                        </p>
                        <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1">
                          Free Carpenter Assembly
                        </p>
                      </div>

                      {/* Payment Method Card */}
                      <div
                        className="rounded-2xl p-4 border relative"
                        style={{ background: "var(--color-surface-alt)", borderColor: "var(--color-border)" }}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs font-bold text-[var(--color-accent)] flex items-center gap-1">
                            <FiCreditCard size={12} /> Payment
                          </span>
                          <button
                            type="button"
                            onClick={() => setCurrentStep(3)}
                            className="text-[11px] font-bold text-[var(--color-muted)] hover:text-[var(--color-accent)] underline"
                          >
                            Change
                          </button>
                        </div>
                        <p className="font-bold text-xs text-[var(--color-heading)]">
                          {paymentMethod === "ONLINE" ? "Razorpay Online (UPI/Cards)" : "Cash on Delivery (COD)"}
                        </p>
                        <p className="text-[11px] text-[var(--color-muted)] mt-1">
                          {paymentMethod === "ONLINE" ? "256-Bit Encrypted" : "Pay at Doorstep"}
                        </p>
                      </div>
                    </div>

                    {/* Product Items Table Review */}
                    <div className="rounded-2xl border overflow-hidden" style={{ borderColor: "var(--color-border)" }}>
                      <div className="px-4 py-3 bg-[var(--color-surface-alt)] border-b flex items-center justify-between text-xs font-bold uppercase tracking-wider" style={{ borderColor: "var(--color-border)", color: "var(--color-muted)" }}>
                        <span>Items in Order ({cart.reduce((s, i) => s + i.quantity, 0)})</span>
                        <span>Line Total</span>
                      </div>

                      <div className="divide-y max-h-80 overflow-y-auto" style={{ borderColor: "var(--color-border)" }}>
                        {cart.map((item) => (
                          <div
                            key={item.id}
                            className="p-4 flex items-center justify-between gap-4 text-sm"
                            style={{ background: "var(--color-surface)" }}
                          >
                            <div className="flex items-center gap-3">
                              {item.image && (
                                <img
                                  src={item.image}
                                  alt={item.name}
                                  className="h-12 w-12 rounded-xl object-cover border"
                                  style={{ borderColor: "var(--color-border)" }}
                                />
                              )}
                              <div>
                                <p className="font-bold text-xs sm:text-sm text-[var(--color-heading)]">{item.name}</p>
                                <p className="text-xs mt-0.5" style={{ color: "var(--color-muted)" }}>
                                  ₹{item.price?.toLocaleString("en-IN")} × {item.quantity} {item.quantity === 1 ? "unit" : "units"}
                                </p>
                              </div>
                            </div>

                            <p className="font-bold text-sm text-[var(--color-heading)] shrink-0">
                              ₹{(item.price * item.quantity).toLocaleString("en-IN")}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Terms Confirmation Checkbox */}
                    <div className="rounded-2xl p-4 border" style={{ background: "var(--color-surface-alt)", borderColor: "var(--color-border)" }}>
                      <label className="flex items-start gap-3 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={termsAgreed}
                          onChange={(e) => setTermsAgreed(e.target.checked)}
                          id="checkout-terms-checkbox"
                          className="mt-0.5 h-4 w-4 rounded accent-[#8B5E3C] cursor-pointer shrink-0"
                        />
                        <span className="text-xs leading-relaxed" style={{ color: "var(--color-body)" }}>
                          I have reviewed the delivery location, items, and total amount. I agree to Furniva's{" "}
                          <Link to="/warranty-returns" target="_blank" className="font-bold text-[var(--color-accent)] hover:underline">
                            Terms of Service
                          </Link>
                          , 10-Year Craftsmanship Warranty, and 7-Day Hassle-Free Return Policy.
                        </span>
                      </label>
                    </div>

                    {error && (
                      <div
                        className="rounded-2xl p-4 text-sm font-medium border flex items-center gap-2"
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

                    {/* Step 4 Actions */}
                    <div className="pt-4 flex items-center justify-between border-t" style={{ borderColor: "var(--color-border)" }}>
                      <button
                        type="button"
                        onClick={() => setCurrentStep(3)}
                        className="inline-flex items-center gap-1.5 px-5 py-3 rounded-xl border text-xs font-bold transition hover:bg-[var(--color-surface-alt)]"
                        style={{ borderColor: "var(--color-border)", color: "var(--color-heading)" }}
                      >
                        <FiChevronLeft size={16} /> Back to Payment
                      </button>

                      <button
                        type="button"
                        onClick={handlePlaceOrder}
                        disabled={!termsAgreed || isSubmitting}
                        id="checkout-final-place-order-btn"
                        className="inline-flex items-center justify-center gap-2 rounded-2xl px-10 py-4 font-bold text-sm sm:text-base text-white shadow-xl transition disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-95"
                        style={{ background: "var(--color-accent)" }}
                      >
                        {isSubmitting ? (
                          "Processing Purchase..."
                        ) : paymentMethod === "ONLINE" ? (
                          <>Pay Now via Razorpay (₹{displayTotalAmount.toLocaleString("en-IN")})</>
                        ) : (
                          <>Place Order on COD (₹{displayTotalAmount.toLocaleString("en-IN")})</>
                        )}
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Sidebar: Order Summary & Coupon Breakdown */}
            <aside
              className="rounded-3xl p-6 sm:p-8 border lg:sticky lg:top-24 h-fit shadow-sm space-y-6"
              style={{
                background: "var(--color-surface)",
                borderColor: "var(--color-border)",
              }}
            >
              <h2 className="text-xl font-serif font-bold">Order Summary</h2>

              {/* Coupon Box */}
              <div
                className="rounded-2xl p-4 border space-y-3"
                style={{
                  background: "var(--color-surface-alt)",
                  borderColor: "var(--color-border)",
                }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-muted)] flex items-center gap-1.5">
                    <FiTag /> Have a Coupon?
                  </span>
                  {appliedCouponCode && (
                    <button
                      onClick={handleRemoveCoupon}
                      className="text-[11px] font-bold text-red-500 hover:underline flex items-center gap-1"
                    >
                      <FiX size={12} /> Remove
                    </button>
                  )}
                </div>

                {!appliedCouponCode ? (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                      placeholder="e.g. SAVE10"
                      className="flex-1 rounded-xl px-3 py-2 text-xs outline-none border transition border-[var(--color-border)] focus:border-[var(--color-accent)]"
                      style={{ background: "var(--color-surface)", color: "var(--color-heading)" }}
                    />
                    <button
                      type="button"
                      onClick={() => handleApplyCoupon(couponInput)}
                      disabled={isApplyingCoupon || !couponInput.trim()}
                      className="px-4 py-2 rounded-xl text-xs font-bold text-white transition disabled:opacity-50"
                      style={{ background: "var(--color-accent)" }}
                    >
                      {isApplyingCoupon ? "..." : "Apply"}
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between rounded-xl p-2.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold">
                    <span className="flex items-center gap-1.5">
                      <FiCheckCircle size={14} /> {appliedCouponCode} Active
                    </span>
                    <span>-₹{displayDiscount.toLocaleString("en-IN")}</span>
                  </div>
                )}

                {couponError && <p className="text-[11px] text-red-500">{couponError}</p>}
                {couponSuccess && <p className="text-[11px] text-emerald-600 dark:text-emerald-400">{couponSuccess}</p>}

                {/* Available Public Coupon Chips */}
                {availableCoupons.length > 0 && !appliedCouponCode && (
                  <div className="pt-2 border-t" style={{ borderColor: "var(--color-border)" }}>
                    <p className="text-[10px] uppercase font-bold text-[var(--color-muted)] mb-1.5">
                      Available Offers
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {availableCoupons.map((c) => (
                        <button
                          key={c.code}
                          type="button"
                          onClick={() => {
                            setCouponInput(c.code);
                            handleApplyCoupon(c.code);
                          }}
                          className="px-2 py-1 rounded-lg border text-[11px] font-bold text-[var(--color-accent)] border-[var(--color-accent)]/30 hover:bg-[var(--color-accent)]/10 transition"
                        >
                          {c.code}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Price Calculation Breakdown */}
              <div
                className="space-y-3 rounded-2xl p-4 text-xs sm:text-sm border"
                style={{
                  background: "var(--color-surface-alt)",
                  borderColor: "var(--color-border)",
                }}
              >
                <div className="flex justify-between" style={{ color: "var(--color-muted)" }}>
                  <span>Furniture Subtotal</span>
                  <span className="font-semibold" style={{ color: "var(--color-heading)" }}>
                    ₹{displayItemsTotal.toLocaleString("en-IN")}
                  </span>
                </div>

                {displayDiscount > 0 && (
                  <div className="flex justify-between font-semibold text-emerald-600 dark:text-emerald-400">
                    <span>Coupon Discount ({appliedCouponCode})</span>
                    <span>-₹{displayDiscount.toLocaleString("en-IN")}</span>
                  </div>
                )}

                <div className="flex justify-between" style={{ color: "var(--color-muted)" }}>
                  <span>
                    Delivery ({deliverySpeed === "express" ? "Express" : "Standard"})
                  </span>
                  <span className={`font-semibold ${displayDeliveryFee === 0 ? "text-emerald-600 dark:text-emerald-400" : ""}`}>
                    {displayDeliveryFee === 0 ? "FREE" : `₹${displayDeliveryFee.toLocaleString("en-IN")}`}
                  </span>
                </div>

                <div className="flex justify-between" style={{ color: "var(--color-muted)" }}>
                  <span>In-Home Assembly by Carpenter</span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">FREE</span>
                </div>

                <div className="flex justify-between text-[11px]" style={{ color: "var(--color-muted)" }}>
                  <span>Taxes & GST</span>
                  <span>Included</span>
                </div>

                {displayTotalSavings > 0 && (
                  <div className="rounded-xl p-2.5 bg-emerald-500/10 border border-emerald-500/25 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center justify-between">
                    <span>Total Savings on Order</span>
                    <span>₹{displayTotalSavings.toLocaleString("en-IN")}</span>
                  </div>
                )}

                <div
                  className="border-t pt-3 text-base font-bold flex justify-between items-center"
                  style={{ borderColor: "var(--color-border)", color: "var(--color-heading)" }}
                >
                  <div>
                    <span>Total Amount</span>
                    <p className="text-[10px] font-normal" style={{ color: "var(--color-muted)" }}>
                      All taxes & assembly included
                    </p>
                  </div>
                  <span className="text-2xl font-extrabold" style={{ color: "var(--color-accent)" }}>
                    ₹{displayTotalAmount.toLocaleString("en-IN")}
                  </span>
                </div>
              </div>

              {/* Safe Shopping Guarantee Note */}
              <div className="space-y-2 text-xs" style={{ color: "var(--color-muted)" }}>
                <p className="flex items-center gap-2">
                  <FiCheckCircle className="text-emerald-500 shrink-0" /> 10-Year Solid Craftsmanship Warranty
                </p>
                <p className="flex items-center gap-2">
                  <FiCheckCircle className="text-emerald-500 shrink-0" /> 7-Day Hassle-Free Return Policy
                </p>
                <p className="flex items-center gap-2">
                  <FiCheckCircle className="text-emerald-500 shrink-0" /> Free Carpenter Assembly at Delivery
                </p>
              </div>
            </aside>
          </div>
        </div>
      </main>

      {/* In-Place Address Modal */}
      <AddressFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingAddress(null);
        }}
        onSubmit={handleModalSaveAddress}
        initialData={editingAddress}
        title={editingAddress ? "Edit Delivery Address" : "Add Delivery Address"}
      />

      <Footer />
    </>
  );
}

export default Checkout;
