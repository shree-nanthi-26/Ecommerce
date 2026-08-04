import { Helmet } from "react-helmet-async";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FiUser,
  FiMail,
  FiShoppingBag,
  FiHeart,
  FiLogOut,
  FiPackage,
  FiClock,
  FiCheckCircle,
  FiTruck,
  FiChevronRight,
  FiShield,
} from "react-icons/fi";
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";
import { useAuth } from "../context/AuthContext";
import { getMyOrders } from "../services/orderService";

const STATUS_COLOR = {
  Placed: { color: "#3B82F6", bg: "rgba(59,130,246,0.12)", icon: FiClock },
  Confirmed: { color: "#8B5CF6", bg: "rgba(139,92,246,0.12)", icon: FiPackage },
  Shipped: { color: "#F59E0B", bg: "rgba(245,158,11,0.12)", icon: FiTruck },
  Delivered: { color: "#10B981", bg: "rgba(16,185,129,0.12)", icon: FiCheckCircle },
  Cancelled: { color: "#EF4444", bg: "rgba(239,68,68,0.12)", icon: FiCheckCircle },
};

function ProfileAvatar({ name }) {
  const initials = name
    ? name
        .split(" ")
        .map((w) => w[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "U";

  return (
    <div
      className="flex h-24 w-24 items-center justify-center rounded-full text-3xl font-extrabold text-white shadow-lg"
      style={{
        background: "linear-gradient(135deg, var(--color-accent) 0%, var(--color-primary) 100%)",
      }}
      aria-label={`Profile avatar for ${name}`}
    >
      {initials}
    </div>
  );
}

function Profile() {
  const { user, logout } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);

  useEffect(() => {
    async function fetchOrders() {
      try {
        setLoadingOrders(true);
        const data = await getMyOrders();
        setOrders(data || []);
      } catch {
        setOrders([]);
      } finally {
        setLoadingOrders(false);
      }
    }
    fetchOrders();
  }, []);

  const totalSpent = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
  const deliveredCount = orders.filter((o) => o.status === "Delivered").length;

  return (
    <>
      <Helmet>
        <title>My Profile – ElectroMart</title>
        <meta
          name="description"
          content="Manage your ElectroMart account, view order history, and update your profile details."
        />
      </Helmet>

      <Navbar />

      <main
        className="min-h-screen px-4 sm:px-8 py-16"
        style={{ background: "var(--color-bg)", color: "var(--color-heading)" }}
      >
        <div className="mx-auto max-w-[1200px]">
          {/* Page heading */}
          <div className="mb-10">
            <p
              className="text-sm font-semibold uppercase tracking-[0.3em]"
              style={{ color: "var(--color-accent)" }}
            >
              Account
            </p>
            <h1 className="mt-2 text-4xl font-bold">My Profile</h1>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* ── Left column: Identity card ── */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="lg:col-span-1 space-y-6"
            >
              {/* Profile card */}
              <div
                className="rounded-3xl p-8 border text-center"
                style={{
                  background: "var(--color-surface)",
                  borderColor: "var(--color-border)",
                }}
              >
                <div className="flex justify-center mb-5">
                  <ProfileAvatar name={user?.name} />
                </div>
                <h2 className="text-2xl font-bold">{user?.name || "Guest"}</h2>
                <p
                  className="mt-1 flex items-center justify-center gap-1.5 text-sm"
                  style={{ color: "var(--color-muted)" }}
                >
                  <FiMail size={14} />
                  {user?.email || "Not logged in"}
                </p>

                {user?.role === "admin" && (
                  <span
                    className="mt-3 inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider"
                    style={{
                      background: "rgba(37,99,235,0.12)",
                      color: "var(--color-primary-light)",
                    }}
                  >
                    <FiShield size={12} /> Admin
                  </span>
                )}

                <div
                  className="mt-6 grid grid-cols-3 gap-3 rounded-2xl p-4"
                  style={{ background: "var(--color-surface-alt)" }}
                >
                  <div className="text-center">
                    <p className="text-xl font-extrabold">{orders.length}</p>
                    <p className="mt-0.5 text-xs" style={{ color: "var(--color-muted)" }}>
                      Orders
                    </p>
                  </div>
                  <div className="text-center" style={{ borderLeft: "1px solid var(--color-border)", borderRight: "1px solid var(--color-border)" }}>
                    <p className="text-xl font-extrabold">{deliveredCount}</p>
                    <p className="mt-0.5 text-xs" style={{ color: "var(--color-muted)" }}>
                      Delivered
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-xl font-extrabold">
                      ₹{(totalSpent / 1000).toFixed(1)}k
                    </p>
                    <p className="mt-0.5 text-xs" style={{ color: "var(--color-muted)" }}>
                      Spent
                    </p>
                  </div>
                </div>
              </div>

              {/* Quick links */}
              <div
                className="rounded-3xl border overflow-hidden"
                style={{
                  background: "var(--color-surface)",
                  borderColor: "var(--color-border)",
                }}
              >
                {[
                  { icon: FiShoppingBag, label: "My Orders", href: "/orders" },
                  { icon: FiHeart, label: "My Wishlist", href: "/wishlist" },
                ].map(({ icon: Icon, label, href }) => (
                  <Link
                    key={label}
                    to={href}
                    className="flex items-center justify-between px-6 py-4 transition border-b last:border-0"
                    style={{
                      borderColor: "var(--color-border)",
                      color: "var(--color-body)",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "var(--color-surface-hover)";
                      e.currentTarget.style.color = "var(--color-accent)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "transparent";
                      e.currentTarget.style.color = "var(--color-body)";
                    }}
                  >
                    <span className="flex items-center gap-3 font-semibold text-sm">
                      <Icon size={17} />
                      {label}
                    </span>
                    <FiChevronRight size={16} style={{ color: "var(--color-muted)" }} />
                  </Link>
                ))}
              </div>

              {/* Logout */}
              <button
                onClick={logout}
                id="profile-logout-btn"
                className="flex w-full items-center justify-center gap-2 rounded-2xl border py-3.5 font-semibold text-sm transition"
                style={{
                  background: "transparent",
                  borderColor: "var(--color-danger)",
                  color: "var(--color-danger)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(239,68,68,0.08)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                }}
              >
                <FiLogOut size={16} /> Sign Out
              </button>
            </motion.div>

            {/* ── Right column: Account info + Recent orders ── */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="lg:col-span-2 space-y-8"
            >
              {/* Account details card */}
              <div
                className="rounded-3xl p-8 border"
                style={{
                  background: "var(--color-surface)",
                  borderColor: "var(--color-border)",
                }}
              >
                <h2 className="text-xl font-bold mb-6">Account Details</h2>
                <div className="space-y-5">
                  {[
                    { label: "Full Name", value: user?.name || "—", icon: FiUser },
                    { label: "Email Address", value: user?.email || "—", icon: FiMail },
                    {
                      label: "Account Role",
                      value: user?.role
                        ? user.role.charAt(0).toUpperCase() + user.role.slice(1)
                        : "Customer",
                      icon: FiShield,
                    },
                  ].map(({ label, value, icon: Icon }) => (
                    <div
                      key={label}
                      className="flex items-start gap-4 rounded-xl p-4"
                      style={{ background: "var(--color-surface-alt)" }}
                    >
                      <div
                        className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-xl flex-shrink-0"
                        style={{
                          background: "var(--color-accent-light)",
                          color: "var(--color-accent)",
                        }}
                      >
                        <Icon size={16} />
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--color-muted)" }}>
                          {label}
                        </p>
                        <p className="mt-1 font-semibold text-sm">{value}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Orders */}
              <div
                className="rounded-3xl p-8 border"
                style={{
                  background: "var(--color-surface)",
                  borderColor: "var(--color-border)",
                }}
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold">Recent Orders</h2>
                  <Link
                    to="/orders"
                    className="text-sm font-semibold transition"
                    style={{ color: "var(--color-accent)" }}
                  >
                    View All →
                  </Link>
                </div>

                {loadingOrders ? (
                  <div className="space-y-3">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div
                        key={i}
                        className="skeleton h-20 rounded-2xl"
                        style={{ animationDelay: `${i * 0.1}s` }}
                      />
                    ))}
                  </div>
                ) : orders.length === 0 ? (
                  <div
                    className="rounded-2xl p-10 text-center"
                    style={{ background: "var(--color-surface-alt)" }}
                  >
                    <FiShoppingBag size={36} style={{ color: "var(--color-muted)", margin: "0 auto 12px" }} />
                    <p className="font-semibold">No orders yet</p>
                    <p className="mt-1 text-sm" style={{ color: "var(--color-muted)" }}>
                      Your completed orders will appear here.
                    </p>
                    <Link to="/products" className="btn-primary mt-5 inline-flex">
                      Start Shopping
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {orders.slice(0, 5).map((order) => {
                      const statusInfo = STATUS_COLOR[order.status] || STATUS_COLOR.Placed;
                      const StatusIcon = statusInfo.icon;
                      return (
                        <Link
                          key={order._id}
                          to={`/orders/${order._id}/track`}
                          className="flex items-center justify-between rounded-2xl p-4 transition"
                          style={{
                            background: "var(--color-surface-alt)",
                            border: "1px solid var(--color-border)",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = "var(--color-accent)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = "var(--color-border)";
                          }}
                        >
                          <div className="flex items-center gap-4">
                            <div
                              className="flex h-10 w-10 items-center justify-center rounded-xl flex-shrink-0"
                              style={{ background: statusInfo.bg, color: statusInfo.color }}
                            >
                              <StatusIcon size={18} />
                            </div>
                            <div>
                              <p className="font-bold text-sm">
                                Order #{order._id.slice(-8).toUpperCase()}
                              </p>
                              <p className="text-xs mt-0.5" style={{ color: "var(--color-muted)" }}>
                                {new Date(order.createdAt).toLocaleDateString("en-IN", {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                })}
                                {" · "}
                                {order.items?.length} item{order.items?.length !== 1 ? "s" : ""}
                              </p>
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0 ml-4">
                            <p className="font-extrabold text-sm">
                              ₹{order.totalAmount?.toLocaleString("en-IN")}
                            </p>
                            <span
                              className="mt-1 inline-block rounded-full px-2.5 py-0.5 text-xs font-bold"
                              style={{ background: statusInfo.bg, color: statusInfo.color }}
                            >
                              {order.status}
                            </span>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}

export default Profile;
