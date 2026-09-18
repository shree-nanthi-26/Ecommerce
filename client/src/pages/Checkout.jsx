import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";
import { createOrder } from "../services/orderService";
import { createPaymentOrder, verifyPayment } from "../services/paymentService";
import { FiShield, FiTruck } from "react-icons/fi";

function Checkout() {
  const { cart, cartTotal, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [addressLine1, setAddressLine1] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [city, setCity] = useState("");
  const [stateValue, setStateValue] = useState("");
  const [pincode, setPincode] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("COD");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (cart.length === 0) {
      navigate("/cart");
    }
  }, [cart, navigate]);

  const deliveryFee = useMemo(() => (cartTotal > 999 ? 0 : 99), [cartTotal]);
  const totalAmount = cartTotal + deliveryFee;

  const isFormValid =
    fullName &&
    phone &&
    addressLine1 &&
    city &&
    stateValue &&
    pincode;

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!isFormValid) {
      setError("Please complete all required shipping fields.");
      return;
    }

    const orderData = {
      items: cart.map((item) => ({
        product: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
      })),
      shippingAddress: {
        fullName,
        phone,
        addressLine1,
        addressLine2,
        city,
        state: stateValue,
        pincode,
      },
    };

    try {
      setIsSubmitting(true);

      if (paymentMethod === "ONLINE") {
        const paymentOrder = await createPaymentOrder(totalAmount);
        const order = await openRazorpayCheckout(paymentOrder, {
          ...orderData,
          paymentMethod,
        });
        await clearCart();
        navigate(`/order-confirmation/${order._id}`);
      } else {
        const order = await createOrder({ ...orderData, paymentMethod });
        await clearCart();
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
        reject(new Error("Razorpay SDK failed to load. Refresh and try again."));
        return;
      }

      const options = {
        key: paymentOrder.keyId,
        amount: paymentOrder.amount,
        currency: paymentOrder.currency,
        name: "Furniva",
        description: "Complete your Furniva furniture purchase",
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
            reject(new Error("Payment was cancelled. Please try again."));
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

  return (
    <>
      <Helmet>
        <title>Secure Checkout – Furniva</title>
      </Helmet>
      <Navbar />
      <main
        className="min-h-screen px-4 sm:px-8 py-14"
        style={{ background: "var(--color-bg)", color: "var(--color-heading)" }}
      >
        <div className="mx-auto max-w-[1500px]">
          <div className="mb-10">
            <p
              className="text-sm font-semibold uppercase tracking-[0.3em]"
              style={{ color: "var(--color-accent)" }}
            >
              Secure Order
            </p>
            <h1 className="mt-2 text-4xl font-serif font-bold tracking-tight">
              Shipping & Payment
            </h1>
            <p className="mt-1 text-sm" style={{ color: "var(--color-muted)" }}>
              All orders include free white-glove delivery and professional in-home assembly.
            </p>
          </div>

          <div className="grid gap-8 lg:grid-cols-3">
            <form
              className="lg:col-span-2 rounded-3xl p-8 border shadow-sm"
              style={{
                background: "var(--color-surface)",
                borderColor: "var(--color-border)",
              }}
              onSubmit={handleSubmit}
            >
              <h2 className="text-xl font-bold mb-6">Delivery Address</h2>

              <div className="grid gap-5 sm:grid-cols-2">
                <label className="block">
                  <span className="text-sm font-semibold" style={{ color: "var(--color-muted)" }}>Full Name *</span>
                  <input
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="mt-2 w-full rounded-2xl px-4 py-3 outline-none border focus:ring-2 focus:ring-[var(--color-accent)]"
                    style={{
                      background: "var(--color-surface-alt)",
                      borderColor: "var(--color-border)",
                      color: "var(--color-heading)",
                    }}
                    placeholder="Enter your full name"
                    required
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-semibold" style={{ color: "var(--color-muted)" }}>Phone Number *</span>
                  <input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="mt-2 w-full rounded-2xl px-4 py-3 outline-none border focus:ring-2 focus:ring-[var(--color-accent)]"
                    style={{
                      background: "var(--color-surface-alt)",
                      borderColor: "var(--color-border)",
                      color: "var(--color-heading)",
                    }}
                    placeholder="10-digit mobile number"
                    required
                  />
                </label>
              </div>

              <div className="mt-5 space-y-5">
                <label className="block">
                  <span className="text-sm font-semibold" style={{ color: "var(--color-muted)" }}>Flat, House no., Apartment *</span>
                  <input
                    value={addressLine1}
                    onChange={(e) => setAddressLine1(e.target.value)}
                    className="mt-2 w-full rounded-2xl px-4 py-3 outline-none border focus:ring-2 focus:ring-[var(--color-accent)]"
                    style={{
                      background: "var(--color-surface-alt)",
                      borderColor: "var(--color-border)",
                      color: "var(--color-heading)",
                    }}
                    placeholder="House / Apartment / Building details"
                    required
                  />
                </label>

                <label className="block">
                  <span className="text-sm font-semibold" style={{ color: "var(--color-muted)" }}>Area, Street, Landmark</span>
                  <input
                    value={addressLine2}
                    onChange={(e) => setAddressLine2(e.target.value)}
                    className="mt-2 w-full rounded-2xl px-4 py-3 outline-none border focus:ring-2 focus:ring-[var(--color-accent)]"
                    style={{
                      background: "var(--color-surface-alt)",
                      borderColor: "var(--color-border)",
                      color: "var(--color-heading)",
                    }}
                    placeholder="Area or nearby landmark"
                  />
                </label>

                <div className="grid gap-5 sm:grid-cols-3">
                  <label className="block">
                    <span className="text-sm font-semibold" style={{ color: "var(--color-muted)" }}>City *</span>
                    <input
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="mt-2 w-full rounded-2xl px-4 py-3 outline-none border focus:ring-2 focus:ring-[var(--color-accent)]"
                      style={{
                        background: "var(--color-surface-alt)",
                        borderColor: "var(--color-border)",
                        color: "var(--color-heading)",
                      }}
                      placeholder="e.g. Bangalore"
                      required
                    />
                  </label>
                  <label className="block">
                    <span className="text-sm font-semibold" style={{ color: "var(--color-muted)" }}>State *</span>
                    <input
                      value={stateValue}
                      onChange={(e) => setStateValue(e.target.value)}
                      className="mt-2 w-full rounded-2xl px-4 py-3 outline-none border focus:ring-2 focus:ring-[var(--color-accent)]"
                      style={{
                        background: "var(--color-surface-alt)",
                        borderColor: "var(--color-border)",
                        color: "var(--color-heading)",
                      }}
                      placeholder="e.g. Karnataka"
                      required
                    />
                  </label>
                  <label className="block">
                    <span className="text-sm font-semibold" style={{ color: "var(--color-muted)" }}>Pincode *</span>
                    <input
                      value={pincode}
                      onChange={(e) => setPincode(e.target.value)}
                      className="mt-2 w-full rounded-2xl px-4 py-3 outline-none border focus:ring-2 focus:ring-[var(--color-accent)]"
                      style={{
                        background: "var(--color-surface-alt)",
                        borderColor: "var(--color-border)",
                        color: "var(--color-heading)",
                      }}
                      placeholder="6-digit pincode"
                      required
                    />
                  </label>
                </div>
              </div>

              <div
                className="mt-8 rounded-2xl p-6 border"
                style={{
                  background: "var(--color-surface-alt)",
                  borderColor: "var(--color-border)",
                }}
              >
                <h3 className="text-lg font-bold">Select Payment Option</h3>
                <div className="mt-4 space-y-3">
                  <label
                    className="flex items-center gap-3 rounded-xl p-4 border cursor-pointer transition hover:border-[var(--color-accent)]"
                    style={{
                      background: "var(--color-surface)",
                      borderColor: paymentMethod === "ONLINE" ? "var(--color-accent)" : "var(--color-border)",
                    }}
                  >
                    <input
                      type="radio"
                      name="payment"
                      value="ONLINE"
                      checked={paymentMethod === "ONLINE"}
                      onChange={() => setPaymentMethod("ONLINE")}
                      className="accent-[#8B5E3C]"
                    />
                    <div className="flex-1">
                      <span className="font-semibold text-sm">Online Payment (UPI, Cards, Net Banking)</span>
                      <p className="text-xs mt-0.5" style={{ color: "var(--color-muted)" }}>
                        Safe and instant payment powered by Razorpay.
                      </p>
                    </div>
                  </label>

                  <label
                    className="flex items-center gap-3 rounded-xl p-4 border cursor-pointer transition hover:border-[var(--color-accent)]"
                    style={{
                      background: "var(--color-surface)",
                      borderColor: paymentMethod === "COD" ? "var(--color-accent)" : "var(--color-border)",
                    }}
                  >
                    <input
                      type="radio"
                      name="payment"
                      value="COD"
                      checked={paymentMethod === "COD"}
                      onChange={() => setPaymentMethod("COD")}
                      className="accent-[#8B5E3C]"
                    />
                    <div className="flex-1">
                      <span className="font-semibold text-sm">Cash on Delivery</span>
                      <p className="text-xs mt-0.5" style={{ color: "var(--color-muted)" }}>
                        Pay cash or UPI upon delivery and inspection.
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              {error && (
                <div
                  className="mt-6 rounded-2xl p-4 text-sm font-medium border"
                  style={{
                    background: "rgba(239, 68, 68, 0.1)",
                    borderColor: "rgba(239, 68, 68, 0.2)",
                    color: "var(--color-danger)",
                  }}
                >
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={!isFormValid || isSubmitting}
                className="mt-6 w-full rounded-2xl px-6 py-4 font-bold text-white transition disabled:cursor-not-allowed disabled:opacity-50 shadow-md"
                style={{
                  background: "var(--color-accent)",
                }}
              >
                {isSubmitting ? "Processing Order..." : `Place Order (₹${totalAmount.toLocaleString("en-IN")})`}
              </button>

              <div className="mt-4 flex items-center justify-center gap-6 text-xs" style={{ color: "var(--color-muted)" }}>
                <span className="flex items-center gap-1.5"><FiShield /> 256-Bit Encrypted Checkout</span>
                <span className="flex items-center gap-1.5"><FiTruck /> Safe Furniture Transit</span>
              </div>
            </form>

            <aside
              className="rounded-3xl p-8 border lg:sticky lg:top-24 h-fit shadow-sm"
              style={{
                background: "var(--color-surface)",
                borderColor: "var(--color-border)",
              }}
            >
              <h2 className="text-xl font-serif font-bold">Order Summary</h2>
              <div className="mt-6 space-y-4 max-h-72 overflow-y-auto pr-1">
                {cart.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-xl p-3 border flex items-center justify-between gap-4 text-sm"
                    style={{
                      background: "var(--color-surface-alt)",
                      borderColor: "var(--color-border)",
                    }}
                  >
                    <div className="truncate pr-2">
                      <p className="font-semibold truncate">{item.name}</p>
                      <p className="text-xs" style={{ color: "var(--color-muted)" }}>Qty: {item.quantity}</p>
                    </div>
                    <p className="font-bold shrink-0">₹{(item.price * item.quantity).toLocaleString("en-IN")}</p>
                  </div>
                ))}
              </div>

              <div
                className="mt-6 space-y-3 rounded-2xl p-4 text-sm border"
                style={{
                  background: "var(--color-surface-alt)",
                  borderColor: "var(--color-border)",
                }}
              >
                <div className="flex justify-between" style={{ color: "var(--color-muted)" }}>
                  <span>Furniture Total</span>
                  <span className="font-semibold" style={{ color: "var(--color-heading)" }}>₹{cartTotal.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between" style={{ color: "var(--color-muted)" }}>
                  <span>White-Glove Delivery</span>
                  <span className="font-semibold text-emerald-600">{deliveryFee === 0 ? "FREE" : `₹${deliveryFee.toLocaleString("en-IN")}`}</span>
                </div>
                <div className="flex justify-between" style={{ color: "var(--color-muted)" }}>
                  <span>Assembly by Carpenter</span>
                  <span className="font-semibold text-emerald-600">FREE</span>
                </div>
                <div className="border-t pt-3 text-base font-bold flex justify-between" style={{ borderColor: "var(--color-border)", color: "var(--color-heading)" }}>
                  <span>Total Amount</span>
                  <span className="text-xl font-extrabold" style={{ color: "var(--color-accent)" }}>₹{totalAmount.toLocaleString("en-IN")}</span>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

export default Checkout;
