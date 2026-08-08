import { useState } from "react";
import { Link } from "react-router-dom";
import { forgotPassword } from "../services/authService";
import { FiMail, FiArrowLeft, FiCheckCircle } from "react-icons/fi";

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
      const data = await forgotPassword(email);
      setMessage(data.message || "A password reset link has been sent to your email.");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to process request. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10" style={{ background: "var(--color-bg)" }}>
      <div 
        className="w-full max-w-md rounded-3xl border p-8 shadow-xl relative overflow-hidden" 
        style={{ 
          background: "var(--color-surface)",
          borderColor: "var(--color-border)",
        }}
      >
        {/* Decorative elements */}
        <div className="absolute -top-20 -right-20 w-40 h-40 rounded-full blur-3xl opacity-20" style={{ background: "var(--color-primary)" }} />
        <div className="absolute -bottom-20 -left-20 w-40 h-40 rounded-full blur-3xl opacity-20" style={{ background: "var(--color-accent)" }} />

        <div className="relative z-10">
          <Link to="/login" className="inline-flex items-center gap-2 text-sm font-semibold mb-6 hover:underline" style={{ color: "var(--color-muted)" }}>
            <FiArrowLeft /> Back to Login
          </Link>

          <h1 className="text-3xl font-black text-center" style={{ color: "var(--color-heading)" }}>Forgot Password</h1>
          <p className="mt-2 text-sm text-center font-medium" style={{ color: "var(--color-muted)" }}>
            Enter your account email address and we'll send you a password reset link.
          </p>

          {message && (
            <div className="mt-6 rounded-2xl px-4 py-3 text-sm flex items-start gap-3" style={{ background: "rgba(16, 185, 129, 0.1)", color: "var(--color-accent)" }}>
              <FiCheckCircle className="mt-0.5 shrink-0" />
              <span>{message}</span>
            </div>
          )}

          {error && (
            <div className="mt-6 rounded-2xl px-4 py-3 text-sm flex items-center gap-2" style={{ background: "rgba(239, 68, 68, 0.1)", color: "var(--color-danger)" }}>
              <span>⚠️</span> {error}
            </div>
          )}

          <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
            <div>
              <label className="text-sm font-semibold block mb-2" style={{ color: "var(--color-body)" }}>Email Address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none" style={{ color: "var(--color-muted)" }}>
                  <FiMail />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border pl-11 pr-4 py-3 outline-none transition-all duration-300"
                  style={{
                    background: "var(--color-surface-alt)",
                    borderColor: "var(--color-border)",
                    color: "var(--color-heading)"
                  }}
                  onFocus={(e) => e.target.style.borderColor = "var(--color-accent)"}
                  onBlur={(e) => e.target.style.borderColor = "var(--color-border)"}
                  required
                  placeholder="john@example.com"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl px-4 py-3 mt-4 text-white font-bold transition hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-50"
              style={{ background: "var(--color-accent)", boxShadow: "0 4px 14px rgba(16, 185, 129, 0.3)" }}
            >
              {loading ? "Sending..." : "Send Reset Link"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default ForgotPassword;
