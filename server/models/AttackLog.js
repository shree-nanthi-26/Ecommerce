// server/models/AttackLog.js

import mongoose from "mongoose";

const AttackLogSchema = new mongoose.Schema({
  ip: { type: String, required: true },
  userAgent: { type: String },
  method: { type: String, required: true },
  url: { type: String, required: true },
  payload: { type: mongoose.Schema.Types.Mixed },
  attackType: { type: String, required: true },
  severity: { type: Number, required: true },
  details: { type: String },
  timestamp: { type: Date, default: Date.now }
});

// Indexes for query performance
AttackLogSchema.index({ ip: 1 });
AttackLogSchema.index({ timestamp: -1 });
AttackLogSchema.index({ attackType: 1 });
AttackLogSchema.index({ severity: -1 });

export default mongoose.model("AttackLog", AttackLogSchema);
