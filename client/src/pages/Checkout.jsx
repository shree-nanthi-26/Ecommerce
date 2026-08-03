import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";
import { createOrder } from "../services/orderService";
import { createPaymentOrder, verifyPayment } from "../services/paymentService";

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
      setError("Please complete all required fields.");
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
        name: "ElectroMart",
        description: "Complete your payment",
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
          color: "#10B981",
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
      <Navbar />
      <main className="min-h-screen bg-[#0F1115] px-6 py-14 text-white">
        <div className="mx-auto max-w-[1500px]">
          <div className="mb-10">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-green-400">
              Checkout
            </p>
            <h1 className="mt-2 text-4xl font-bold">Shipping & Payment</h1>
          </div>

          <div className="grid gap-8 lg:grid-cols-3">
            <form
              className="lg:col-span-2 rounded-3xl border border-[#2D333D] bg-[#1D222C] p-8"
              onSubmit={handleSubmit}
            >
              <div className="grid gap-5 sm:grid-cols-2">
                <label className="block">
                  <span className="text-sm font-semibold text-[#B8BEC9]">Full Name</span>
                  <input
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="mt-2 w-full rounded-2xl border border-[#2D333D] bg-[#1D222C] px-4 py-3 text-white outline-none"
                    required
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-semibold text-[#B8BEC9]">Phone</span>
                  <input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="mt-2 w-full rounded-2xl border border-[#2D333D] bg-[#1D222C] px-4 py-3 text-white outline-none"
                    required
                  />
                </label>
              </div>

              <div className="mt-5 space-y-5">
                <label className="block">
                  <span className="text-sm font-semibold text-[#B8BEC9]">Address Line 1</span>
                  <input
                    value={addressLine1}
                    onChange={(e) => setAddressLine1(e.target.value)}
                    className="mt-2 w-full rounded-2xl border border-[#2D333D] bg-[#1D222C] px-4 py-3 text-white outline-none"
                    required
                  />
                </label>

                <label className="block">
                  <span className="text-sm font-semibold text-[#B8BEC9]">Address Line 2</span>
                  <input
                    value={addressLine2}
                    onChange={(e) => setAddressLine2(e.target.value)}
                    className="mt-2 w-full rounded-2xl border border-[#2D333D] bg-[#1D222C] px-4 py-3 text-white outline-none"
                  />
                </label>

                <div className="grid gap-5 sm:grid-cols-3">
                  <label className="block">
                    <span className="text-sm font-semibold text-[#B8BEC9]">City</span>
                    <input
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="mt-2 w-full rounded-2xl border border-[#2D333D] bg-[#1D222C] px-4 py-3 text-white outline-none"
                      required
                    />
                  </label>
                  <label className="block">
                    <span className="text-sm font-semibold text-[#B8BEC9]">State</span>
                    <input
                      value={stateValue}
                      onChange={(e) => setStateValue(e.target.value)}
                      className="mt-2 w-full rounded-2xl border border-[#2D333D] bg-[#1D222C] px-4 py-3 text-white outline-none"
                      required
                    />
                  </label>
                  <label className="block">
                    <span className="text-sm font-semibold text-[#B8BEC9]">Pincode</span>
                    <input
                      value={pincode}
                      onChange={(e) => setPincode(e.target.value)}
                      className="mt-2 w-full rounded-2xl border border-[#2D333D] bg-[#1D222C] px-4 py-3 text-white outline-none"
                      required
                    />
                  </label>
                </div>
              </div>

              <div className="mt-8 rounded-3xl border border-[#2D333D] bg-[#0F1115] p-6">
                <h2 className="text-xl font-semibold">Payment Method</h2>
                <div className="mt-4 space-y-3">
                  <label className="flex items-center gap-3 rounded-2xl border border-[#2D333D] bg-[#1D222C] px-4 py-3">
                    <input
                      type="radio"
                      name="payment"
                      value="COD"
                      checked={paymentMethod === "COD"}
                      onChange={() => setPaymentMethod("COD")}
                    />
                    <span>Cash on Delivery</span>
                  </label>
                  <label className="flex items-center gap-3 rounded-2xl border border-[#2D333D] bg-[#1D222C] px-4 py-3">
                    <input
                      type="radio"
                      name="payment"
                      value="ONLINE"
                      checked={paymentMethod === "ONLINE"}
                      onChange={() => setPaymentMethod("ONLINE")}
                    />
                    <span>Online Payment</span>
                  </label>
                </div>
              </div>

              {error && (
                <div className="mt-6 rounded-2xl bg-red-500/10 px-4 py-3 text-sm text-red-200">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={!isFormValid || isSubmitting}
                className="mt-6 w-full rounded-2xl bg-green-500 px-4 py-3 text-white font-semibold transition hover:bg-green-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSubmitting ? "Placing order..." : "Place Order"}
              </button>
            </form>

            <aside className="rounded-3xl border border-[#2D333D] bg-[#1D222C] p-8 lg:sticky lg:top-24">
              <h2 className="text-2xl font-semibold">Order Summary</h2>
              <div className="mt-6 space-y-4">
                {cart.map((item) => (
                  <div key={item.id} className="rounded-2xl border border-[#2D333D] bg-[#0F1115] p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="font-semibold text-white">{item.name}</p>
                        <p className="mt-1 text-sm text-[#B8BEC9]">Qty: {item.quantity}</p>
                      </div>
                      <p className="font-semibold text-white">₹{(item.price * item.quantity).toLocaleString("en-IN")}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 space-y-3 rounded-2xl border border-[#2D333D] bg-[#0F1115] p-4 text-sm text-[#B8BEC9]">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="text-white">₹{cartTotal.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between">
                  <span>Delivery Fee</span>
                  <span className="text-white">{deliveryFee === 0 ? "Free" : `₹${deliveryFee.toLocaleString("en-IN")}`}</span>
                </div>
                <div className="border-t border-[#2D333D] pt-4 text-lg font-semibold text-white">
                  <div className="flex justify-between">
                    <span>Total</span>
                    <span>₹{totalAmount.toLocaleString("en-IN")}</span>
                  </div>
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
