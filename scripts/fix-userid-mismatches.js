const { MongoClient, ObjectId } = require("mongodb");
const fs = require("fs");
const path = require("path");

// Load environment variables
function loadEnv() {
  const envPath = path.join(__dirname, "..", ".env");
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, "utf8");
    envContent.split("\n").forEach((line) => {
      const match = line.match(/^([^=]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        let value = match[2].trim();
        if (
          (value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))
        ) {
          value = value.slice(1, -1);
        }
        process.env[key] = value;
      }
    });
  }
}

loadEnv();

async function fixUserIdMismatches() {
  const uri = process.env.MONGODB_URI || "mongodb://localhost:27017/dojohunt";
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log("✅ Connected to MongoDB\n");

    const db = client.db();
    const usersCollection = db.collection("users");
    const stakesCollection = db.collection("stakes");
    const submissionsCollection = db.collection("submissions");
    const userStatsCollection = db.collection("userStats");

    console.log("=".repeat(80));
    console.log("FIXING USERID MISMATCHES AND DATA INCONSISTENCIES");
    console.log("=".repeat(80));
    console.log("");

    // Get all users
    const users = await usersCollection.find({}).toArray();
    console.log(`Found ${users.length} users\n`);

    let fixedStakes = 0;
    let fixedSubmissions = 0;
    let fixedUserStats = 0;

    // Fix stakes with string userIds
    console.log("1. Fixing stakes with string userIds...");
    const allStakes = await stakesCollection.find({}).toArray();
    for (const stake of allStakes) {
      if (typeof stake.userId === "string") {
        try {
          const userIdObj = new ObjectId(stake.userId);
          const user = await usersCollection.findOne({ _id: userIdObj });
          
          if (user) {
            await stakesCollection.updateOne(
              { _id: stake._id },
              { $set: { userId: userIdObj } }
            );
            console.log(`   ✅ Fixed stake ${stake._id}: converted string userId to ObjectId`);
            fixedStakes++;
          } else {
            console.log(`   ⚠️  Stake ${stake._id} has invalid userId: ${stake.userId}`);
          }
        } catch (e) {
          console.log(`   ⚠️  Could not convert stake ${stake._id} userId: ${e.message}`);
        }
      }
    }

    // Fix submissions with string userIds
    console.log("\n2. Fixing submissions with string userIds...");
    const allSubmissions = await submissionsCollection.find({}).toArray();
    for (const submission of allSubmissions) {
      if (typeof submission.userId === "string") {
        try {
          const userIdObj = new ObjectId(submission.userId);
          const user = await usersCollection.findOne({ _id: userIdObj });
          
          if (user) {
            await submissionsCollection.updateOne(
              { _id: submission._id },
              { $set: { userId: userIdObj } }
            );
            console.log(`   ✅ Fixed submission ${submission._id}: converted string userId to ObjectId`);
            fixedSubmissions++;
          } else {
            console.log(`   ⚠️  Submission ${submission._id} has invalid userId: ${submission.userId}`);
          }
        } catch (e) {
          console.log(`   ⚠️  Could not convert submission ${submission._id} userId: ${e.message}`);
        }
      }
    }

    // Recalculate and fix userStats
    console.log("\n3. Recalculating userStats from source data...");
    for (const user of users) {
      // Calculate from stakes
      const userStakes = await stakesCollection
        .find({
          $or: [
            { userId: user._id },
            { userId: user._id.toString() },
          ],
        })
        .toArray();

      const totalStaked = userStakes.reduce((sum, s) => {
        const amount = typeof s.amount === "number" ? s.amount : parseFloat(s.amount || 0) || 0;
        return sum + (isNaN(amount) ? 0 : amount);
      }, 0);

      // Calculate from submissions
      const userSubmissions = await submissionsCollection
        .find({
          $or: [
            { userId: user._id },
            { userId: user._id.toString() },
          ],
          status: "ACCEPTED",
        })
        .toArray();

      const totalScore = userSubmissions.reduce((sum, s) => {
        const score = typeof s.score === "number" ? s.score : parseFloat(s.score || 0) || 0;
        return sum + (isNaN(score) ? 0 : score);
      }, 0);

      const totalChallengesCompleted = userSubmissions.length;
      const averageScore = totalChallengesCompleted > 0 
        ? Math.round((totalScore / totalChallengesCompleted) * 100) / 100 
        : 0;

      // Calculate rewards from completed stakes
      const completedStakes = userStakes.filter(s => s.status === "COMPLETED");
      const totalRewards = completedStakes.reduce((sum, stake) => {
        const reward = typeof stake.reward === "number" ? stake.reward : parseFloat(stake.reward || 0) || 0;
        return sum + (isNaN(reward) ? 0 : reward);
      }, 0);

      // Update or create userStats
      const existingStats = await userStatsCollection.findOne({ userId: user._id });
      
      if (existingStats) {
        const needsUpdate = 
          Math.abs((existingStats.totalStaked || 0) - totalStaked) > 0.01 ||
          Math.abs((existingStats.totalScore || 0) - totalScore) > 0.01 ||
          (existingStats.totalChallengesCompleted || 0) !== totalChallengesCompleted ||
          Math.abs((existingStats.totalRewards || 0) - totalRewards) > 0.01;

        if (needsUpdate) {
          await userStatsCollection.updateOne(
            { userId: user._id },
            {
              $set: {
                totalStaked,
                totalScore,
                totalChallengesCompleted,
                totalRewards,
                averageScore,
                updatedAt: new Date(),
              },
            }
          );
          console.log(`   ✅ Updated userStats for ${user.name || user._id}`);
          fixedUserStats++;
        }
      } else {
        // Create userStats if it doesn't exist
        await userStatsCollection.insertOne({
          userId: user._id,
          totalStaked,
          totalScore,
          totalChallengesCompleted,
          totalRewards,
          averageScore,
          currentStreak: 0,
          longestStreak: 0,
          lastActiveAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        console.log(`   ✅ Created userStats for ${user.name || user._id}`);
        fixedUserStats++;
      }
    }

    console.log("\n" + "=".repeat(80));
    console.log("SUMMARY");
    console.log("=".repeat(80));
    console.log(`Fixed Stakes: ${fixedStakes}`);
    console.log(`Fixed Submissions: ${fixedSubmissions}`);
    console.log(`Fixed/Updated UserStats: ${fixedUserStats}`);
    console.log("\n✅ All fixes applied!");
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await client.close();
    console.log("\n✅ Database connection closed");
  }
}

fixUserIdMismatches().catch(console.error);

