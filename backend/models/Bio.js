const mongoose = require("mongoose");

const BioSchema = new mongoose.Schema({
  name: String,
  age: Number,
  race: String,
  time_served_years: Number,
  year_entered: Number,
  year_end: Number,
  behavior: Number,
  volunteer: Number,
  guilt_remorse: Number,
  offense_label: String,
  case_citation: String,
  status: { type: String, enum: ["queued","served"], default: "queued" },
  createdAt: { type: Date, default: Date.now }
}, { collection: "inmates" });

module.exports = mongoose.model("Bio", BioSchema);
