// server/middleware/waf.js

import { detectAttack } from "../services/wafService.js";
import AttackLog from "../models/AttackLog.js";
import BlockedIP from "../models/BlockedIP.js";

/**
 * WAF middleware that inspects incoming requests and decides whether to allow or block them.
 * The detection logic is delegated to `detectAttack` which returns an object describing the attack
 * (or null if the request is clean).
 */
export const wafMiddleware = async (req, res, next) => {
  try {
    const ip = req.ip || req.headers["x-forwarded-for"]?.split(',')[0].trim() || req.connection.remoteAddress;
    const blockedEntry = await BlockedIP.findOne({ ip, isActive: true });
    if (blockedEntry) {
      return res.status(403).json({ message: "Your IP has been blocked by the security team.", code: "IP_BLOCKED" });
    }
    const attack = await detectAttack(req);
    if (attack) {
      const logEntry = new AttackLog({
        ip,
        userAgent: req.headers["user-agent"] || "",
        method: req.method,
        url: req.originalUrl,
        payload: { query: req.query, body: req.body, headers: req.headers, cookies: req.cookies },
        attackType: attack.type,
        severity: attack.severity,
        details: attack.details,
      });
      await logEntry.save();
      return res.status(403).json({ message: "Request blocked by SecureShield WAF.", attackType: attack.type, severity: attack.severity });
    }
    next();
  } catch (err) {
    console.error("WAF error:", err);
    next();
  }
};
