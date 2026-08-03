import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { FiCheckCircle } from "react-icons/fi";
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";
import { getOrderById } from "../services/orderService";

function OrderConfirmation() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const response = await getOrderById(id);
        setOrder(response);
      } catch (err) {
        setError(err.response?.data?.message || "Unable to load order.");
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [id]);

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[#0F1115] px-6 py-14 text-white">
        <div className="mx-auto max-w-4xl">
          {loading ? (
            <div className="rounded-3xl border border-[#2D333D] bg-[#1D222C] p-12 text-center text-white">
              Loading order details...
            </div>
          ) : error ? (
            <div className="rounded-3xl border border-[#2D333D] bg-[#1D222C] p-12 text-center text-white">
              {error}
            </div>
          ) : (
            <div className="rounded-3xl border border-[#2D333D] bg-[#1D222C] p-10 text-center">
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-500 text-white">
                <FiCheckCircle size={40} />
              </div>
              <h1 className="text-4xl font-bold">Order Placed Successfully!</h1>
              <p className="mt-3 text-[#B8BEC9]">Your order is on its way.</p>
              <p className="mt-5 text-sm text-[#B8BEC9]">Order ID:</p>
              <p className="mt-1 text-xl font-semibold text-white">{order._id}</p>
              <p className="mt-3 text-[#B8BEC9]">Arriving in 5-7 business days</p>

              <div className="mt-8 rounded-3xl border border-[#2D333D] bg-[#0F1115] p-6 text-left">
                <h2 className="text-2xl font-semibold text-white">Order Summary</h2>
                <div className="mt-4 space-y-4">
                  {order.items.map((item) => (
                    <div key={item.product} className="flex items-center justify-between gap-4">
                      <div>
                        <p className="font-semibold text-white">{item.name}</p>
                        <p className="text-sm text-[#B8BEC9]">Qty: {item.quantity}</p>
                      </div>
                      <p className="font-semibold text-white">₹{(item.price * item.quantity).toLocaleString("en-IN")}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-6 border-t border-[#2D333D] pt-4 text-sm text-[#B8BEC9]">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span className="text-white">₹{order.itemsTotal.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="flex justify-between mt-2">
                    <span>Delivery</span>
                    <span className="text-white">{order.deliveryFee === 0 ? "Free" : `₹${order.deliveryFee.toLocaleString("en-IN")}`}</span>
                  </div>
                  <div className="flex justify-between mt-4 text-lg font-semibold text-white">
                    <span>Total Paid</span>
                    <span>₹{order.totalAmount.toLocaleString("en-IN")}</span>
                  </div>
                </div>
              </div>

              <Link
                to="/products"
                className="mt-8 inline-flex rounded-2xl bg-green-500 px-6 py-3 font-semibold text-white transition hover:bg-green-600"
              >
                Continue Shopping
              </Link>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}

export default OrderConfirmation;
