import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12; // Standard for AES-GCM

/**
 * Derives a 32-byte master encryption key from environment secrets.
 */
function getMasterKey() {
  const secret = process.env.ENCRYPTION_KEY || process.env.JWT_SECRET || "furniva_fallback_secure_encryption_key_2026";
  return crypto.createHash("sha256").update(secret).digest();
}

/**
 * Encrypts a plaintext string (e.g. TOTP secret) using AES-256-GCM.
 *
 * @param {string} text
 * @returns {{ encrypted: string, iv: string, authTag: string }}
 */
export function encryptSecret(text) {
  if (!text) return null;
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, getMasterKey(), iv);
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  const authTag = cipher.getAuthTag().toString("hex");

  return {
    encrypted,
    iv: iv.toString("hex"),
    authTag,
  };
}

/**
 * Decrypts an AES-256-GCM encrypted string.
 *
 * @param {string} encrypted
 * @param {string} ivHex
 * @param {string} authTagHex
 * @returns {string} Plaintext string
 */
export function decryptSecret(encrypted, ivHex, authTagHex) {
  if (!encrypted || !ivHex || !authTagHex) return null;
  try {
    const iv = Buffer.from(ivHex, "hex");
    const authTag = Buffer.from(authTagHex, "hex");
    const decipher = crypto.createDecipheriv(ALGORITHM, getMasterKey(), iv);
    decipher.setAuthTag(authTag);
    let decrypted = decipher.update(encrypted, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  } catch (error) {
    console.error("Decryption error:", error.message);
    return null;
  }
}

/**
 * Generates an array of secure alphanumeric backup recovery codes (e.g. "A1B2-C3D4").
 *
 * @param {number} [count=8]
 * @returns {string[]}
 */
export function generateRecoveryCodes(count = 8) {
  const codes = [];
  for (let i = 0; i < count; i++) {
    const part1 = crypto.randomBytes(2).toString("hex").toUpperCase();
    const part2 = crypto.randomBytes(2).toString("hex").toUpperCase();
    codes.push(`${part1}-${part2}`);
  }
  return codes;
}

/**
 * Hashes a backup recovery code for secure storage in database.
 *
 * @param {string} code
 * @returns {string}
 */
export function hashRecoveryCode(code) {
  const normalized = code.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
  return crypto.createHash("sha256").update(normalized).digest("hex");
}

/**
 * Verifies a provided backup recovery code against an array of hashed codes.
 *
 * @param {string} candidateCode
 * @param {string[]} hashedCodes
 * @returns {number} Index of matched code, or -1 if not found
 */
export function verifyRecoveryCode(candidateCode, hashedCodes = []) {
  if (!candidateCode || !Array.isArray(hashedCodes)) return -1;
  const hashedCandidate = hashRecoveryCode(candidateCode);
  return hashedCodes.findIndex((h) => h === hashedCandidate);
}
