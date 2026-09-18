// server/models/BlockedIP.js

import mongoose from "mongoose";

const BlockedIPSchema = new mongoose.Schema({
  ip: { type: String, required: true, unique: true },
  blockedAt: { type: Date, default: Date.now },
  reason: { type: String },
  isActive: { type: Boolean, default: true },
  expiresAt: { type: Date } // optional expiration for temporary bans
});

// Indexes for query performance
BlockedIPSchema.index({ ip: 1, isActive: 1 });
BlockedIPSchema.index({ expiresAt: 1 });

export default mongoose.model("BlockedIP", BlockedIPSchema);
