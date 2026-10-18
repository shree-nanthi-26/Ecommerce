import { useState, useEffect, useCallback } from "react";
import {
  FiShield,
  FiLock,
  FiSmartphone,
  FiMonitor,
  FiTablet,
  FiCopy,
  FiCheck,
  FiX,
  FiAlertTriangle,
  FiRefreshCw,
  FiEye,
  FiEyeOff,
} from "react-icons/fi";
import PasswordStrengthMeter from "../auth/PasswordStrengthMeter";
import {
  changePassword,
  setup2FA,
  verify2FASetup,
  disable2FA,
  getActiveSessions,
  revokeSession,
  logoutOtherSessions,
  logoutAllSessions,
} from "../../services/authService";
import { useAuth } from "../../context/AuthContext";

export default function AccountSecuritySettings() {
  const { user, saveUser, logout } = useAuth();

  // Password state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [revokeOthers, setRevokeOthers] = useState(true);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);
  const [pwMessage, setPwMessage] = useState({ type: "", text: "" });

  // 2FA state
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(!!user?.twoFactorEnabled);
  const [setupModalOpen, setSetupModalOpen] = useState(false);
  const [disableModalOpen, setDisableModalOpen] = useState(false);
  const [setupData, setSetupData] = useState(null); // { secret, qrCode, recoveryCodes }
  const [verificationCode, setVerificationCode] = useState("");
  const [disablePassword, setDisablePassword] = useState("");
  const [disableCode, setDisableCode] = useState("");
  const [twoFactorLoading, setTwoFactorLoading] = useState(false);
  const [twoFactorMessage, setTwoFactorMessage] = useState({ type: "", text: "" });
  const [copiedSecret, setCopiedSecret] = useState(false);
  const [copiedCodes, setCopiedCodes] = useState(false);

  // Sessions state
  const [sessions, setSessions] = useState([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [sessionMessage, setSessionMessage] = useState({ type: "", text: "" });

  // Fetch active sessions
  const fetchSessions = useCallback(async () => {
    try {
      setSessionsLoading(true);
      const res = await getActiveSessions();
      setSessions(res.sessions || []);
    } catch (err) {
      console.error("Failed to load sessions:", err);
    } finally {
      setSessionsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  useEffect(() => {
    if (user?.twoFactorEnabled !== undefined) {
      setTwoFactorEnabled(user.twoFactorEnabled);
    }
  }, [user]);

  // Handle Password Change
  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPwMessage({ type: "", text: "" });

    if (newPassword !== confirmPassword) {
      setPwMessage({ type: "error", text: "New password and confirmation do not match." });
      return;
    }

    try {
      setPwLoading(true);
      const res = await changePassword(currentPassword, newPassword, confirmPassword, revokeOthers);
      setPwMessage({ type: "success", text: res.message || "Password changed successfully." });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      fetchSessions();
    } catch (err) {
      setPwMessage({
        type: "error",
        text: err.response?.data?.message || "Failed to change password. Please check current password.",
      });
    } finally {
      setPwLoading(false);
    }
  };

  // Begin 2FA Setup
  const handleStart2FASetup = async () => {
    setTwoFactorMessage({ type: "", text: "" });
    try {
      setTwoFactorLoading(true);
      const data = await setup2FA();
      setSetupData(data);
      setVerificationCode("");
      setSetupModalOpen(true);
    } catch (err) {
      setTwoFactorMessage({
        type: "error",
        text: err.response?.data?.message || "Failed to initiate 2FA setup.",
      });
    } finally {
      setTwoFactorLoading(false);
    }
  };

  // Confirm 2FA Activation
  const handleConfirm2FASetup = async (e) => {
    e.preventDefault();
    setTwoFactorMessage({ type: "", text: "" });
    try {
      setTwoFactorLoading(true);
      await verify2FASetup(verificationCode);
      setTwoFactorEnabled(true);
      if (user) {
        saveUser({ ...user, twoFactorEnabled: true });
      }
      setSetupModalOpen(false);
      setTwoFactorMessage({
        type: "success",
        text: "Two-Factor Authentication (2FA) is now active on your account!",
      });
    } catch (err) {
      setTwoFactorMessage({
        type: "error",
        text: err.response?.data?.message || "Invalid verification code. Please check your authenticator clock.",
      });
    } finally {
      setTwoFactorLoading(false);
    }
  };

  // Confirm 2FA Disable
  const handleConfirmDisable2FA = async (e) => {
    e.preventDefault();
    setTwoFactorMessage({ type: "", text: "" });
    try {
      setTwoFactorLoading(true);
      await disable2FA(disablePassword, disableCode);
      setTwoFactorEnabled(false);
      if (user) {
        saveUser({ ...user, twoFactorEnabled: false });
      }
      setDisableModalOpen(false);
      setDisablePassword("");
      setDisableCode("");
      setTwoFactorMessage({
        type: "success",
        text: "Two-Factor Authentication has been disabled.",
      });
    } catch (err) {
      setTwoFactorMessage({
        type: "error",
        text: err.response?.data?.message || "Failed to disable 2FA. Incorrect password or code.",
      });
    } finally {
      setTwoFactorLoading(false);
    }
  };

  // Revoke Individual Session
  const handleRevokeSession = async (sessionId) => {
    try {
      await revokeSession(sessionId);
      setSessions((prev) => prev.filter((s) => s.sessionId !== sessionId));
      setSessionMessage({ type: "success", text: "Device session revoked." });
      setTimeout(() => setSessionMessage({ type: "", text: "" }), 3000);
    } catch (err) {
      console.error("Failed to revoke session:", err);
      alert("Failed to revoke session");
    }
  };

  // Logout other devices
  const handleLogoutOthers = async () => {
    if (!window.confirm("Are you sure you want to log out from all other active devices?")) return;
    try {
      await logoutOtherSessions();
      fetchSessions();
      setSessionMessage({ type: "success", text: "Logged out from all other devices." });
      setTimeout(() => setSessionMessage({ type: "", text: "" }), 3000);
    } catch (err) {
      console.error("Failed to log out other devices:", err);
      alert("Failed to log out other devices");
    }
  };

  // Logout all sessions
  const handleLogoutAll = async () => {
    if (!window.confirm("Log out of ALL sessions including this one? You will need to sign in again.")) return;
    try {
      await logoutAllSessions();
      logout();
    } catch (err) {
      console.error("Failed to log out all sessions:", err);
      alert("Failed to log out all sessions");
    }
  };

  const getDeviceIcon = (device = "") => {
    const d = device.toLowerCase();
    if (d.includes("mobile")) return <FiSmartphone size={18} />;
    if (d.includes("tablet")) return <FiTablet size={18} />;
    return <FiMonitor size={18} />;
  };

  return (
    <div className="space-y-8">
      {/* ── Section 1: Change Password ── */}
      <div
        className="rounded-3xl p-6 sm:p-8 border"
        style={{
          background: "var(--color-surface)",
          borderColor: "var(--color-border)",
        }}
      >
        <div className="flex items-center gap-3 mb-6">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: "rgba(37,99,235,0.12)", color: "var(--color-primary-light)" }}
          >
            <FiLock size={20} />
          </div>
          <div>
            <h2 className="text-xl font-bold">Change Password</h2>
            <p className="text-xs text-[var(--color-muted)]">
              Update your account password with enterprise strength validation
            </p>
          </div>
        </div>

        {pwMessage.text && (
          <div
            className={`mb-6 p-4 rounded-xl text-xs sm:text-sm flex items-center gap-2 border ${
              pwMessage.type === "success"
                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                : "bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-400"
            }`}
          >
            {pwMessage.type === "success" ? <FiCheck size={16} /> : <FiAlertTriangle size={16} />}
            <span>{pwMessage.text}</span>
          </div>
        )}

        <form onSubmit={handleChangePassword} className="space-y-4 max-w-xl">
          {/* Current Password */}
          <div>
            <label className="text-xs font-semibold block mb-1.5 text-[var(--color-heading)]">
              Current Password
            </label>
            <div className="relative">
              <input
                id="current-password-input"
                type={showCurrentPassword ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                className="w-full rounded-xl border px-4 py-2.5 text-sm outline-none transition"
                style={{
                  background: "var(--color-surface-alt)",
                  borderColor: "var(--color-border)",
                  color: "var(--color-heading)",
                }}
                placeholder="Enter your current password"
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-muted)] hover:text-[var(--color-heading)]"
              >
                {showCurrentPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div>
            <label className="text-xs font-semibold block mb-1.5 text-[var(--color-heading)]">
              New Password
            </label>
            <div className="relative">
              <input
                id="new-password-input"
                type={showNewPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                className="w-full rounded-xl border px-4 py-2.5 text-sm outline-none transition"
                style={{
                  background: "var(--color-surface-alt)",
                  borderColor: "var(--color-border)",
                  color: "var(--color-heading)",
                }}
                placeholder="Enter a new strong password"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-muted)] hover:text-[var(--color-heading)]"
              >
                {showNewPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
              </button>
            </div>
            {/* Visual Password Strength Meter */}
            <PasswordStrengthMeter password={newPassword} isAdmin={user?.role === "admin"} />
          </div>

          {/* Confirm New Password */}
          <div>
            <label className="text-xs font-semibold block mb-1.5 text-[var(--color-heading)]">
              Confirm New Password
            </label>
            <input
              id="confirm-password-input"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="w-full rounded-xl border px-4 py-2.5 text-sm outline-none transition"
              style={{
                background: "var(--color-surface-alt)",
                borderColor: "var(--color-border)",
                color: "var(--color-heading)",
              }}
              placeholder="Confirm your new password"
            />
          </div>

          <label className="flex items-center gap-2 pt-1 text-xs text-[var(--color-muted)] cursor-pointer">
            <input
              type="checkbox"
              checked={revokeOthers}
              onChange={(e) => setRevokeOthers(e.target.checked)}
              className="rounded"
            />
            <span>Log out from all other devices on password change</span>
          </label>

          <button
            type="submit"
            disabled={pwLoading || !currentPassword || !newPassword}
            className="mt-2 px-6 py-2.5 rounded-xl font-bold text-xs sm:text-sm text-white transition disabled:opacity-50"
            style={{ background: "var(--color-accent)" }}
          >
            {pwLoading ? "Updating..." : "Update Password"}
          </button>
        </form>
      </div>

      {/* ── Section 2: Two-Factor Authentication (TOTP) ── */}
      <div
        className="rounded-3xl p-6 sm:p-8 border"
        style={{
          background: "var(--color-surface)",
          borderColor: "var(--color-border)",
        }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{
                background: twoFactorEnabled ? "rgba(16,185,129,0.12)" : "rgba(245,158,11,0.12)",
                color: twoFactorEnabled ? "#10B981" : "#F59E0B",
              }}
            >
              <FiShield size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold">Two-Factor Authentication (2FA)</h2>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                    twoFactorEnabled
                      ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                      : "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                  }`}
                >
                  {twoFactorEnabled ? "Enabled" : "Disabled"}
                </span>
              </div>
              <p className="text-xs text-[var(--color-muted)]">
                Protect your account using standard TOTP authenticator apps (Google Authenticator, Authy, etc.)
              </p>
            </div>
          </div>

          <div>
            {twoFactorEnabled ? (
              <button
                type="button"
                onClick={() => setDisableModalOpen(true)}
                className="px-4 py-2 rounded-xl text-xs font-semibold border border-rose-500/30 text-rose-500 hover:bg-rose-500/10 transition"
              >
                Disable 2FA
              </button>
            ) : (
              <button
                type="button"
                onClick={handleStart2FASetup}
                disabled={twoFactorLoading}
                className="px-5 py-2.5 rounded-xl text-xs font-bold text-white transition hover:opacity-95"
                style={{ background: "#10B981" }}
              >
                {twoFactorLoading ? "Generating..." : "Enable 2FA Protection"}
              </button>
            )}
          </div>
        </div>

        {twoFactorMessage.text && (
          <div
            className={`p-4 rounded-xl text-xs sm:text-sm flex items-center gap-2 border mb-4 ${
              twoFactorMessage.type === "success"
                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                : "bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-400"
            }`}
          >
            {twoFactorMessage.type === "success" ? <FiCheck size={16} /> : <FiAlertTriangle size={16} />}
            <span>{twoFactorMessage.text}</span>
          </div>
        )}

        <div className="text-xs text-[var(--color-muted)] leading-relaxed space-y-2 max-w-2xl">
          <p>
            {user?.role === "admin"
              ? "⭐ Recommended for Admin Accounts: 2FA adds an essential second layer of defense, preventing unauthorized access even if your password is compromised."
              : "2FA adds an additional security check during login. Once enabled, you will be prompted for a 6-digit code or backup recovery code upon signing in."}
          </p>
        </div>
      </div>

      {/* ── Section 3: Active Session Management ── */}
      <div
        className="rounded-3xl p-6 sm:p-8 border"
        style={{
          background: "var(--color-surface)",
          borderColor: "var(--color-border)",
        }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: "rgba(168,85,247,0.12)", color: "#A855F7" }}
            >
              <FiMonitor size={20} />
            </div>
            <div>
              <h2 className="text-xl font-bold">Active Sessions</h2>
              <p className="text-xs text-[var(--color-muted)]">
                Manage all devices currently signed in to your account
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={fetchSessions}
              className="p-2 rounded-xl border border-[var(--color-border)] hover:bg-[var(--color-surface-alt)] transition text-[var(--color-muted)]"
              title="Refresh sessions"
            >
              <FiRefreshCw size={14} className={sessionsLoading ? "animate-spin" : ""} />
            </button>
            <button
              type="button"
              onClick={handleLogoutOthers}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold border border-[var(--color-border)] hover:bg-[var(--color-surface-alt)] transition text-[var(--color-heading)]"
            >
              Logout Other Devices
            </button>
            <button
              type="button"
              onClick={handleLogoutAll}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold border border-rose-500/30 text-rose-500 hover:bg-rose-500/10 transition"
            >
              Logout Everywhere
            </button>
          </div>
        </div>

        {sessionMessage.text && (
          <div className="mb-4 p-3 rounded-xl text-xs bg-emerald-500/10 border border-emerald-500/20 text-emerald-500">
            {sessionMessage.text}
          </div>
        )}

        {/* Sessions List */}
        <div className="space-y-3">
          {sessions.map((sess) => (
            <div
              key={sess.sessionId}
              className="p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition"
              style={{
                background: "var(--color-surface-alt)",
                borderColor: sess.isCurrent ? "var(--color-accent)" : "var(--color-border)",
              }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{
                    background: sess.isCurrent ? "rgba(220,95,0,0.12)" : "var(--color-surface)",
                    color: sess.isCurrent ? "var(--color-accent)" : "var(--color-muted)",
                  }}
                >
                  {getDeviceIcon(sess.device)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-[var(--color-heading)]">
                      {sess.browser} on {sess.os}
                    </span>
                    {sess.isCurrent && (
                      <span
                        className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white"
                        style={{ background: "var(--color-accent)" }}
                      >
                        This Device
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-[var(--color-muted)] mt-0.5">
                    <span>IP: {sess.ip}</span>
                    <span>•</span>
                    <span>Last active: {new Date(sess.lastActiveAt).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {!sess.isCurrent && (
                <button
                  type="button"
                  onClick={() => handleRevokeSession(sess.sessionId)}
                  className="self-end sm:self-center px-3 py-1.5 rounded-lg text-xs font-semibold border border-rose-500/30 text-rose-500 hover:bg-rose-500/10 transition"
                >
                  Revoke
                </button>
              )}
            </div>
          ))}

          {sessions.length === 0 && !sessionsLoading && (
            <div className="text-center py-6 text-xs text-[var(--color-muted)]">
              No other active sessions detected.
            </div>
          )}
        </div>
      </div>

      {/* ── Modal: 2FA Setup ── */}
      {setupModalOpen && setupData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div
            className="w-full max-w-lg rounded-3xl p-6 sm:p-8 border shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto"
            style={{
              background: "var(--color-surface)",
              borderColor: "var(--color-border)",
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FiShield className="text-emerald-500" size={22} />
                <h3 className="text-lg font-bold">Set Up Two-Factor Authentication</h3>
              </div>
              <button
                type="button"
                onClick={() => setSetupModalOpen(false)}
                className="p-1 rounded-lg text-[var(--color-muted)] hover:text-[var(--color-heading)]"
              >
                <FiX size={20} />
              </button>
            </div>

            <p className="text-xs text-[var(--color-muted)] leading-relaxed">
              1. Scan this QR code using Google Authenticator, Authy, or Microsoft Authenticator:
            </p>

            {/* QR Code */}
            <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-white border">
              <img src={setupData.qrCode} alt="2FA QR Code" className="w-48 h-48 rounded" />
            </div>

            {/* Manual Secret Key */}
            <div>
              <p className="text-xs text-[var(--color-muted)] mb-1">
                Can't scan? Enter this secret manually in your app:
              </p>
              <div className="flex items-center justify-between p-2.5 rounded-xl border font-mono text-xs bg-[var(--color-surface-alt)]">
                <span className="truncate">{setupData.secret}</span>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(setupData.secret);
                    setCopiedSecret(true);
                    setTimeout(() => setCopiedSecret(false), 2000);
                  }}
                  className="p-1 text-[var(--color-muted)] hover:text-[var(--color-heading)]"
                  title="Copy secret"
                >
                  {copiedSecret ? <FiCheck className="text-emerald-500" /> : <FiCopy />}
                </button>
              </div>
            </div>

            {/* Backup Recovery Codes */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-[var(--color-heading)]">
                  Save Your Backup Recovery Codes:
                </span>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(setupData.recoveryCodes.join("\n"));
                    setCopiedCodes(true);
                    setTimeout(() => setCopiedCodes(false), 2000);
                  }}
                  className="text-[11px] font-semibold text-[var(--color-accent)] hover:underline flex items-center gap-1"
                >
                  {copiedCodes ? <FiCheck /> : <FiCopy />} Copy All
                </button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 p-3 rounded-xl border bg-[var(--color-surface-alt)] font-mono text-[11px] text-center">
                {setupData.recoveryCodes.map((code) => (
                  <span key={code} className="bg-[var(--color-surface)] py-1 rounded border">
                    {code}
                  </span>
                ))}
              </div>
              <p className="text-[10px] text-[var(--color-muted)] mt-1">
                Store these safely! Each code can be used once if you lose your phone.
              </p>
            </div>

            {/* Verify Code Form */}
            <form onSubmit={handleConfirm2FASetup} className="pt-2 border-t border-[var(--color-border)] space-y-3">
              <label className="text-xs font-semibold block text-[var(--color-heading)]">
                2. Enter the 6-digit code shown in your app to activate:
              </label>
              <input
                type="text"
                maxLength={6}
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                placeholder="123456"
                className="w-full text-center text-xl tracking-widest font-mono font-bold py-2.5 rounded-xl border outline-none bg-[var(--color-surface-alt)] border-[var(--color-border)]"
                required
              />

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSetupModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-[var(--color-muted)] hover:text-[var(--color-heading)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={twoFactorLoading || verificationCode.length < 6}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-white transition disabled:opacity-50"
                  style={{ background: "#10B981" }}
                >
                  {twoFactorLoading ? "Verifying..." : "Activate 2FA"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal: 2FA Disable ── */}
      {disableModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div
            className="w-full max-w-md rounded-3xl p-6 sm:p-8 border shadow-2xl space-y-5"
            style={{
              background: "var(--color-surface)",
              borderColor: "var(--color-border)",
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-rose-500">
                <FiAlertTriangle size={22} />
                <h3 className="text-lg font-bold text-[var(--color-heading)]">Disable 2FA</h3>
              </div>
              <button
                type="button"
                onClick={() => setDisableModalOpen(false)}
                className="p-1 rounded-lg text-[var(--color-muted)] hover:text-[var(--color-heading)]"
              >
                <FiX size={20} />
              </button>
            </div>

            <p className="text-xs text-[var(--color-muted)] leading-relaxed">
              Disabling 2FA will lower your account security. Please verify your password to confirm:
            </p>

            <form onSubmit={handleConfirmDisable2FA} className="space-y-4">
              <div>
                <label className="text-xs font-semibold block mb-1">Account Password</label>
                <input
                  type="password"
                  value={disablePassword}
                  onChange={(e) => setDisablePassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  className="w-full rounded-xl border px-4 py-2.5 text-sm outline-none bg-[var(--color-surface-alt)] border-[var(--color-border)]"
                />
              </div>

              <div>
                <label className="text-xs font-semibold block mb-1">
                  6-Digit Authenticator Code (Optional)
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={disableCode}
                  onChange={(e) => setDisableCode(e.target.value)}
                  placeholder="123456"
                  className="w-full rounded-xl border px-4 py-2.5 text-sm font-mono outline-none bg-[var(--color-surface-alt)] border-[var(--color-border)]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setDisableModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-[var(--color-muted)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={twoFactorLoading || !disablePassword}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 transition disabled:opacity-50"
                >
                  {twoFactorLoading ? "Disabling..." : "Confirm Disable"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
