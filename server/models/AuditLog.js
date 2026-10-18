import mongoose from "mongoose";

const AuditLogSchema = new mongoose.Schema({
  admin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: false,
  },
  action: {
    type: String,
    required: true
  },
  target: {
    type: { type: String, required: true },
    id: { type: String, required: true }
  },
  oldValue: {
    type: mongoose.Schema.Types.Mixed
  },
  newValue: {
    type: mongoose.Schema.Types.Mixed
  },
  reason: {
    type: String
  },
  ip: {
    type: String
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

// Index for query performance
AuditLogSchema.index({ admin: 1 });
AuditLogSchema.index({ "target.id": 1 });
AuditLogSchema.index({ timestamp: -1 });
AuditLogSchema.index({ action: 1, timestamp: -1 });

export default mongoose.model("AuditLog", AuditLogSchema);
