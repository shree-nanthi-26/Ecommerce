import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { FiMail, FiAlertTriangle, FiCheckCircle } from "react-icons/fi";

function EmailVerificationBanner() {
  const { user, resendVerification } = useAuth();
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  if (!user || user.isVerified) {
    return null;
  }

  const handleResend = async () => {
    setSending(true);
    setMessage("");
    setError("");
    try {
      const res = await resendVerification();
      setMessage(res.message || "Verification email sent!");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to resend email.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div 
      className="w-full py-2.5 px-4 text-xs md:text-sm font-medium border-b flex flex-wrap items-center justify-between gap-2"
      style={{
        background: "rgba(245, 158, 11, 0.1)",
        borderColor: "rgba(245, 158, 11, 0.3)",
        color: "#fbbf24"
      }}
    >
      <div className="flex items-center gap-2">
        <FiAlertTriangle className="text-base shrink-0" />
        <span>Please verify your email address to secure your account.</span>
      </div>

      <div className="flex items-center gap-3">
        {message ? (
          <span className="flex items-center gap-1 text-emerald-400 font-semibold">
            <FiCheckCircle /> {message}
          </span>
        ) : (
          <button
            onClick={handleResend}
            disabled={sending}
            className="px-3 py-1 rounded-lg text-xs font-bold transition hover:opacity-80 flex items-center gap-1.5 disabled:opacity-50"
            style={{ background: "rgba(245, 158, 11, 0.2)", color: "#fef3c7" }}
          >
            <FiMail /> {sending ? "Sending..." : "Resend Verification Email"}
          </button>
        )}
      </div>
      {error && <span className="text-xs text-rose-400">{error}</span>}
    </div>
  );
}

export default EmailVerificationBanner;
