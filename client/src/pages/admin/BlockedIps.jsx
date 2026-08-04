import { useEffect, useState } from "react";
import { FiPlus, FiTrash2, FiClock, FiCheck } from "react-icons/fi";
import { getBlockedIPs, blockIP, unblockIP } from "../../services/adminService";

function BlockedIps() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Form state
  const [ip, setIp] = useState("");
  const [reason, setReason] = useState("");
  const [expiryHours, setExpiryHours] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function fetchList() {
      try {
        setLoading(true);
        const data = await getBlockedIPs();
        setList(data);
      } catch (err) {
        setError("Failed to load blocked IPs list.");
      } finally {
        setLoading(false);
      }
    }
    fetchList();
  }, []);

  const handleUnblock = async (entry) => {
    if (!window.confirm(`Are you sure you want to toggle the status of IP ${entry.ip}?`)) return;

    try {
      const updated = await unblockIP(entry._id || entry.id);
      setList((prev) =>
        prev.map((item) => ((item._id || item.id) === (entry._id || entry.id) ? updated : item))
      );
    } catch (err) {
      alert("Failed to unblock IP.");
    }
  };

  const handleAddBlock = async (e) => {
    e.preventDefault();
    if (!ip) {
      alert("IP Address is required.");
      return;
    }

    try {
      setSubmitting(true);
      let expiresAt;
      if (expiryHours) {
        expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + parseInt(expiryHours, 10));
      }

      const res = await blockIP(ip, reason || "Manual administrator ban", expiresAt);

      // Refresh list
      const updatedList = await getBlockedIPs();
      setList(updatedList);

      // Reset form
      setIp("");
      setReason("");
      setExpiryHours("");
      alert(`IP address ${ip} blocked successfully.`);
    } catch (err) {
      alert("Failed to block IP. Make sure the format is valid.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center text-lg" style={{ color: "var(--color-muted)" }}>
        Loading blocked IPs index…
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-rose-500">Banned IP Addresses</h1>
        <p className="mt-1 text-sm" style={{ color: "var(--color-muted)" }}>
          Control administrative firewall bans, add temporary restrictions, or restore client access
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Ban Form */}
        <div className="lg:col-span-1">
          <form
            onSubmit={handleAddBlock}
            className="rounded-3xl p-6 border space-y-5"
            style={{
              background: "var(--color-surface)",
              borderColor: "var(--color-border)",
            }}
          >
            <h3 className="font-bold text-lg border-b pb-2 flex items-center gap-2" style={{ borderColor: "var(--color-border)" }}>
              <FiPlus /> Add Firewall Ban
            </h3>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="ip-address-input" className="text-xs font-bold uppercase tracking-wider text-[var(--color-muted)]">
                IP Address *
              </label>
              <input
                id="ip-address-input"
                type="text"
                value={ip}
                onChange={(e) => setIp(e.target.value)}
                placeholder="e.g. 192.168.1.50"
                className="footer__newsletter-input"
                required
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="block-reason-input" className="text-xs font-bold uppercase tracking-wider text-[var(--color-muted)]">
                Reason / Note
              </label>
              <input
                id="block-reason-input"
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. SQL Injection payloads"
                className="footer__newsletter-input"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="duration-input" className="text-xs font-bold uppercase tracking-wider text-[var(--color-muted)]">
                Duration (hours, blank = permanent)
              </label>
              <input
                id="duration-input"
                type="number"
                value={expiryHours}
                onChange={(e) => setExpiryHours(e.target.value)}
                placeholder="e.g. 24"
                className="footer__newsletter-input"
                min="1"
              />
            </div>

            <button type="submit" disabled={submitting} className="btn-primary w-full py-3 flex items-center justify-center gap-1.5 mt-2">
              <FiPlus size={16} />
              <span>{submitting ? "Processing Ban…" : "Enforce IP Ban"}</span>
            </button>
          </form>
        </div>

        {/* Banned IPs list */}
        <div className="lg:col-span-2">
          {error ? (
            <div className="text-rose-500 text-center py-6">{error}</div>
          ) : list.length === 0 ? (
            <div
              className="rounded-3xl p-12 text-center border"
              style={{
                background: "var(--color-surface)",
                borderColor: "var(--color-border)",
              }}
            >
              <p className="font-bold text-sm" style={{ color: "var(--color-muted)" }}>
                No active IP bans present.
              </p>
            </div>
          ) : (
            <div
              className="rounded-3xl border overflow-hidden"
              style={{
                background: "var(--color-surface)",
                borderColor: "var(--color-border)",
              }}
            >
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr
                      className="border-b text-xs font-bold uppercase tracking-wider"
                      style={{
                        borderColor: "var(--color-border)",
                        color: "var(--color-muted)",
                        background: "var(--color-surface-alt)",
                      }}
                    >
                      <th className="py-4 px-6 font-semibold">IP Address</th>
                      <th className="py-4 px-6 font-semibold">Status</th>
                      <th className="py-4 px-6 font-semibold">Reason</th>
                      <th className="py-4 px-6 font-semibold">Expires</th>
                      <th className="py-4 px-6 font-semibold text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y" style={{ borderColor: "var(--color-border)" }}>
                    {list.map((item) => {
                      const id = item._id || item.id;
                      const hasExpiry = Boolean(item.expiresAt);
                      const isExpired = hasExpiry && new Date(item.expiresAt) < new Date();

                      return (
                        <tr key={id} className="hover:bg-[var(--color-surface-alt)] transition">
                          {/* IP Address */}
                          <td className="py-4 px-6 font-mono text-xs">{item.ip}</td>

                          {/* Status */}
                          <td className="py-4 px-6">
                            {item.isActive && !isExpired ? (
                              <span className="text-xs font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-full">Active</span>
                            ) : (
                              <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">Lifted</span>
                            )}
                          </td>

                          {/* Reason */}
                          <td className="py-4 px-6 text-xs text-[var(--color-body)]">{item.reason || "—"}</td>

                          {/* Expiry */}
                          <td className="py-4 px-6 text-xs font-mono" style={{ color: "var(--color-muted)" }}>
                            {hasExpiry ? (
                              <span className="flex items-center gap-1">
                                <FiClock />
                                <span>
                                  {new Date(item.expiresAt).toLocaleDateString("en-IN", {
                                    month: "short",
                                    day: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </span>
                              </span>
                            ) : (
                              "Permanent"
                            )}
                          </td>

                          {/* Lift/Enforce toggle button */}
                          <td className="py-4 px-6 text-center">
                            <button
                              onClick={() => handleUnblock(item)}
                              className={`text-xs font-bold flex items-center gap-1 px-3 py-1.5 rounded-lg transition ${
                                item.isActive && !isExpired
                                  ? "text-emerald-400 border border-emerald-400 hover:bg-emerald-500/10"
                                  : "text-rose-400 border border-rose-400 hover:bg-rose-500/10"
                              }`}
                            >
                              {item.isActive && !isExpired ? <FiCheck /> : <FiTrash2 />}
                              <span>{item.isActive && !isExpired ? "Lift Ban" : "Re-Ban"}</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default BlockedIps;
