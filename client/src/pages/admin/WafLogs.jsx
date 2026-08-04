import { useEffect, useState } from "react";
import { FiAlertOctagon, FiSlash, FiShield } from "react-icons/fi";
import { getAttackLogs, blockIP } from "../../services/adminService";

function WafLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [blockingIp, setBlockingIp] = useState(null);

  useEffect(() => {
    async function fetchLogs() {
      try {
        setLoading(true);
        const data = await getAttackLogs();
        setLogs(data);
      } catch (err) {
        setError("Failed to load WAF security attack logs.");
      } finally {
        setLoading(false);
      }
    }
    fetchLogs();
  }, []);

  const handleBlockIp = async (ip) => {
    const reason = window.prompt(`Enter block reason for IP ${ip}:`, "Suspicious activity / trigger WAF rules");
    if (reason === null) return; // user cancelled prompt

    try {
      setBlockingIp(ip);
      await blockIP(ip, reason);
      alert(`IP address ${ip} has been successfully banned!`);
    } catch (err) {
      alert("Failed to block IP.");
    } finally {
      setBlockingIp(null);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center text-lg" style={{ color: "var(--color-muted)" }}>
        Loading WAF security logs…
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold flex items-center gap-2">
          <FiShield style={{ color: "var(--color-danger)" }} />
          <span>WAF Attack Logs</span>
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--color-muted)" }}>
          Real-time security report tracking malicious payloads, script injections, and scanning behavior
        </p>
      </div>

      {error ? (
        <div className="text-rose-500 text-center py-10">{error}</div>
      ) : logs.length === 0 ? (
        <div
          className="rounded-3xl p-16 text-center border"
          style={{
            background: "var(--color-surface)",
            borderColor: "var(--color-border)",
          }}
        >
          <h2 className="text-xl font-bold">No Attack Logs</h2>
          <p className="mt-2 text-sm" style={{ color: "var(--color-muted)" }}>
            Your WAF firewall has not detected any security anomalies or malicious attempts.
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
                  <th className="py-4 px-6 font-semibold">Severity</th>
                  <th className="py-4 px-6 font-semibold">IP Address</th>
                  <th className="py-4 px-6 font-semibold">Attack Type</th>
                  <th className="py-4 px-6 font-semibold">Request Path</th>
                  <th className="py-4 px-6 font-semibold">Timestamp</th>
                  <th className="py-4 px-6 font-semibold text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: "var(--color-border)" }}>
                {logs.map((log) => {
                  const logId = log._id || log.id;
                  const isBlocking = blockingIp === log.ip;

                  return (
                    <tr key={logId} className="hover:bg-[var(--color-surface-alt)] transition">
                      {/* Severity icon indicator */}
                      <td className="py-4 px-6">
                        <span
                          className="inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full"
                          style={{
                            background: log.severity >= 8 ? "rgba(239,68,68,0.12)" : "rgba(245,158,11,0.12)",
                            color: log.severity >= 8 ? "var(--color-danger)" : "var(--color-warning)",
                          }}
                        >
                          <FiAlertOctagon />
                          <span>Lv.{log.severity}</span>
                        </span>
                      </td>

                      {/* IP address */}
                      <td className="py-4 px-6 font-mono text-xs">{log.ip}</td>

                      {/* Attack Type */}
                      <td className="py-4 px-6 font-bold text-xs">{log.attackType}</td>

                      {/* Request Path */}
                      <td className="py-4 px-6">
                        <span className="font-semibold text-xs font-mono bg-[var(--color-surface-alt)] px-2 py-1 rounded border border-[var(--color-border)]">
                          {log.method} {log.url}
                        </span>
                        {log.details && (
                          <p className="text-[10px] mt-1.5" style={{ color: "var(--color-muted)" }}>
                            Details: {log.details}
                          </p>
                        )}
                      </td>

                      {/* Timestamp */}
                      <td className="py-4 px-6 text-xs text-[var(--color-muted)]">
                        {new Date(log.timestamp).toLocaleString("en-IN")}
                      </td>

                      {/* Ban button */}
                      <td className="py-4 px-6 text-center">
                        <button
                          onClick={() => handleBlockIp(log.ip)}
                          disabled={isBlocking}
                          className="flex items-center justify-center gap-1.5 mx-auto text-xs font-bold rounded-lg border px-3 py-1.5 transition text-rose-500 border-rose-500 hover:bg-rose-500/10 disabled:opacity-30"
                        >
                          <FiSlash size={14} />
                          <span>{isBlocking ? "Banning…" : "Ban IP"}</span>
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
  );
}

export default WafLogs;
