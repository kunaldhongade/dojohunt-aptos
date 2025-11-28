const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function quickSetup() {
  console.log("🚀 Quick setup for DojoHunt...");
  console.log("This will help you set up the database and environment.");

  try {
    // Test database connection
    console.log("🔍 Testing database connection...");
    await prisma.$connect();
    console.log("✅ Database connection successful!");

    // Check if database has data
    const userCount = await prisma.user.count();
    const challengeCount = await prisma.challenge.count();

    if (userCount === 0 && challengeCount === 0) {
      console.log("📊 Database is empty. Running setup...");
      // Import and run the setup function
      const { setupDatabase } = require("./setup-database.js");
      await setupDatabase();
    } else {
      console.log(
        `📊 Database already has data: ${userCount} users, ${challengeCount} challenges`
      );
    }
  } catch (error) {
    console.error("❌ Database setup failed:", error.message);

    if (error.message.includes("does not exist")) {
      console.log("\n🔧 Database Setup Required:");
      console.log("1. Install PostgreSQL if not already installed");
      console.log("2. Create a database named 'dojohunt'");
      console.log(
        "3. Update your .env.local file with the correct DATABASE_URL"
      );
      console.log("\nExample .env.local:");
      console.log(
        'DATABASE_URL="postgresql://username:password@localhost:5432/dojohunt?schema=public"'
      );
      console.log("\nThen run:");
      console.log("pnpm db:push");
      console.log("node scripts/setup-database.js");
    } else if (error.message.includes("ECONNREFUSED")) {
      console.log("\n🔧 PostgreSQL Connection Issue:");
      console.log("1. Make sure PostgreSQL is running");
      console.log("2. Check if the port 5432 is correct");
      console.log("3. Verify your DATABASE_URL in .env.local");
    } else {
      console.log("\n🔧 General Setup:");
      console.log("1. Make sure you have a .env.local file");
      console.log("2. Run: pnpm db:generate");
      console.log("3. Run: pnpm db:push");
      console.log("4. Run: node scripts/setup-database.js");
    }
  } finally {
    await prisma.$disconnect();
  }
}

quickSetup();

