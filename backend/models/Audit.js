// models/Audit.js
const mongoose = require("mongoose");

const AuditSchema = new mongoose.Schema({
  bioId: mongoose.Schema.Types.ObjectId,
  aiDecision: Number,        // 0,1,2
  aiRationale: String,
  aiConfidence: Number,      // 0..1
  humanDecision: Number,     // 0,1,2 (frontend will POST this later)
  resolvedDecision: Number,  // 0,1,2
  resolutionMode: { type: String, enum: ["HUMAN","AI","PROMPT_OVERRIDE","AUTO_TAKEOVER"] },
  conflictOccurred: Boolean,
  roundIndex: Number
}, { timestamps: true, collection: "audits" });

module.exports = mongoose.model("Audit", AuditSchema);
