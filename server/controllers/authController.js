import User from "../models/User.js";
import Session from "../models/Session.js";
import generateToken from "../utils/generateToken.js";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { sendEmail } from "../utils/sendEmail.js";
import { resetPasswordTemplate } from "../emailTemplates/resetPasswordTemplate.js";
import { verifyEmailTemplate } from "../emailTemplates/verifyEmailTemplate.js";
import { validatePasswordStrength } from "../utils/passwordValidator.js";
import {
  encryptSecret,
  decryptSecret,
  generateRecoveryCodes,
  hashRecoveryCode,
  verifyRecoveryCode,
} from "../utils/cryptoUtils.js";
import { logAudit } from "../services/auditService.js";
import { generateSecret, generateURI, verifySync } from "otplib";
import qrcode from "qrcode";

export async function registerUser(req, res, next) {
  try {
    const { name, email, password } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
      res.status(400);
      throw new Error("User already exists");
    }

    const strength = validatePasswordStrength(password, { isAdmin: false });
    if (!strength.isValid) {
      res.status(400);
      throw new Error(strength.errors[0] || "Password does not meet security requirements");
    }

    const token = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.create({
      name,
      email,
      password,
      verificationToken: hashedToken,
      verificationTokenExpires: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
    });

    if (user) {
      // Send verification email in background (catch any mail error silently so registration succeeds)
      try {
        const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
        const verifyUrl = `${clientUrl}/verify-email/${token}`;
        const html = verifyEmailTemplate(verifyUrl);
        sendEmail(user.email, "Verify Your Furniva Account", html).catch(err =>
          console.error("Failed to send verification email:", err)
        );
      } catch (mailErr) {
        console.error("Verification email trigger error:", mailErr);
      }

      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified || false,
        token: generateToken(user._id),
      });
    } else {
      res.status(400);
      throw new Error("Invalid user data");
    }
  } catch (error) {
    next(error);
  }
}

export async function loginUser(req, res, next) {
  try {
    const { email, password } = req.body;
    const ip =
      req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
      req.ip ||
      req.connection?.remoteAddress ||
      "127.0.0.1";
    const userAgent = req.headers["user-agent"] || "";

    const user = await User.findOne({ email }).select(
      "+twoFactorSecretEncrypted +twoFactorIv +twoFactorAuthTag"
    );

    // 1. Check temporary lockout status
    if (user && user.isLocked()) {
      const remainingMins = Math.ceil((user.lockUntil - Date.now()) / (60 * 1000));
      res.status(423);
      throw new Error(
        `Account is temporarily locked due to repeated failed attempts. Please try again in ${remainingMins} minute(s).`
      );
    }

    // 2. Validate password
    if (user && (await user.matchPassword(password))) {
      // Reset failed login counter on success
      await user.resetFailedLogins();

      // Check if Two-Factor Authentication is enabled
      if (user.twoFactorEnabled) {
        const tempToken = jwt.sign(
          { id: user._id, email: user.email, purpose: "2fa_challenge" },
          process.env.JWT_SECRET,
          { expiresIn: "5m" }
        );

        return res.json({
          require2FA: true,
          tempToken,
          email: user.email,
          message: "Please enter your 6-digit authenticator code or backup recovery code.",
        });
      }

      // Generate active session record
      const sessionId = crypto.randomUUID
        ? crypto.randomUUID()
        : crypto.randomBytes(16).toString("hex");
      const { device, browser, os } = Session.parseUserAgent(userAgent);
      const token = generateToken(user._id, {
        sessionId,
        tokenVersion: user.tokenVersion || 0,
      });
      const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

      await Session.create({
        user: user._id,
        sessionId,
        tokenHash,
        ip,
        userAgent,
        device,
        browser,
        os,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      }).catch((err) => console.error("Session creation error:", err));

      return res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified || false,
        twoFactorEnabled: !!user.twoFactorEnabled,
        token,
      });
    }

    // 3. Failed password or account not found
    if (user) {
      await user.recordFailedLogin();
    } else {
      // Constant-time compare to mitigate user-enumeration timing leaks
      await bcrypt.compare(
        password || "",
        "$2a$10$abcdefghijklmnopqrstuvwxyzaBCDEFGHIJKLMNOPQRSTU"
      );
    }

    const maskedEmail = email
      ? email.replace(
          /^(.)(.*)(@.*)$/,
          (_, first, middle, domain) =>
            `${first}${"*".repeat(Math.min(middle.length, 5))}${domain}`
        )
      : "unknown";

    import("../models/AttackLog.js")
      .then(({ default: AttackLog }) => {
        AttackLog.create({
          ip,
          userAgent,
          method: req.method,
          url: req.originalUrl,
          attackType: "Authentication Failure",
          severity: 7,
          details: `Failed sign-in attempt for account: ${maskedEmail}`,
          payload: {
            targetAccount: maskedEmail,
            method: req.method,
          },
        }).catch((err) => console.error("Auth failure log error:", err));
      })
      .catch(() => {});

    if (user && user.isLocked()) {
      res.status(423);
      throw new Error(
        "Too many failed login attempts. Account has been temporarily locked for 15 minutes."
      );
    }

    const remainingAttempts = user ? Math.max(0, 5 - user.failedLoginAttempts) : 4;
    res.status(401);
    throw new Error(
      `Invalid email or password.${
        user
          ? ` ${remainingAttempts} attempt(s) remaining before temporary lockout.`
          : ""
      }`
    );
  } catch (error) {
    next(error);
  }
}

