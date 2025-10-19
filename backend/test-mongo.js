require("dotenv").config();
const { MongoClient } = require("mongodb");

(async () => {
  try {
    const uri = process.env.MONGODB_URI;
    if (!uri) throw new Error("Missing MONGODB_URI");
    const client = new MongoClient(uri);
    await client.connect();
    console.log("✅ Connected to MongoDB!");
    const db = client.db("Prison");
    const col = db.collection("inmates");
    const count = await col.countDocuments();
    const one = await col.findOne({}, { projection: { name: 1 } });
    console.log("Docs:", count, "Sample:", one);
    await client.close();
  } catch (err) {
    console.error("❌ Connection failed:", err.message);
    process.exit(1);
  }
})();
