import AuditLog from "../models/AuditLog.js";
import { redactSensitiveData } from "../utils/sanitizer.js";

/**
 * Log an administrative or security audit event.
 * Automatically sanitizes any sensitive credentials, tokens, or passwords from oldValue and newValue.
 */
export async function logAudit(req, { action, target, oldValue, newValue, reason }) {
  try {
    const admin = req.user ? req.user._id : null;
    const ip = req.headers?.["x-forwarded-for"]?.split(",")[0]?.trim() || req.ip || req.connection?.remoteAddress || "127.0.0.1";

    // Strictly sanitize oldValue and newValue to guarantee zero credential leakage
    const sanitizedOld = oldValue !== undefined && oldValue !== null ? redactSensitiveData(oldValue) : null;
    const sanitizedNew = newValue !== undefined && newValue !== null ? redactSensitiveData(newValue) : null;

    const entry = await AuditLog.create({
      admin,
      action: action?.toUpperCase() || "UNKNOWN_ACTION",
      target: {
        type: target?.type || "System",
        id: String(target?.id || "N/A"),
      },
      oldValue: sanitizedOld,
      newValue: sanitizedNew,
      reason: reason || "",
      ip,
      timestamp: new Date(),
    });

    return entry;
  } catch (error) {
    console.error("Failed to write audit log:", error);
    return null;
  }
}

/**
 * Express middleware for declarative audit logging on sensitive mutating routes.
 */
export function auditMiddleware({ action, getTarget, getReason } = {}) {
  return async (req, res, next) => {
    const originalJson = res.json.bind(res);

    res.json = function (data) {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        try {
          const target = typeof getTarget === "function" ? getTarget(req, data) : { type: "Resource", id: req.params.id || "bulk" };
          const reason = typeof getReason === "function" ? getReason(req, data) : "";
          logAudit(req, {
            action: action || `${req.method}_${req.baseUrl.split("/").pop()}`,
            target,
            oldValue: req._auditOldValue || null,
            newValue: req.body ? redactSensitiveData(req.body) : null,
            reason,
          });
        } catch (err) {
          console.error("Audit middleware error:", err);
        }
      }
      return originalJson(data);
    };

    next();
  };
}

export default { logAudit, auditMiddleware };
