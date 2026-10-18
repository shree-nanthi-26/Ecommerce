/**
 * Sensitive Data Sanitizer & Redactor
 * Automatically masks passwords, authentication tokens, API keys,
 * payment card data, cookies, and secret credentials across logs and responses.
 */

const SENSITIVE_KEY_REGEX = /password|passwd|token|secret|authorization|cookie|apiKey|api_key|key|creditCard|card_number|cardNumber|card|cvv|cvc|pin|jwt|refreshToken|accessToken|hash|salt|signature/i;

export function redactSensitiveData(data, depth = 0) {
  if (depth > 8) return "[MAX_DEPTH]";
  if (!data || typeof data !== "object") {
    if (typeof data === "string") {
      // Redact obvious JWT or Bearer token strings
      if (/^Bearer\s+[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.?[A-Za-z0-9-_.+/=]*$/i.test(data.trim())) {
        return "[REDACTED_JWT]";
      }
      // Redact credit card patterns (13-19 digits)
      if (/^\b(?:\d[ -]*?){13,19}\b$/.test(data.trim())) {
        return "[REDACTED_CARD]";
      }
    }
    return data;
  }

  if (Array.isArray(data)) {
    return data.map((item) => redactSensitiveData(item, depth + 1));
  }

  const plainObj = typeof data.toObject === "function" ? data.toObject() : data;
  const sanitized = {};

  for (const [key, value] of Object.entries(plainObj)) {
    if (typeof key === "string" && SENSITIVE_KEY_REGEX.test(key)) {
      sanitized[key] = "[REDACTED]";
    } else if (value && typeof value === "object") {
      sanitized[key] = redactSensitiveData(value, depth + 1);
    } else {
      sanitized[key] = redactSensitiveData(value, depth + 1);
    }
  }

  return sanitized;
}

export default redactSensitiveData;
