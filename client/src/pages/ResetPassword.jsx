import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { resetPassword } from "../services/authService";
import { FiLock, FiCheckCircle } from "react-icons/fi";

function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      await resetPassword(token, password);
      setSuccess(true);
      setTimeout(() => {
        navigate("/login");
      }, 3000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to reset password. Token may be invalid or expired.");
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
        <div className="absolute -top-20 -right-20 w-40 h-40 rounded-full blur-3xl opacity-20" style={{ background: "var(--color-primary)" }} />
        <div className="absolute -bottom-20 -left-20 w-40 h-40 rounded-full blur-3xl opacity-20" style={{ background: "var(--color-accent)" }} />

        <div className="relative z-10">
          <h1 className="text-3xl font-black text-center" style={{ color: "var(--color-heading)" }}>Reset Password</h1>
          <p className="mt-2 text-sm text-center font-medium" style={{ color: "var(--color-muted)" }}>
            Enter your new password below.
          </p>

          {success ? (
            <div className="mt-8 text-center space-y-4">
              <div className="w-16 h-16 rounded-full mx-auto flex items-center justify-center text-3xl" style={{ background: "rgba(16, 185, 129, 0.1)", color: "var(--color-accent)" }}>
                <FiCheckCircle />
              </div>
              <h2 className="text-xl font-bold" style={{ color: "var(--color-heading)" }}>Password Reset!</h2>
              <p className="text-sm" style={{ color: "var(--color-muted)" }}>
                Your password has been reset successfully. Redirecting to login in 3 seconds...
              </p>
              <Link to="/login" className="inline-block mt-4 text-sm font-semibold hover:underline" style={{ color: "var(--color-primary-light)" }}>
                Click here to Login Now
              </Link>
            </div>
          ) : (
            <>
              {error && (
                <div className="mt-6 rounded-2xl px-4 py-3 text-sm flex items-center gap-2" style={{ background: "rgba(239, 68, 68, 0.1)", color: "var(--color-danger)" }}>
                  <span>⚠️</span> {error}
                </div>
              )}

              <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
                <div>
                  <label className="text-sm font-semibold block mb-2" style={{ color: "var(--color-body)" }}>New Password</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none" style={{ color: "var(--color-muted)" }}>
                      <FiLock />
                    </div>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full rounded-xl border pl-11 pr-4 py-3 outline-none transition-all duration-300"
                      style={{
                        background: "var(--color-surface-alt)",
                        borderColor: "var(--color-border)",
                        color: "var(--color-heading)"
                      }}
                      onFocus={(e) => e.target.style.borderColor = "var(--color-accent)"}
                      onBlur={(e) => e.target.style.borderColor = "var(--color-border)"}
                      required
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-semibold block mb-2" style={{ color: "var(--color-body)" }}>Confirm New Password</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none" style={{ color: "var(--color-muted)" }}>
                      <FiLock />
                    </div>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full rounded-xl border pl-11 pr-4 py-3 outline-none transition-all duration-300"
                      style={{
                        background: "var(--color-surface-alt)",
                        borderColor: "var(--color-border)",
                        color: "var(--color-heading)"
                      }}
                      onFocus={(e) => e.target.style.borderColor = "var(--color-accent)"}
                      onBlur={(e) => e.target.style.borderColor = "var(--color-border)"}
                      required
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-xl px-4 py-3 mt-4 text-white font-bold transition hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-50"
                  style={{ background: "var(--color-accent)", boxShadow: "0 4px 14px rgba(16, 185, 129, 0.3)" }}
                >
                  {loading ? "Updating..." : "Update Password"}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default ResetPassword;
