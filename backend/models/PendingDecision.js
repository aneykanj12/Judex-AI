const mongoose = require("mongoose");

const PendingDecisionSchema = new mongoose.Schema({
  inmateId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
  inmateOrdinal: { type: Number, required: true },
  aiDecision: { type: Number, enum: [0,1,2] },
  aiRationale: { type: String },
  aiConfidence: { type: Number },
  status: { type: String, enum: ["PENDING","REVEALED"], default: "PENDING", index: true }
}, { timestamps: true, collection: "pending_decisions" });

module.exports = mongoose.model("PendingDecision", PendingDecisionSchema);
