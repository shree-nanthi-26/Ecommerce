import { detectAttack } from "../services/wafService.js";
import AttackLog from "../models/AttackLog.js";
import BlockedIP from "../models/BlockedIP.js";
import redis from "../config/redis.js";

/**
 * WAF middleware that inspects incoming requests and decides whether to allow or block them.
 * The detection logic is delegated to `detectAttack` which returns an object describing the attack
 * (or null if the request is clean).
 */
function redactSensitiveData(obj) {
  if (!obj || typeof obj !== "object") return obj;

  const cloned = Array.isArray(obj) ? [] : {};
  
  for (const [key, value] of Object.entries(obj)) {
    if (
      typeof key === "string" &&
      /password|token|authorization|cookie|secret|key|passwd|signature|cvv|card/i.test(key)
    ) {
      cloned[key] = "[REDACTED]";
    } else if (value && typeof value === "object") {
      cloned[key] = redactSensitiveData(value);
    } else {
      cloned[key] = value;
    }
  }
  return cloned;
}

export const wafMiddleware = async (req, res, next) => {
  try {
    const ip = req.headers["x-forwarded-for"]?.split(',')[0].trim() || req.ip || req.connection.remoteAddress;
    
    // Check Redis cache for blocked IP status first (30s TTL)
    const redisBlockedKey = `waf:blocked:${ip}`;
    let isBlockedCached = null;

    try {
      isBlockedCached = await redis.get(redisBlockedKey);
    } catch {
      // Non-fatal if Redis read fails
    }

    if (isBlockedCached === "true") {
      return res.status(403).json({ message: "Your IP has been blocked by the security team.", code: "IP_BLOCKED" });
    }

    if (isBlockedCached === null) {
      const blockedEntry = await BlockedIP.findOne({
        ip,
        isActive: true,
        $or: [
          { expiresAt: { $exists: false } },
          { expiresAt: null },
          { expiresAt: { $gt: new Date() } }
        ]
      });

      if (blockedEntry) {
        try {
          await redis.setex(redisBlockedKey, 30, "true");
        } catch { /* ignore */ }
        return res.status(403).json({ message: "Your IP has been blocked by the security team.", code: "IP_BLOCKED" });
      } else {
        try {
          await redis.setex(redisBlockedKey, 30, "false");
        } catch { /* ignore */ }
      }
    }
    const attack = await detectAttack(req);
    if (attack) {
      const sanitizedQuery = redactSensitiveData(req.query);
      const sanitizedBody = redactSensitiveData(req.body);
      const sanitizedHeaders = redactSensitiveData(req.headers);
      const sanitizedCookies = redactSensitiveData(req.cookies);

      const logEntry = new AttackLog({
        ip,
        userAgent: req.headers["user-agent"] || "",
        method: req.method,
        url: req.originalUrl,
        payload: {
          query: sanitizedQuery,
          body: sanitizedBody,
          headers: sanitizedHeaders,
          cookies: sanitizedCookies,
        },
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
