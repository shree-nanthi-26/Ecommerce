import { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";
import axiosInstance from "../api/axiosInstance";
import { FiCheckCircle, FiAlertCircle, FiShoppingBag, FiArrowLeft, FiMail } from "react-icons/fi";

function Unsubscribe() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const type = searchParams.get("type") || "abandonedCart";

  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [userEmail, setUserEmail] = useState("");
  const [optedOutType, setOptedOutType] = useState(type);

  useEffect(() => {
    async function performUnsubscribe() {
      if (!token) {
        setError("No unsubscribe token was provided. Please use the link in your email.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await axiosInstance.post("/auth/unsubscribe", {
          token,
          type,
        });

        if (response.data.success) {
          setSuccess(true);
          setUserEmail(response.data.email || "");
          setOptedOutType(type);
        } else {
          setError(response.data.message || "Failed to process unsubscribe request.");
        }
      } catch (err) {
        setError(
          err.response?.data?.message ||
            "Unable to process your request. The unsubscribe link may be invalid or expired."
        );
      } finally {
        setLoading(false);
      }
    }

    performUnsubscribe();
  }, [token, type]);

  return (
    <>
      <Helmet>
        <title>Email Preferences | Furniva</title>
        <meta name="description" content="Manage your email and reminder notification preferences on Furniva." />
      </Helmet>

      <Navbar />

      <main className="min-h-[70vh] flex items-center justify-center py-16 px-4">
        <div
          className="w-full max-w-lg rounded-3xl p-8 md:p-10 text-center shadow-xl border"
          style={{
            background: "var(--color-surface)",
            borderColor: "var(--color-border)",
          }}
        >
          {loading ? (
            <div className="py-12">
              <div
                className="w-12 h-12 mx-auto rounded-full border-4 border-t-transparent animate-spin mb-4"
                style={{ borderColor: "var(--color-accent) transparent transparent transparent" }}
              />
              <p className="text-base font-medium" style={{ color: "var(--color-heading)" }}>
                Updating your email preferences...
              </p>
            </div>
          ) : success ? (
            <div className="space-y-6">
              <div
                className="w-20 h-20 mx-auto rounded-full flex items-center justify-center text-green-500"
                style={{ background: "rgba(34, 197, 94, 0.12)" }}
              >
                <FiCheckCircle size={44} />
              </div>

              <div>
                <h1 className="text-2xl md:text-3xl font-bold" style={{ color: "var(--color-heading)" }}>
                  Unsubscribed Successfully
                </h1>
                {userEmail && (
                  <p className="text-sm font-medium mt-1 text-green-600">
                    {userEmail}
                  </p>
                )}
                <p className="text-sm mt-3" style={{ color: "var(--color-muted)" }}>
                  {optedOutType === "abandonedCart"
                    ? "You will no longer receive cart reminders or unfinished order notifications from Furniva."
                    : "You will no longer receive marketing and promotional communications from Furniva."}
                </p>
              </div>

              <div
                className="p-4 rounded-2xl text-left text-xs space-y-2"
                style={{
                  background: "var(--color-surface-alt)",
                  border: "1px solid var(--color-border)",
                  color: "var(--color-muted)",
                }}
              >
                <div className="flex items-center gap-2 font-semibold" style={{ color: "var(--color-heading)" }}>
                  <FiMail size={14} /> Note about transactional emails
                </div>
                <p>
                  You will still receive critical transactional notifications such as order confirmations, shipping updates, and security alerts. You can change your preferences at any time in your account profile.
                </p>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
                <Link
                  to="/cart"
                  className="px-6 py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-opacity hover:opacity-90"
                  style={{ background: "var(--color-accent)", color: "#ffffff" }}
                >
                  <FiShoppingBag size={16} /> Return to Cart
                </Link>
                <Link
                  to="/products"
                  className="px-6 py-3 rounded-xl text-sm font-semibold border flex items-center justify-center gap-2 transition-colors hover:bg-[var(--color-surface-alt)]"
                  style={{ borderColor: "var(--color-border)", color: "var(--color-heading)" }}
                >
                  Browse Catalog
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div
                className="w-20 h-20 mx-auto rounded-full flex items-center justify-center text-red-500"
                style={{ background: "rgba(239, 68, 68, 0.12)" }}
              >
                <FiAlertCircle size={44} />
              </div>

              <div>
                <h1 className="text-2xl font-bold" style={{ color: "var(--color-heading)" }}>
                  Unable to Unsubscribe
                </h1>
                <p className="text-sm mt-3" style={{ color: "var(--color-danger, #ef4444)" }}>
                  {error}
                </p>
              </div>

              <p className="text-xs" style={{ color: "var(--color-muted)" }}>
                If you are a registered user, you can also manage your email preferences directly by logging in and visiting your Profile settings.
              </p>

              <div className="pt-2">
                <Link
                  to="/"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold transition-opacity hover:opacity-90"
                  style={{ background: "var(--color-accent)", color: "#ffffff" }}
                >
                  <FiArrowLeft size={16} /> Return to Home
                </Link>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </>
  );
}

export default Unsubscribe;
