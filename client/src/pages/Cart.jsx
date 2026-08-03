import { Link, useNavigate } from "react-router-dom";
import { FiMinus, FiPlus, FiTrash2 } from "react-icons/fi";
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
      <main className="min-h-screen bg-[#0F1115] px-8 py-16 text-white">
        <div className="mx-auto max-w-[1500px]">
          <div className="mb-10">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-green-400">
              Your Basket
            </p>
            <h1 className="mt-2 text-4xl font-bold">Cart</h1>
          </div>

          {cart.length === 0 ? (
            <div className="flex min-h-[420px] flex-col items-center justify-center rounded-3xl border border-[#2D333D] bg-[#1A1D24] px-6 text-center">
              <p className="text-2xl font-semibold">Your cart is empty</p>
              <p className="mt-3 text-[#B8BEC9]">
                Add a few favorite products to see them here.
              </p>
              <Link
                to="/products"
                className="mt-6 inline-flex rounded-xl bg-green-500 px-5 py-3 font-semibold text-white transition hover:bg-green-600"
              >
                Continue Shopping
              </Link>
            </div>
          ) : (
            <div className="grid gap-8 lg:grid-cols-[2fr_1fr]">
              <div className="space-y-4">
                {cart.map((item) => (
                  <div key={item.id} className="flex flex-col gap-4 rounded-2xl border border-[#2D333D] bg-[#1A1D24] p-5 md:flex-row md:items-center">
                    <div className="h-24 w-24 rounded-2xl bg-[#2D333D]" />

                    <div className="flex-1">
                      <h2 className="text-lg font-semibold">{item.name}</h2>
                      <p className="mt-1 text-sm text-[#B8BEC9]">
                        {formatPrice(item.price)} each
                      </p>
                    </div>

                    <div className="flex items-center rounded-xl border border-[#2D333D] bg-[#0F1115]">
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="p-3 text-white transition hover:text-green-400"
                      >
                        <FiMinus />
                      </button>
                      <span className="min-w-10 text-center text-white">{item.quantity}</span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="p-3 text-white transition hover:text-green-400"
                      >
                        <FiPlus />
                      </button>
                    </div>

                    <div className="text-right">
                      <p className="font-semibold text-white">
                        {formatPrice(item.price * item.quantity)}
                      </p>
                      <button
                        type="button"
                        onClick={() => removeFromCart(item.id)}
                        className="mt-3 inline-flex items-center gap-2 text-sm text-[#B8BEC9] transition hover:text-red-400"
                      >
                        <FiTrash2 />
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="lg:sticky lg:top-24">
                <div className="rounded-3xl border border-[#2D333D] bg-[#1A1D24] p-6">
                  <h2 className="text-2xl font-semibold">Order Summary</h2>

                  <div className="mt-6 space-y-3 text-sm text-[#B8BEC9]">
                    <div className="flex justify-between">
                      <span>Subtotal</span>
                      <span className="text-white">{formatPrice(cartTotal)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Delivery</span>
                      <span className="text-white">{delivery}</span>
                    </div>
                  </div>

                  <div className="mt-6 flex items-center justify-between border-t border-[#2D333D] pt-4 text-lg font-semibold">
                    <span>Total</span>
                    <span className="text-white">
                      {formatPrice(cartTotal + (delivery === "Free" ? 0 : 99))}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => navigate("/checkout")}
                    className="mt-6 w-full rounded-xl bg-green-500 px-4 py-3 font-semibold text-white transition hover:bg-green-600"
                  >
                    Proceed to Checkout
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