export async function getMe(req, res, next) {
  try {
    if (!req.user) {
      res.status(401);
      throw new Error("Not authorized");
    }

    const {
      _id,
      name,
      email,
      role,
      isVerified,
      twoFactorEnabled,
      createdAt,
      updatedAt,
    } = req.user;
    res.json({
      _id,
      name,
      email,
      role,
      isVerified: !!isVerified,
      twoFactorEnabled: !!twoFactorEnabled,
      createdAt,
      updatedAt,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /auth/forgot-password
 * Sends password reset email if user exists.
 */
export async function forgotPassword(req, res, next) {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(200).json({ message: "Password reset email sent if user exists" });
    }
    const token = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpires = Date.now() + 60 * 60 * 1000; // 1 hour
    await user.save();

    const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
    const resetUrl = `${clientUrl}/reset-password/${token}`;
    const html = resetPasswordTemplate(resetUrl);
    await sendEmail(user.email, "Furniva Password Reset", html);
    res.status(200).json({ message: "Password reset email sent if user exists" });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /auth/reset-password/:token
 * Resets user password using token.
 */
export async function resetPassword(req, res, next) {
  try {
    const { token } = req.params;
    const { password } = req.body;
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() },
    });
    if (!user) {
      res.status(400);
      throw new Error("Invalid or expired password reset token");
    }
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();
    res.json({ message: "Password has been reset successfully" });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /auth/verify-email/:token
 * Verifies user's email address.
 */
export async function verifyEmail(req, res, next) {
  try {
    const { token } = req.params;
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
    const user = await User.findOne({
      verificationToken: hashedToken,
      verificationTokenExpires: { $gt: Date.now() },
    });
    if (!user) {
      res.status(400);
      throw new Error("Invalid or expired verification token");
    }
    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpires = undefined;
    await user.save();
    res.json({ message: "Email verified successfully" });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /auth/resend-verification
 * Resends verification email for protected user context.
 */
export async function resendVerification(req, res, next) {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      res.status(404);
      throw new Error("User not found");
    }
    if (user.isVerified) {
      return res.status(400).json({ message: "Email is already verified" });
    }
    const token = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
    user.verificationToken = hashedToken;
    user.verificationTokenExpires = Date.now() + 24 * 60 * 60 * 1000;
    await user.save();

    const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
    const verifyUrl = `${clientUrl}/verify-email/${token}`;
    const html = verifyEmailTemplate(verifyUrl);
    await sendEmail(user.email, "Verify Your Furniva Account", html);

    res.json({ message: "Verification email resent successfully" });
  } catch (error) {
    next(error);
  }
}

/**
 * GET/POST /api/auth/unsubscribe
 * Allows users to opt out of reminder/marketing emails via secure token without login
 */
export async function unsubscribeUser(req, res, next) {
  try {
    const token = req.query.token || req.body?.token;
    const type = req.query.type || req.body?.type || "abandonedCart";

    if (!token) {
      res.status(400);
      throw new Error("Missing unsubscribe token");
    }

    const { optOutByToken } = await import("../services/abandonedCartService.js");
    const result = await optOutByToken(token, type);

    res.json(result);
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/auth/preferences
 * Fetch user's email/notification preferences
 */
export async function getEmailPreferences(req, res, next) {
  try {
    const user = await User.findById(req.user._id).select("emailPreferences email name");
    if (!user) {
      res.status(404);
      throw new Error("User not found");
    }

    res.json({
      success: true,
      emailPreferences: user.emailPreferences || {
        marketingEmails: true,
        abandonedCartEmails: true,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * PUT /api/auth/preferences
 * Update user's email/notification preferences
 */
export async function updateEmailPreferences(req, res, next) {
  try {
    const { marketingEmails, abandonedCartEmails } = req.body;
    const { updateUserEmailPreferences } = await import("../services/abandonedCartService.js");

    const result = await updateUserEmailPreferences(req.user._id, {
      marketingEmails,
      abandonedCartEmails,
    });

    res.json(result);
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/auth/change-password
 * Change password with strength validation and session invalidation option
 */
export async function changePassword(req, res, next) {
  try {
    const { currentPassword, newPassword, confirmPassword, revokeOtherSessions = true } = req.body;

    if (!currentPassword || !newPassword) {
      res.status(400);
      throw new Error("Current password and new password are required");
    }

    if (confirmPassword && newPassword !== confirmPassword) {
      res.status(400);
      throw new Error("New password and confirm password do not match");
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      res.status(404);
      throw new Error("User not found");
    }

    // Verify current password
    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      res.status(400);
      throw new Error("Incorrect current password");
    }

    // Enforce password strength
    const strength = validatePasswordStrength(newPassword, {
      isAdmin: user.role === "admin",
    });
    if (!strength.isValid) {
      res.status(400);
      throw new Error(strength.errors[0] || "New password does not meet security requirements");
    }

    // Prevent reusing current password
    const isSamePassword = await user.matchPassword(newPassword);
    if (isSamePassword) {
      res.status(400);
      throw new Error("New password cannot be the same as your current password");
    }

    // Update password
    user.password = newPassword;
    user.passwordChangedAt = new Date();
    user.tokenVersion = (user.tokenVersion || 0) + 1;
    await user.save();

    // Revoke sessions if requested
    if (revokeOtherSessions) {
      const currentSessionId = req.tokenPayload?.sessionId;
      if (currentSessionId) {
        await Session.updateMany(
          { user: user._id, sessionId: { $ne: currentSessionId } },
          { isRevoked: true }
        );
      } else {
        await Session.updateMany({ user: user._id }, { isRevoked: true });
      }
    }

    // Issue refreshed token for the current session
    const currentSessionId = req.tokenPayload?.sessionId || crypto.randomUUID();
    const token = generateToken(user._id, {
      sessionId: currentSessionId,
      tokenVersion: user.tokenVersion,
    });

    logAudit(req, {
      action: "CHANGE_PASSWORD",
      target: { type: "User", id: user._id },
      reason: "User changed account password",
    });

    res.json({
      success: true,
      message: "Password changed successfully",
      token,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/auth/2fa/validate-login
 * Complete login challenge using TOTP 6-digit code or backup recovery code
 */
export async function validate2FALogin(req, res, next) {
  try {
    const { tempToken, code, recoveryCode } = req.body;
    const ip =
      req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
      req.ip ||
      req.connection?.remoteAddress ||
      "127.0.0.1";
    const userAgent = req.headers["user-agent"] || "";

    if (!tempToken) {
      res.status(400);
      throw new Error("Missing 2FA challenge token");
    }

    let decoded;
    try {
      decoded = jwt.verify(tempToken, process.env.JWT_SECRET);
      if (decoded.purpose !== "2fa_challenge") {
        throw new Error("Invalid challenge purpose");
      }
    } catch {
      res.status(401);
      throw new Error("2FA challenge session has expired. Please sign in again.");
    }

    const user = await User.findById(decoded.id).select(
      "+twoFactorSecretEncrypted +twoFactorIv +twoFactorAuthTag +twoFactorRecoveryCodes"
    );

    if (!user || !user.twoFactorEnabled) {
      res.status(400);
      throw new Error("Two-Factor Authentication is not configured for this account");
    }

    let verified = false;

    // Check if user is using a backup recovery code
    if (recoveryCode) {
      const matchIndex = verifyRecoveryCode(recoveryCode, user.twoFactorRecoveryCodes);
      if (matchIndex >= 0) {
        verified = true;
        // Invalidate used recovery code
        user.twoFactorRecoveryCodes.splice(matchIndex, 1);
        await user.save();
      } else {
        res.status(401);
        throw new Error("Invalid backup recovery code");
      }
    } else if (code) {
      // Verify TOTP authenticator code
      const secret = decryptSecret(
        user.twoFactorSecretEncrypted,
        user.twoFactorIv,
        user.twoFactorAuthTag
      );

      if (!secret) {
        res.status(500);
        throw new Error("Failed to decrypt 2FA authentication secret");
      }

      const result = verifySync({ token: String(code).trim(), secret });
      if (result && result.valid) {
        verified = true;
      }
    } else {
      res.status(400);
      throw new Error("Please provide either a 6-digit authenticator code or backup recovery code");
    }

    if (!verified) {
      res.status(401);
      throw new Error("Invalid 6-digit authentication code");
    }

    // Generate active session
    const sessionId = crypto.randomUUID
      ? crypto.randomUUID()
      : crypto.randomBytes(16).toString("hex");
    const { device, browser, os } = Session.parseUserAgent(userAgent);
    const token = generateToken(user._id, {
      sessionId,
      tokenVersion: user.tokenVersion || 0,
    });
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

    await Session.create({
      user: user._id,
      sessionId,
      tokenHash,
      ip,
      userAgent,
      device,
      browser,
      os,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    }).catch((err) => console.error("Session creation error:", err));

    logAudit(req, {
      action: "2FA_LOGIN_SUCCESS",
      target: { type: "User", id: user._id },
      reason: recoveryCode ? "Logged in using 2FA recovery code" : "Logged in using TOTP code",
    });

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isVerified: user.isVerified || false,
      twoFactorEnabled: true,
      token,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/auth/2fa/setup
 * Generates TOTP secret, QR code, and backup recovery codes
 */
export async function setup2FA(req, res, next) {
  try {
    const user = await User.findById(req.user._id).select(
      "+twoFactorSecretEncrypted +twoFactorIv +twoFactorAuthTag"
    );

    if (!user) {
      res.status(404);
      throw new Error("User not found");
    }

    // Generate new TOTP secret & URI
    const secret = generateSecret();
    const otpUri = generateURI({
      issuer: "Furniva",
      label: user.email,
      secret,
    });

    // Generate QR code data URL
    const qrCode = await qrcode.toDataURL(otpUri);

    // Generate 8 backup recovery codes
    const recoveryCodes = generateRecoveryCodes(8);
    const hashedCodes = recoveryCodes.map(hashRecoveryCode);

    // Encrypt secret for storage
    const encrypted = encryptSecret(secret);

    // Store in user document (pending verification)
    user.twoFactorSecretEncrypted = encrypted.encrypted;
    user.twoFactorIv = encrypted.iv;
    user.twoFactorAuthTag = encrypted.authTag;
    user.twoFactorRecoveryCodes = hashedCodes;
    // Don't enable until verified with code!
    await user.save();

    res.json({
      success: true,
      secret,
      qrCode,
      otpUri,
      recoveryCodes,
      message:
        "Scan the QR code with your authenticator app (Google Authenticator, Authy, Microsoft Authenticator), then enter the 6-digit code to confirm.",
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/auth/2fa/verify-setup
 * Verifies code from authenticator app to enable 2FA
 */
export async function verify2FASetup(req, res, next) {
  try {
    const { code } = req.body;
    if (!code) {
      res.status(400);
      throw new Error("6-digit verification code is required");
    }

    const user = await User.findById(req.user._id).select(
      "+twoFactorSecretEncrypted +twoFactorIv +twoFactorAuthTag"
    );

    if (!user || !user.twoFactorSecretEncrypted) {
      res.status(400);
      throw new Error("No pending 2FA setup found. Please generate a setup key first.");
    }

    const secret = decryptSecret(
      user.twoFactorSecretEncrypted,
      user.twoFactorIv,
      user.twoFactorAuthTag
    );

    if (!secret) {
      res.status(500);
      throw new Error("Failed to decrypt secret");
    }

    const result = verifySync({ token: String(code).trim(), secret });
    if (!result || !result.valid) {
      res.status(400);
      throw new Error("Invalid verification code. Please check your authenticator clock and try again.");
    }

    user.twoFactorEnabled = true;
    await user.save();

    logAudit(req, {
      action: "ENABLE_2FA",
      target: { type: "User", id: user._id },
      reason: "User enabled TOTP Two-Factor Authentication",
    });

    res.json({
      success: true,
      twoFactorEnabled: true,
      message: "Two-Factor Authentication has been successfully enabled on your account.",
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/auth/2fa/disable
 * Disables 2FA (requires current password and TOTP code)
 */
export async function disable2FA(req, res, next) {
  try {
    const { password, code } = req.body;
    if (!password) {
      res.status(400);
      throw new Error("Password is required to disable 2FA");
    }

    const user = await User.findById(req.user._id).select(
      "+twoFactorSecretEncrypted +twoFactorIv +twoFactorAuthTag +twoFactorRecoveryCodes"
    );

    if (!user) {
      res.status(404);
      throw new Error("User not found");
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      res.status(400);
      throw new Error("Incorrect password");
    }

    // If code is provided, verify it too
    if (code && user.twoFactorSecretEncrypted) {
      const secret = decryptSecret(
        user.twoFactorSecretEncrypted,
        user.twoFactorIv,
        user.twoFactorAuthTag
      );
      if (secret) {
        const result = verifySync({ token: String(code).trim(), secret });
        if (!result || !result.valid) {
          res.status(400);
          throw new Error("Invalid authenticator code");
        }
      }
    }

    user.twoFactorEnabled = false;
    user.twoFactorSecretEncrypted = undefined;
    user.twoFactorIv = undefined;
    user.twoFactorAuthTag = undefined;
    user.twoFactorRecoveryCodes = [];
    await user.save();

    logAudit(req, {
      action: "DISABLE_2FA",
      target: { type: "User", id: user._id },
      reason: "User disabled Two-Factor Authentication",
    });

    res.json({
      success: true,
      twoFactorEnabled: false,
      message: "Two-Factor Authentication has been disabled.",
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/auth/sessions
 * List active sessions for the current user
 */
export async function getActiveSessions(req, res, next) {
  try {
    const sessions = await Session.find({
      user: req.user._id,
      isRevoked: false,
    })
      .sort({ lastActiveAt: -1 })
      .lean();

    const currentSessionId = req.tokenPayload?.sessionId;

    const formattedSessions = sessions.map((s) => ({
      _id: s._id,
      sessionId: s.sessionId,
      device: s.device,
      browser: s.browser,
      os: s.os,
      ip: s.ip,
      lastActiveAt: s.lastActiveAt,
      createdAt: s.createdAt,
      isCurrent: s.sessionId === currentSessionId,
    }));

    res.json({
      success: true,
      sessions: formattedSessions,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * DELETE /api/auth/sessions/:sessionId
 * Revoke a specific active session
 */
export async function revokeSession(req, res, next) {
  try {
    const { sessionId } = req.params;

    const session = await Session.findOneAndUpdate(
      { sessionId, user: req.user._id },
      { isRevoked: true },
      { new: true }
    );

    if (!session) {
      res.status(404);
      throw new Error("Session not found");
    }

    res.json({
      success: true,
      message: "Session successfully revoked",
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/auth/logout-all
 * Invalidate all existing sessions and increment tokenVersion
 */
export async function logoutAllSessions(req, res, next) {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      res.status(404);
      throw new Error("User not found");
    }

    user.tokenVersion = (user.tokenVersion || 0) + 1;
    await user.save();

    await Session.updateMany({ user: user._id }, { isRevoked: true });

    logAudit(req, {
      action: "LOGOUT_ALL_SESSIONS",
      target: { type: "User", id: user._id },
      reason: "User revoked all active sessions",
    });

    res.json({
      success: true,
      message: "Successfully logged out from all sessions",
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/auth/logout-others
 * Invalidate all sessions except the current one
 */
export async function logoutOtherSessions(req, res, next) {
  try {
    const currentSessionId = req.tokenPayload?.sessionId;

    if (!currentSessionId) {
      // If legacy token without sessionId, fallback to logout-all
      return logoutAllSessions(req, res, next);
    }

    await Session.updateMany(
      { user: req.user._id, sessionId: { $ne: currentSessionId } },
      { isRevoked: true }
    );

    res.json({
      success: true,
      message: "Successfully logged out from all other devices",
    });
  } catch (error) {
    next(error);
  }
}


