const { MongoClient } = require("mongodb");

async function setupMongoDB() {
  console.log("🚀 Setting up DojoHunt MongoDB database...");

  const uri = process.env.MONGODB_URI || "mongodb://localhost:27017/dojohunt";
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log("✅ Connected to MongoDB");

    const db = client.db();

    // Create collections
    console.log("📋 Creating collections...");
    await db.createCollection("users");
    await db.createCollection("challenges");
    await db.createCollection("submissions");
    await db.createCollection("stakes");
    await db.createCollection("userStats");
    await db.createCollection("achievements");
    await db.createCollection("systemConfigs");

    // Create indexes
    console.log("🔍 Creating indexes...");
    await db
      .collection("users")
      .createIndex({ email: 1 }, { unique: true, sparse: true });
    await db
      .collection("users")
      .createIndex({ walletAddress: 1 }, { unique: true, sparse: true });
    await db
      .collection("users")
      .createIndex({ username: 1 }, { unique: true, sparse: true });

    await db.collection("challenges").createIndex({ title: 1 });
    await db.collection("challenges").createIndex({ difficulty: 1 });
    await db.collection("challenges").createIndex({ category: 1 });
    await db.collection("challenges").createIndex({ tags: 1 });

    await db.collection("submissions").createIndex({ userId: 1 });
    await db.collection("submissions").createIndex({ challengeId: 1 });
    await db.collection("submissions").createIndex({ status: 1 });

    await db.collection("stakes").createIndex({ userId: 1 });
    await db.collection("stakes").createIndex({ status: 1 });

    console.log("✅ Database setup completed successfully!");
    console.log(
      "📊 Collections created: users, challenges, submissions, stakes, userStats, achievements, systemConfigs"
    );
    console.log("🔍 Indexes created for optimal performance");
  } catch (error) {
    console.error("❌ MongoDB setup failed:", error.message);

    if (error.message.includes("ECONNREFUSED")) {
      console.log("\n🔧 MongoDB Connection Issue:");
      console.log("1. Make sure MongoDB is running");
      console.log("2. Check if the port 27017 is correct");
      console.log("3. Verify your MONGODB_URI in .env.local");
    } else if (error.message.includes("authentication failed")) {
      console.log("\n🔧 MongoDB Authentication Issue:");
      console.log("1. Check your MongoDB username and password");
      console.log("2. Verify your MONGODB_URI in .env.local");
      console.log("3. Make sure the user has proper permissions");
    } else {
      console.log("\n🔧 General Setup:");
      console.log("1. Make sure you have a .env.local file");
      console.log("2. Set MONGODB_URI in your environment");
      console.log("3. Run: node scripts/seed-mongodb.js");
    }
  } finally {
    await client.close();
  }
}

// Run setup if called directly
if (require.main === module) {
  setupMongoDB();
}

module.exports = { setupMongoDB };
