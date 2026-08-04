import { Link, useNavigate } from "react-router-dom";
import { FiMinus, FiPlus, FiTrash2, FiShoppingBag, FiArrowRight } from "react-icons/fi";
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";
import { useCart } from "../context/CartContext";

const formatPrice = (value) => `₹${value.toLocaleString("en-IN")}`;

function Cart() {
  const { cart, updateQuantity, removeFromCart, cartTotal } = useCart();
  const navigate = useNavigate();
  const delivery = cartTotal > 999 ? "Free" : formatPrice(99);

  return (
    <>
      <Navbar />
      <main className="min-h-screen px-8 py-16 transition-colors duration-300" style={{ background: "var(--color-bg)", color: "var(--color-body)" }}>
        <div className="mx-auto max-w-[1500px]">
          <div className="mb-10">
            <p className="text-sm font-semibold uppercase tracking-[0.3em]" style={{ color: "var(--color-accent)" }}>
              Your Basket
            </p>
            <h1 className="mt-2 text-4xl font-bold" style={{ color: "var(--color-heading)" }}>Cart</h1>
          </div>

          {cart.length === 0 ? (
            <div className="flex min-h-[420px] flex-col items-center justify-center rounded-3xl border px-6 text-center shadow-sm" style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}>
              <div className="w-20 h-20 flex items-center justify-center rounded-full mb-6" style={{ background: "var(--color-surface-alt)" }}>
                <FiShoppingBag size={32} style={{ color: "var(--color-muted)" }} />
              </div>
              <p className="text-2xl font-bold" style={{ color: "var(--color-heading)" }}>Your cart is empty</p>
              <p className="mt-3 font-medium" style={{ color: "var(--color-muted)" }}>
                Looks like you haven't added anything yet.
              </p>
              <Link
                to="/products"
                className="mt-8 inline-flex items-center gap-2 rounded-xl px-6 py-3.5 font-bold text-white transition hover:-translate-y-1 hover:shadow-lg"
                style={{ background: "var(--color-accent)", boxShadow: "0 4px 14px rgba(16, 185, 129, 0.25)" }}
              >
                Start Shopping <FiArrowRight />
              </Link>
            </div>
          ) : (
            <div className="grid gap-8 lg:grid-cols-[2fr_1fr]">
              <div className="space-y-4">
                {cart.map((item) => (
                  <div key={item.id} className="flex flex-col gap-5 rounded-2xl border p-5 shadow-sm md:flex-row md:items-center transition-shadow hover:shadow-md" style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}>
                    <div className="h-28 w-28 shrink-0 rounded-2xl overflow-hidden" style={{ background: "var(--color-surface-alt)" }}>
                       {item.image ? (
                          <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                       ) : (
                          <div className="w-full h-full flex items-center justify-center text-xs" style={{ color: "var(--color-muted)" }}>No Image</div>
                       )}
                    </div>

                    <div className="flex-1">
                      <h2 className="text-lg font-bold" style={{ color: "var(--color-heading)" }}>{item.name}</h2>
                      <p className="mt-1.5 text-sm font-medium" style={{ color: "var(--color-muted)" }}>
                        {formatPrice(item.price)} each
                      </p>
                    </div>

                    <div className="flex items-center rounded-xl border" style={{ background: "var(--color-surface-alt)", borderColor: "var(--color-border)" }}>
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="p-3 transition hover:scale-110"
                        style={{ color: "var(--color-body)" }}
                      >
                        <FiMinus />
                      </button>
                      <span className="min-w-[2.5rem] text-center font-semibold" style={{ color: "var(--color-heading)" }}>{item.quantity}</span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="p-3 transition hover:scale-110"
                        style={{ color: "var(--color-body)" }}
                      >
                        <FiPlus />
                      </button>
                    </div>

                    <div className="text-right md:w-32">
                      <p className="text-lg font-bold" style={{ color: "var(--color-heading)" }}>
                        {formatPrice(item.price * item.quantity)}
                      </p>
                      <button
                        type="button"
                        onClick={() => removeFromCart(item.id)}
                        className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium transition hover:scale-105"
                        style={{ color: "var(--color-danger)" }}
                      >
                        <FiTrash2 size={16} />
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="lg:sticky lg:top-24 h-max">
                <div className="rounded-3xl border p-7 shadow-sm" style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}>
                  <h2 className="text-2xl font-bold" style={{ color: "var(--color-heading)" }}>Order Summary</h2>

                  <div className="mt-8 space-y-4 text-sm font-medium">
                    <div className="flex justify-between" style={{ color: "var(--color-body)" }}>
                      <span>Subtotal</span>
                      <span className="font-semibold" style={{ color: "var(--color-heading)" }}>{formatPrice(cartTotal)}</span>
                    </div>
                    <div className="flex justify-between" style={{ color: "var(--color-body)" }}>
                      <span>Estimated Delivery</span>
                      <span className="font-semibold" style={{ color: "var(--color-heading)" }}>{delivery}</span>
                    </div>
                  </div>

                  <div className="mt-6 flex items-center justify-between border-t pt-6" style={{ borderColor: "var(--color-border)" }}>
                    <span className="text-lg font-bold" style={{ color: "var(--color-heading)" }}>Total</span>
                    <span className="text-2xl font-black" style={{ color: "var(--color-heading)" }}>
                      {formatPrice(cartTotal + (delivery === "Free" ? 0 : 99))}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => navigate("/checkout")}
                    className="mt-8 w-full rounded-xl px-4 py-3.5 font-bold text-white flex items-center justify-center gap-2 transition hover:-translate-y-1 hover:shadow-lg"
                    style={{ background: "var(--color-accent)", boxShadow: "0 4px 14px rgba(16, 185, 129, 0.25)" }}
                  >
                    Proceed to Checkout <FiArrowRight />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}

export default Cart;
