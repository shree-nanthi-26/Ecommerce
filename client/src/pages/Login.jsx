import { useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { FiMail, FiLock, FiShield, FiKey, FiArrowLeft } from "react-icons/fi";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // 2FA Challenge state
  const [twoFactorChallenge, setTwoFactorChallenge] = useState(null);
  const [twoFactorCode, setTwoFactorCode] = useState("");
  const [useRecoveryCode, setUseRecoveryCode] = useState(false);

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login, complete2FALogin } = useAuth();

  const redirect = searchParams.get("redirect") || "/";

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const data = await login(email, password);
      if (data?.require2FA) {
        setTwoFactorChallenge(data);
      } else {
        navigate(redirect);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  const handle2FASubmit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (useRecoveryCode) {
        await complete2FALogin(twoFactorChallenge.tempToken, null, twoFactorCode.trim());
      } else {
        await complete2FALogin(twoFactorChallenge.tempToken, twoFactorCode.trim(), null);
      }
      navigate(redirect);
    } catch (err) {
      setError(err.response?.data?.message || "Invalid 2FA code");
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
          {!twoFactorChallenge ? (
            <>
              <h1 className="text-3xl font-serif font-bold text-center" style={{ color: "var(--color-heading)" }}>
                Welcome Back
              </h1>
              <p className="mt-2 text-sm text-center font-medium" style={{ color: "var(--color-muted)" }}>
                Sign in to continue to Furniva
              </p>

              {error && (
                <div
                  className="mt-6 rounded-2xl px-4 py-3 text-sm flex items-center gap-2 border"
                  style={{
                    background: "rgba(239, 68, 68, 0.1)",
                    borderColor: "rgba(239, 68, 68, 0.2)",
                    color: "var(--color-danger)",
                  }}
                >
                  <span className="flex-shrink-0">⚠️</span>
                  <span>{error}</span>
                </div>
              )}

              <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
                <div>
                  <label className="text-sm font-semibold block mb-2" style={{ color: "var(--color-body)" }}>
                    Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none" style={{ color: "var(--color-muted)" }}>
                      <FiMail />
                    </div>
                    <input
                      id="login-email-input"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full rounded-xl border pl-11 pr-4 py-3 outline-none transition-all duration-300"
                      style={{
                        background: "var(--color-surface-alt)",
                        borderColor: "var(--color-border)",
                        color: "var(--color-heading)",
                      }}
                      onFocus={(e) => (e.target.style.borderColor = "var(--color-accent)")}
                      onBlur={(e) => (e.target.style.borderColor = "var(--color-border)")}
                      required
                      placeholder="admin@furniva.com"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-semibold block mb-2" style={{ color: "var(--color-body)" }}>
                    Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none" style={{ color: "var(--color-muted)" }}>
                      <FiLock />
                    </div>
                    <input
                      id="login-password-input"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full rounded-xl border pl-11 pr-4 py-3 outline-none transition-all duration-300"
                      style={{
                        background: "var(--color-surface-alt)",
                        borderColor: "var(--color-border)",
                        color: "var(--color-heading)",
                      }}
                      onFocus={(e) => (e.target.style.borderColor = "var(--color-accent)")}
                      onBlur={(e) => (e.target.style.borderColor = "var(--color-border)")}
                      required
                      placeholder="••••••••"
                    />
                  </div>
                  <div className="mt-2 text-right">
                    <Link
                      to="/forgot-password"
                      className="text-xs font-semibold hover:underline"
                      style={{ color: "var(--color-primary-light)" }}
                    >
                      Forgot password?
                    </Link>
                  </div>
                </div>

                <button
                  type="submit"
                  id="login-submit-btn"
                  disabled={loading}
                  className="w-full rounded-xl py-3.5 font-bold text-white shadow-lg transition-all duration-300 transform active:scale-95 disabled:opacity-50"
                  style={{
                    background: "var(--color-accent)",
                    boxShadow: "0 4px 14px rgba(220, 95, 0, 0.3)",
                  }}
                >
                  {loading ? "Signing in..." : "Sign In"}
                </button>
              </form>

              <div className="mt-8 text-center text-sm font-medium" style={{ color: "var(--color-muted)" }}>
                Don't have an account?{" "}
                <Link
                  to="/register"
                  className="font-bold hover:underline"
                  style={{ color: "var(--color-accent)" }}
                >
                  Create one now
                </Link>
              </div>
            </>
          ) : (
            /* 2FA Challenge Form */
            <div>
              <div className="flex justify-center mb-4">
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center border shadow-md"
                  style={{
                    background: "rgba(16, 185, 129, 0.1)",
                    borderColor: "rgba(16, 185, 129, 0.2)",
                    color: "#10B981",
                  }}
                >
                  <FiShield size={32} />
                </div>
              </div>

              <h1 className="text-2xl font-serif font-bold text-center" style={{ color: "var(--color-heading)" }}>
                Two-Factor Authentication
              </h1>
              <p className="mt-2 text-xs text-center font-medium leading-relaxed" style={{ color: "var(--color-muted)" }}>
                {useRecoveryCode
                  ? "Enter one of your 8-character backup recovery codes."
                  : "Enter the 6-digit verification code from your authenticator app (Google Authenticator, Authy, etc.)."}
              </p>

              {error && (
                <div
                  className="mt-5 rounded-2xl px-4 py-3 text-sm flex items-center gap-2 border"
                  style={{
                    background: "rgba(239, 68, 68, 0.1)",
                    borderColor: "rgba(239, 68, 68, 0.2)",
                    color: "var(--color-danger)",
                  }}
                >
                  <span className="flex-shrink-0">⚠️</span>
                  <span>{error}</span>
                </div>
              )}

              <form className="mt-6 space-y-4" onSubmit={handle2FASubmit}>
                <div>
                  <label className="text-xs font-semibold block mb-2" style={{ color: "var(--color-body)" }}>
                    {useRecoveryCode ? "Backup Recovery Code" : "6-Digit Security Code"}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none" style={{ color: "var(--color-muted)" }}>
                      <FiKey />
                    </div>
                    <input
                      id="two-factor-code-input"
                      type="text"
                      autoFocus
                      maxLength={useRecoveryCode ? 12 : 6}
                      value={twoFactorCode}
                      onChange={(e) => setTwoFactorCode(e.target.value)}
                      className="w-full rounded-xl border pl-11 pr-4 py-3 text-center font-mono tracking-widest text-lg font-bold outline-none transition-all duration-300"
                      style={{
                        background: "var(--color-surface-alt)",
                        borderColor: "var(--color-border)",
                        color: "var(--color-heading)",
                      }}
                      placeholder={useRecoveryCode ? "A1B2-C3D4" : "123456"}
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || !twoFactorCode.trim()}
                  className="w-full rounded-xl py-3.5 font-bold text-white shadow-lg transition-all duration-300 disabled:opacity-50"
                  style={{
                    background: "var(--color-accent)",
                    boxShadow: "0 4px 14px rgba(220, 95, 0, 0.3)",
                  }}
                >
                  {loading ? "Verifying..." : "Verify & Sign In"}
                </button>

                <div className="flex items-center justify-between pt-2 text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      setUseRecoveryCode(!useRecoveryCode);
                      setTwoFactorCode("");
                      setError("");
                    }}
                    className="font-semibold transition hover:underline"
                    style={{ color: "var(--color-accent)" }}
                  >
                    {useRecoveryCode ? "Use 6-digit authenticator code" : "Use backup recovery code"}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setTwoFactorChallenge(null);
                      setTwoFactorCode("");
                      setError("");
                    }}
                    className="flex items-center gap-1 font-semibold text-[var(--color-muted)] hover:text-[var(--color-heading)]"
                  >
                    <FiArrowLeft size={13} /> Back
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Login;
