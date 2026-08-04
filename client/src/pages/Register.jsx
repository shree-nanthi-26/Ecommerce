import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { FiUser, FiMail, FiLock } from "react-icons/fi";

function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { register } = useAuth();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    try {
      await register(name, email, password);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || "Could not register user");
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
        <div className="absolute -top-20 -left-20 w-40 h-40 rounded-full blur-3xl opacity-20" style={{ background: "var(--color-accent)" }} />
        <div className="absolute -bottom-20 -right-20 w-40 h-40 rounded-full blur-3xl opacity-20" style={{ background: "var(--color-primary)" }} />

        <div className="relative z-10">
          <h1 className="text-3xl font-black text-center" style={{ color: "var(--color-heading)" }}>Create Account</h1>
          <p className="mt-2 text-sm text-center font-medium" style={{ color: "var(--color-muted)" }}>Join ElectroMart today</p>

          {error && (
            <div className="mt-6 rounded-2xl px-4 py-3 text-sm flex items-center gap-2" style={{ background: "rgba(239, 68, 68, 0.1)", color: "var(--color-danger)" }}>
              <span>⚠️</span> {error}
            </div>
          )}

          <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="text-sm font-semibold block mb-1.5" style={{ color: "var(--color-body)" }}>Full Name</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none" style={{ color: "var(--color-muted)" }}>
                  <FiUser />
                </div>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-xl border pl-11 pr-4 py-3 outline-none transition-all duration-300"
                  style={{
                    background: "var(--color-surface-alt)",
                    borderColor: "var(--color-border)",
                    color: "var(--color-heading)"
                  }}
                  onFocus={(e) => e.target.style.borderColor = "var(--color-accent)"}
                  onBlur={(e) => e.target.style.borderColor = "var(--color-border)"}
                  required
                  placeholder="John Doe"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-semibold block mb-1.5" style={{ color: "var(--color-body)" }}>Email Address</label>
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
              <label className="text-sm font-semibold block mb-1.5" style={{ color: "var(--color-body)" }}>Password</label>
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
              <label className="text-sm font-semibold block mb-1.5" style={{ color: "var(--color-body)" }}>Confirm Password</label>
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
              className="w-full rounded-xl px-4 py-3 mt-4 text-white font-bold transition hover:-translate-y-0.5 hover:shadow-lg"
              style={{ background: "var(--color-accent)", boxShadow: "0 4px 14px rgba(16, 185, 129, 0.3)" }}
            >
              Sign Up
            </button>
          </form>

          <p className="mt-8 text-center text-sm font-medium" style={{ color: "var(--color-muted)" }}>
            Already have an account?{' '}
            <Link to="/login" className="transition hover:underline" style={{ color: "var(--color-primary-light)" }}>
              Log in instead
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Register;
