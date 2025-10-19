require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const Bio = require("./models/Bio");
const PendingDecision = require("./models/PendingDecision");
const { runJudexGraph } = require("./judex/graph");

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 4000;

async function start() {
  if (!process.env.MONGODB_URI) {
    console.error("Missing MONGODB_URI in .env");
    process.exit(1);
  }
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("Mongo connected");

  // Health
  app.get("/api/healthy", (req, res) => res.json({ ok: true }));

  // Fetch inmate by ordinal (1-based index by _id sort)
  app.get("/api/inmate/:ordinal", async (req, res) => {
    try {
      const ordinal = parseInt(req.params.ordinal, 10);
      if (!Number.isInteger(ordinal) || ordinal <= 0) {
        return res.status(400).json({ error: "ordinal must be a positive integer" });
      }
      const docs = await Bio.find({}).sort({ _id: 1 }).skip(ordinal - 1).limit(1).lean();
      if (!docs[0]) return res.status(404).json({ error: "not found" });
      res.json(docs[0]);
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "failed" });
    }
  });

  // Trigger Judex evaluation (no reveal yet)
  app.post("/api/judex/evaluate/:ordinal", async (req, res) => {
    try {
      const ordinal = parseInt(req.params.ordinal, 10);
      if (!Number.isInteger(ordinal) || ordinal <= 0) {
        return res.status(400).json({ error: "ordinal must be a positive integer" });
      }
      const existing = await PendingDecision.findOne({ inmateOrdinal: ordinal, status: "PENDING" }).lean();
      if (existing) {
        return res.json({ pendingId: existing._id, status: existing.status });
      }
      const pending = await runJudexGraph(ordinal);
      res.json({ pendingId: pending._id, status: pending.status });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "evaluation failed" });
    }
  });

  // Submit human decision -> reveal AI
  app.post("/api/judex/submit", async (req, res) => {
    try {
      const { ordinal, humanDecision } = req.body;
      if (![0,1,2].includes(humanDecision)) {
        return res.status(400).json({ error: "humanDecision must be 0|1|2" });
      }
      const pending = await PendingDecision.findOne({ inmateOrdinal: ordinal, status: "PENDING" });
      if (!pending) return res.status(404).json({ error: "no pending decision" });

      pending.status = "REVEALED";
      await pending.save();

      const conflict = pending.aiDecision !== humanDecision;

      res.json({
        inmateOrdinal: pending.inmateOrdinal,
        aiDecision: pending.aiDecision,
        aiRationale: pending.aiRationale,
        aiConfidence: pending.aiConfidence,
        humanDecision,
        conflict
      });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "submit failed" });
    }
  });

  app.listen(PORT, () => console.log(`API listening on :${PORT}`));
}

start().catch(err => {
  console.error("Startup error:", err);
  process.exit(1);
});
