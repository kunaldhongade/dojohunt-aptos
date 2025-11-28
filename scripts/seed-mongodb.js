const { MongoClient, ObjectId } = require("mongodb");

async function seedMongoDB() {
  console.log("🌱 Seeding DojoHunt MongoDB database...");

  const uri = process.env.MONGODB_URI || "mongodb://localhost:27017/dojohunt";
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log("✅ Connected to MongoDB");

    const db = client.db();

    // Check if data already exists
    const existingChallenges = await db
      .collection("challenges")
      .countDocuments();
    if (existingChallenges > 0) {
      console.log("📊 Database already has data. Skipping seeding.");
      return;
    }

    // Create admin user
    const adminUser = await db.collection("users").insertOne({
      name: "Admin User",
      email: "admin@dojohunt.com",
      username: "admin",
      role: "ADMIN",
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Create sample challenges
    const challenges = [
      {
        title: "Two Sum",
        description: "Find two numbers that add up to target",
        difficulty: "EASY",
        category: "Arrays",
        points: 100,
        isActive: true,
        isPublished: true,
        createdBy: adminUser.insertedId.toString(),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        title: "Valid Parentheses",
        description: "Check if parentheses are valid",
        difficulty: "EASY",
        category: "Stack",
        points: 100,
        isActive: true,
        isPublished: true,
        createdBy: adminUser.insertedId.toString(),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    await db.collection("challenges").insertMany(challenges);

    console.log("✅ Database seeding completed!");
    console.log("📊 Created: 1 admin user, 2 challenges");
  } catch (error) {
    console.error("❌ Database seeding failed:", error.message);
  } finally {
    await client.close();
  }
}

if (require.main === module) {
  seedMongoDB();
}

module.exports = { seedMongoDB };
