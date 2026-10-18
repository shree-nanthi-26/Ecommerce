import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    role: {
      type: String,
      enum: ["customer", "admin"],
      default: "customer",
    },
    // Password reset fields
    resetPasswordToken: { type: String },
    resetPasswordExpires: { type: Date },
    // Email verification fields
    isVerified: { type: Boolean, default: false },
    verificationToken: { type: String },
    verificationTokenExpires: { type: Date },
    // Email Notification & Marketing Preferences (Abandoned cart, deals, reminders)
    emailPreferences: {
      marketingEmails: { type: Boolean, default: true },
      abandonedCartEmails: { type: Boolean, default: true },
    },
    unsubscribeToken: {
      type: String,
      index: true,
    },
    // Account Security & Brute-Force Protection
    failedLoginAttempts: {
      type: Number,
      default: 0,
    },
    lockUntil: {
      type: Date,
      default: null,
    },
    tokenVersion: {
      type: Number,
      default: 0,
    },
    passwordChangedAt: {
      type: Date,
    },
    // Two-Factor Authentication (TOTP)
    twoFactorEnabled: {
      type: Boolean,
      default: false,
    },
    twoFactorSecretEncrypted: {
      type: String,
      select: false,
    },
    twoFactorIv: {
      type: String,
      select: false,
    },
    twoFactorAuthTag: {
      type: String,
      select: false,
    },
    twoFactorRecoveryCodes: {
      type: [String],
      select: false,
      default: [],
    },
  },
  {
    timestamps: true,
  }
);


userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    return next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

userSchema.methods.isLocked = function () {
  return Boolean(this.lockUntil && this.lockUntil > Date.now());
};

userSchema.methods.recordFailedLogin = async function () {
  const attempts = (this.failedLoginAttempts || 0) + 1;
  this.failedLoginAttempts = attempts;

  // Temporary lockout: 5 attempts -> 15 mins lock; 10+ attempts -> 60 mins lock
  if (attempts >= 10) {
    this.lockUntil = new Date(Date.now() + 60 * 60 * 1000);
  } else if (attempts >= 5) {
    this.lockUntil = new Date(Date.now() + 15 * 60 * 1000);
  }

  return this.save();
};

userSchema.methods.resetFailedLogins = async function () {
  if (this.failedLoginAttempts > 0 || this.lockUntil) {
    this.failedLoginAttempts = 0;
    this.lockUntil = null;
    return this.save();
  }
  return this;
};

const User = mongoose.model("User", userSchema);
export default User;
