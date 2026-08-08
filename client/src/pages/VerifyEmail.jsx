import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { verifyEmailToken } from "../services/authService";
import { useAuth } from "../context/AuthContext";
import { FiCheckCircle, FiXCircle, FiLoader } from "react-icons/fi";

function VerifyEmail() {
  const { token } = useParams();
  const { markVerified } = useAuth();

  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function verify() {
      try {
        await verifyEmailToken(token);
        setSuccess(true);
        markVerified();
      } catch (err) {
        setError(err.response?.data?.message || "Invalid or expired verification token.");
      } finally {
        setLoading(false);
      }
    }
    if (token) {
      verify();
    }
  }, [token, markVerified]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10" style={{ background: "var(--color-bg)" }}>
      <div 
        className="w-full max-w-md rounded-3xl border p-8 shadow-xl relative overflow-hidden text-center" 
        style={{ 
          background: "var(--color-surface)",
          borderColor: "var(--color-border)",
        }}
      >
        <div className="relative z-10">
          {loading && (
            <div className="space-y-4 py-6">
              <FiLoader className="animate-spin text-4xl mx-auto" style={{ color: "var(--color-accent)" }} />
              <h2 className="text-xl font-bold" style={{ color: "var(--color-heading)" }}>Verifying Email...</h2>
              <p className="text-sm" style={{ color: "var(--color-muted)" }}>Please wait while we confirm your email address.</p>
            </div>
          )}

          {!loading && success && (
            <div className="space-y-4 py-6">
              <div className="w-16 h-16 rounded-full mx-auto flex items-center justify-center text-3xl" style={{ background: "rgba(16, 185, 129, 0.1)", color: "var(--color-accent)" }}>
                <FiCheckCircle />
              </div>
              <h2 className="text-2xl font-bold" style={{ color: "var(--color-heading)" }}>Email Verified! 🎉</h2>
              <p className="text-sm" style={{ color: "var(--color-muted)" }}>
                Thank you! Your email address has been successfully verified. You now have full access to ElectroMart features.
              </p>
              <Link
                to="/"
                className="inline-block mt-4 rounded-xl px-6 py-3 text-white font-bold transition hover:-translate-y-0.5"
                style={{ background: "var(--color-accent)", boxShadow: "0 4px 14px rgba(16, 185, 129, 0.3)" }}
              >
                Go to Homepage
              </Link>
            </div>
          )}

          {!loading && !success && (
            <div className="space-y-4 py-6">
              <div className="w-16 h-16 rounded-full mx-auto flex items-center justify-center text-3xl" style={{ background: "rgba(239, 68, 68, 0.1)", color: "var(--color-danger)" }}>
                <FiXCircle />
              </div>
              <h2 className="text-2xl font-bold" style={{ color: "var(--color-heading)" }}>Verification Failed</h2>
              <p className="text-sm" style={{ color: "var(--color-danger)" }}>{error}</p>
              <Link
                to="/login"
                className="inline-block mt-4 rounded-xl px-6 py-3 text-white font-bold transition hover:-translate-y-0.5"
                style={{ background: "var(--color-primary)", boxShadow: "0 4px 14px rgba(2, 132, 199, 0.3)" }}
              >
                Return to Login
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default VerifyEmail;
