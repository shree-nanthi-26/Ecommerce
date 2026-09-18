import AuditLog from "../models/AuditLog.js";

export async function logAudit(req, { action, target, oldValue, newValue, reason }) {
  try {
    const admin = req.user ? req.user._id : null;
    const ip = req.ip || req.headers["x-forwarded-for"]?.split(',')[0].trim() || req.connection.remoteAddress;

    await AuditLog.create({
      admin,
      action,
      target,
      oldValue,
      newValue,
      reason,
      ip,
    });
  } catch (error) {
    console.error("Failed to write audit log:", error);
  }
}
