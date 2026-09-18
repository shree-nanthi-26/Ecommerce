import User from "../models/User.js";
import generateToken from "../utils/generateToken.js";
import crypto from "crypto";
import { sendEmail } from "../utils/sendEmail.js";
import { resetPasswordTemplate } from "../emailTemplates/resetPasswordTemplate.js";
import { verifyEmailTemplate } from "../emailTemplates/verifyEmailTemplate.js";

export async function registerUser(req, res, next) {
  try {
    const { name, email, password } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
      res.status(400);
      throw new Error("User already exists");
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

    const user = await User.findOne({ email });

    if (user && (await user.matchPassword(password))) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified || false,
        token: generateToken(user._id),
      });
    } else {
      res.status(401);
      throw new Error("Invalid email or password");
    }
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

    const { _id, name, email, role, isVerified, createdAt, updatedAt } = req.user;
    res.json({ _id, name, email, role, isVerified: !!isVerified, createdAt, updatedAt });
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
