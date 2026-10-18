/**
 * Validates password strength according to enterprise security standards.
 * Requirements:
 * - At least 8 characters long (10+ recommended)
 * - Contains at least one uppercase letter (A-Z)
 * - Contains at least one lowercase letter (a-z)
 * - Contains at least one number (0-9)
 * - Contains at least one special character (!@#$%^&*...)
 *
 * @param {string} password
 * @param {object} [options]
 * @param {boolean} [options.isAdmin=false] - If true, enforces stricter length (minimum 10 chars)
 * @returns {{ isValid: boolean, score: number, strength: string, errors: string[] }}
 */
export function validatePasswordStrength(password, options = {}) {
  const { isAdmin = false } = options;
  const errors = [];
  let score = 0;

  if (!password || typeof password !== "string") {
    return {
      isValid: false,
      score: 0,
      strength: "weak",
      errors: ["Password is required"],
    };
  }

  const minLength = isAdmin ? 10 : 8;
  if (password.length < minLength) {
    errors.push(
      isAdmin
        ? "Admin passwords must be at least 10 characters long"
        : "Password must be at least 8 characters long"
    );
  } else {
    score += 25;
    if (password.length >= 12) score += 10;
  }

  if (!/[A-Z]/.test(password)) {
    errors.push("Password must contain at least one uppercase letter (A-Z)");
  } else {
    score += 20;
  }

  if (!/[a-z]/.test(password)) {
    errors.push("Password must contain at least one lowercase letter (a-z)");
  } else {
    score += 20;
  }

  if (!/[0-9]/.test(password)) {
    errors.push("Password must contain at least one number (0-9)");
  } else {
    score += 15;
  }

  if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?~`]/.test(password)) {
    errors.push("Password must contain at least one special character (e.g. !@#$%^&*)");
  } else {
    score += 15;
  }

  // Cap score between 0 and 100
  score = Math.min(100, Math.max(0, score));

  let strength = "weak";
  if (score >= 80) {
    strength = "strong";
  } else if (score >= 60) {
    strength = "good";
  } else if (score >= 40) {
    strength = "fair";
  }

  return {
    isValid: errors.length === 0,
    score,
    strength,
    errors,
  };
}

export default validatePasswordStrength;
