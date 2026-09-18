import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { FiMail, FiLock } from "react-icons/fi";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    try {
      await login(email, password);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || "Invalid credentials");
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
          <h1 className="text-3xl font-serif font-bold text-center" style={{ color: "var(--color-heading)" }}>Welcome Back</h1>
          <p className="mt-2 text-sm text-center font-medium" style={{ color: "var(--color-muted)" }}>Sign in to continue to Furniva</p>

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
            <div>
              <label className="text-sm font-semibold block mb-2" style={{ color: "var(--color-body)" }}>Password</label>
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
              <div className="mt-2 text-right">
                <Link to="/forgot-password" className="text-xs font-semibold hover:underline" style={{ color: "var(--color-primary-light)" }}>
                  Forgot password?
                </Link>
              </div>
            </div>

            <button
              type="submit"
              className="w-full rounded-xl px-4 py-3 mt-4 text-white font-bold transition hover:-translate-y-0.5 hover:shadow-lg"
              style={{ background: "var(--color-accent)", boxShadow: "0 4px 14px rgba(16, 185, 129, 0.3)" }}
            >
              Sign In
            </button>
          </form>

          <p className="mt-8 text-center text-sm font-medium" style={{ color: "var(--color-muted)" }}>
            Don't have an account?{' '}
            <Link to="/register" className="transition hover:underline" style={{ color: "var(--color-primary-light)" }}>
              Create one now
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;
