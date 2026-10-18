import mongoose from "mongoose";

const sessionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    sessionId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    tokenHash: {
      type: String,
      required: true,
      index: true,
    },
    ip: {
      type: String,
      default: "127.0.0.1",
    },
    userAgent: {
      type: String,
      default: "",
    },
    device: {
      type: String,
      default: "Desktop",
    },
    browser: {
      type: String,
      default: "Unknown Browser",
    },
    os: {
      type: String,
      default: "Unknown OS",
    },
    lastActiveAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    expiresAt: {
      type: Date,
    },
    isRevoked: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// TTL index to automatically purge expired sessions after 30 days
sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

/**
 * Parses user agent string to extract human-readable client information.
 */
sessionSchema.statics.parseUserAgent = function (userAgent = "") {
  let browser = "Web Browser";
  let os = "Unknown OS";
  let device = "Desktop";

  const ua = userAgent.toLowerCase();

  // Device detection
  if (/mobile|iphone|ipod|android.*mobile|windows phone/.test(ua)) {
    device = "Mobile";
  } else if (/ipad|tablet|android(?!.*mobile)/.test(ua)) {
    device = "Tablet";
  } else {
    device = "Desktop";
  }

  // OS detection
  if (/windows nt 10\.0/.test(ua)) os = "Windows 10/11";
  else if (/windows nt/.test(ua)) os = "Windows";
  else if (/macintosh|mac os x/.test(ua)) os = "macOS";
  else if (/iphone|ipad|ipod/.test(ua)) os = "iOS";
  else if (/android/.test(ua)) os = "Android";
  else if (/linux/.test(ua)) os = "Linux";

  // Browser detection
  if (/edg\//.test(ua)) browser = "Microsoft Edge";
  else if (/chrome\//.test(ua) && !/edg\//.test(ua)) browser = "Google Chrome";
  else if (/safari\//.test(ua) && !/chrome\//.test(ua)) browser = "Apple Safari";
  else if (/firefox\//.test(ua)) browser = "Mozilla Firefox";
  else if (/opera|opr\//.test(ua)) browser = "Opera";

  return { device, browser, os };
};

const Session = mongoose.model("Session", sessionSchema);

export default Session;
