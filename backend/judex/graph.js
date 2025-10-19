const { StateGraph } = require("@langchain/langgraph");
const { z } = require("zod");
const Bio = require("../models/Bio");
const PendingDecision = require("../models/PendingDecision");
const { classifyWithGemini } = require("../lib/judex_llm");

const State = z.object({
  inmateOrdinal: z.number().int().positive(),
  inmateDoc: z.any().nullable(),
  pendingDoc: z.any().nullable(),
  ai: z.any().optional()
});

async function fetchInmateNode(state) {
  const { inmateOrdinal } = state;
  const docs = await Bio.find({}).sort({ _id: 1 }).skip(inmateOrdinal - 1).limit(1).lean();
  if (!docs[0]) throw new Error(`No inmate found at ordinal ${inmateOrdinal}`);
  return { ...state, inmateDoc: docs[0] };
}

async function classifyNode(state) {
  const { inmateDoc } = state;
  const ai = await classifyWithGemini(inmateDoc);
  return { ...state, ai };
}

async function persistPendingNode(state) {
  const { inmateDoc, inmateOrdinal, ai } = state;
  const pending = await PendingDecision.findOneAndUpdate(
    { inmateId: inmateDoc._id, inmateOrdinal, status: "PENDING" },
    { $set: { aiDecision: ai.decision, aiRationale: ai.rationale, aiConfidence: ai.confidence } },
    { upsert: true, new: true }
  ).lean();
  return { ...state, pendingDoc: pending };
}

const graph = new StateGraph(State)
  .addNode("fetchInmate", fetchInmateNode)
  .addNode("classify", classifyNode)
  .addNode("persist", persistPendingNode)
  .setEntryPoint("fetchInmate")
  .addEdge("fetchInmate", "classify")
  .addEdge("classify", "persist");

async function runJudexGraph(inmateOrdinal) {
  const initial = { inmateOrdinal, inmateDoc: null, pendingDoc: null };
  const result = await graph.compile().invoke(initial);
  return result.pendingDoc;
}

module.exports = { runJudexGraph };
