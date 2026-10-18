import jwt from "jsonwebtoken";
import User from "../models/User.js";

export async function protect(req, res, next) {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select("-password");

      if (!user) {
        res.status(401);
        return next(new Error("Not authorized, user not found"));
      }

      // Check if account is temporarily locked
      if (user.isLocked && user.isLocked()) {
        const remainingMins = Math.ceil((user.lockUntil - Date.now()) / (60 * 1000));
        res.status(423);
        return next(new Error(`Account is temporarily locked. Please try again in ${remainingMins} minute(s).`));
      }

      // Check token version (if user logged out of all sessions)
      if (
        decoded.tokenVersion !== undefined &&
        user.tokenVersion !== undefined &&
        decoded.tokenVersion < user.tokenVersion
      ) {
        res.status(401);
        return next(new Error("Session expired. Please log in again."));
      }

      // Check password changed timestamp
      if (user.passwordChangedAt && decoded.iat) {
        const changedTimestamp = Math.floor(user.passwordChangedAt.getTime() / 1000);
        if (decoded.iat < changedTimestamp) {
          res.status(401);
          return next(new Error("Password was changed recently. Please log in again."));
        }
      }

      // Check session revocation if sessionId is present
      if (decoded.sessionId) {
        const { default: Session } = await import("../models/Session.js");
        const session = await Session.findOne({ sessionId: decoded.sessionId, user: user._id });
        if (session && session.isRevoked) {
          res.status(401);
          return next(new Error("Session has been revoked. Please log in again."));
        }
        if (session) {
          session.lastActiveAt = new Date();
          session.save().catch(() => {});
        }
      }

      req.user = user;
      req.tokenPayload = decoded;
      return next();
    } catch (error) {
      res.status(401);
      return next(new Error(error.message || "Not authorized, token failed"));
    }
  }

  if (!token) {
    res.status(401);
    return next(new Error("Not authorized, no token"));
  }
}

export function admin(req, res, next) {
  if (req.user && req.user.role === "admin") {
    next();
  } else {
    res.status(403);
    return next(new Error("Not authorized as an admin"));
  }
}

export async function optionalProtect(req, res, next) {
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      const token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select("-password");
    } catch {
      // Ignore token failure for optional auth
    }
  }
  next();
}

