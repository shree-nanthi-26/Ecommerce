import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";
import { getMyOrders } from "../services/orderService";

const statusColors = {
  Placed: "bg-yellow-500 text-black",
  Confirmed: "bg-blue-500 text-white",
  Shipped: "bg-purple-500 text-white",
  Delivered: "bg-green-500 text-white",
  Cancelled: "bg-red-500 text-white",
};

function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await getMyOrders();
        setOrders(response);
      } catch (err) {
        setError(err.response?.data?.message || "Unable to load orders.");
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[#0F1115] px-6 py-14 text-white">
        <div className="mx-auto max-w-[1500px]">
          <div className="mb-10">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-green-400">
              My Orders
            </p>
            <h1 className="mt-2 text-4xl font-bold">Order History</h1>
          </div>

          {loading ? (
            <div className="rounded-3xl border border-[#2D333D] bg-[#1D222C] p-12 text-center text-white">
              Loading your orders...
            </div>
          ) : error ? (
            <div className="rounded-3xl border border-[#2D333D] bg-[#1D222C] p-12 text-center text-white">
              {error}
            </div>
          ) : orders.length === 0 ? (
            <div className="rounded-3xl border border-[#2D333D] bg-[#1D222C] p-12 text-center text-white">
              <p className="text-2xl font-semibold">You haven't placed any orders yet.</p>
              <Link
                to="/products"
                className="mt-6 inline-flex rounded-2xl bg-green-500 px-5 py-3 font-semibold text-white transition hover:bg-green-600"
              >
                Shop Products
              </Link>
            </div>
          ) : (
            <div className="grid gap-6">
              {orders.map((order) => (
                <Link
                  key={order._id}
                  to={`/order-confirmation/${order._id}`}
                  className="block rounded-3xl border border-[#2D333D] bg-[#1D222C] p-6 transition hover:border-green-500"
                >
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="text-sm text-[#B8BEC9]">Order ID: {order._id}</p>
                      <p className="mt-2 text-lg font-semibold text-white">{new Date(order.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div className={`rounded-full px-4 py-2 text-sm font-semibold ${statusColors[order.status]}`}>
                      {order.status}
                    </div>
                  </div>
                  <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-between text-[#B8BEC9]">
                    <span>{order.items.length} items</span>
                    <span>Total: ₹{order.totalAmount.toLocaleString("en-IN")}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}

export default Orders;
