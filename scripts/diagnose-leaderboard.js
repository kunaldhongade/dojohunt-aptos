const { MongoClient, ObjectId } = require("mongodb");
const fs = require("fs");
const path = require("path");

// Load environment variables from .env file manually
function loadEnv() {
  const envPath = path.join(__dirname, "..", ".env");
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, "utf8");
    envContent.split("\n").forEach((line) => {
      const match = line.match(/^([^=]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        let value = match[2].trim();
        // Remove quotes if present
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

async function diagnoseLeaderboard() {
  const uri =
    process.env.MONGODB_URI || "mongodb://localhost:27017/dojohunt";
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log("✅ Connected to MongoDB\n");

    const db = client.db();
    const usersCollection = db.collection("users");
    const stakesCollection = db.collection("stakes");
    const submissionsCollection = db.collection("submissions");
    const userStatsCollection = db.collection("userStats");

    // 1. Get all users (including inactive to see all data)
    console.log("=".repeat(80));
    console.log("1. USERS COLLECTION");
    console.log("=".repeat(80));
    const allUsers = await usersCollection.find({}).toArray();
    const activeUsers = await usersCollection.find({ isActive: true }).toArray();
    console.log(`Total users: ${allUsers.length}`);
    console.log(`Active users: ${activeUsers.length}\n`);
    
    // Use active users for the rest of the analysis
    const users = activeUsers;

    for (const user of users) {
      console.log(`User ID: ${user._id}`);
      console.log(`  Name: ${user.name || "N/A"}`);
      console.log(`  Email: ${user.email || "N/A"}`);
      console.log(`  Username: ${user.username || "N/A"}`);
      console.log(`  Wallet: ${user.walletAddress || "N/A"}`);
      console.log(`  Created: ${user.createdAt || "N/A"}`);
      console.log("");
    }

    // 2. Get all stakes
    console.log("=".repeat(80));
    console.log("2. STAKES COLLECTION");
    console.log("=".repeat(80));
    const allStakes = await stakesCollection.find({}).toArray();
    console.log(`Total stakes: ${allStakes.length}\n`);

    for (const stake of allStakes) {
      console.log(`Stake ID: ${stake._id}`);
      console.log(`  User ID: ${stake.userId} (type: ${typeof stake.userId})`);
      console.log(`  Amount: ${stake.amount} (type: ${typeof stake.amount})`);
      console.log(`  Status: ${stake.status}`);
      console.log(`  Start Time: ${stake.startTime}`);
      console.log(`  End Time: ${stake.endTime}`);
      console.log(`  Challenges Completed: ${stake.challengesCompleted || 0}`);
      console.log(`  Transaction Hash: ${stake.transactionHash || "N/A"}`);
      console.log("");
    }

    // 3. Get all submissions
    console.log("=".repeat(80));
    console.log("3. SUBMISSIONS COLLECTION");
    console.log("=".repeat(80));
    const allSubmissions = await submissionsCollection.find({}).toArray();
    console.log(`Total submissions: ${allSubmissions.length}\n`);

    const acceptedSubmissions = allSubmissions.filter(
      (s) => s.status === "ACCEPTED"
    );
    console.log(`Accepted submissions: ${acceptedSubmissions.length}\n`);

    for (const submission of acceptedSubmissions.slice(0, 10)) {
      // Show first 10
      console.log(`Submission ID: ${submission._id}`);
      console.log(
        `  User ID: ${submission.userId} (type: ${typeof submission.userId})`
      );
      console.log(
        `  Challenge ID: ${submission.challengeId} (type: ${typeof submission.challengeId})`
      );
      console.log(`  Status: ${submission.status}`);
      console.log(`  Score: ${submission.score} (type: ${typeof submission.score})`);
      console.log(`  Submitted At: ${submission.submittedAt}`);
      console.log("");
    }

    if (acceptedSubmissions.length > 10) {
      console.log(`... and ${acceptedSubmissions.length - 10} more\n`);
    }

    // 4. Get all userStats
    console.log("=".repeat(80));
    console.log("4. USERSTATS COLLECTION");
    console.log("=".repeat(80));
    const allUserStats = await userStatsCollection.find({}).toArray();
    console.log(`Total userStats records: ${allUserStats.length}\n`);

    for (const stat of allUserStats) {
      console.log(`UserStats ID: ${stat._id}`);
      console.log(
        `  User ID: ${stat.userId} (type: ${typeof stat.userId})`
      );
      console.log(`  Total Challenges Completed: ${stat.totalChallengesCompleted || 0}`);
      console.log(`  Total Score: ${stat.totalScore || 0}`);
      console.log(`  Total Staked: ${stat.totalStaked || 0}`);
      console.log(`  Total Rewards: ${stat.totalRewards || 0}`);
      console.log(`  Average Score: ${stat.averageScore || 0}`);
      console.log("");
    }

    // 5. Check ALL users (not just active) for stakes/submissions
    console.log("=".repeat(80));
    console.log("5. ALL USERS WITH STAKES/SUBMISSIONS");
    console.log("=".repeat(80));
    
    const allUsersList = await usersCollection.find({}).toArray();
    console.log(`Total users in database: ${allUsersList.length}\n`);
    
    for (const user of allUsersList) {
      const userStakes = await stakesCollection.find({ userId: user._id }).toArray();
      const userSubmissions = await submissionsCollection.find({ 
        userId: user._id, 
        status: "ACCEPTED" 
      }).toArray();
      
      if (userStakes.length > 0 || userSubmissions.length > 0) {
        console.log(`\n📊 User: ${user.name || "N/A"} (${user._id})`);
        console.log(`   Email: ${user.email || "N/A"}`);
        console.log(`   isActive: ${user.isActive !== false ? "true" : "false"}`);
        console.log(`   Stakes: ${userStakes.length}`);
        console.log(`   Accepted Submissions: ${userSubmissions.length}`);
      }
    }

    // 6. Cross-reference: For each ACTIVE user, show their actual data
    console.log("\n" + "=".repeat(80));
    console.log("6. CROSS-REFERENCE: ACTIVE USER DATA ANALYSIS");
    console.log("=".repeat(80));

    for (const user of users) {
      console.log(`\n📊 User: ${user.name || "N/A"} (${user._id})`);
      console.log("-".repeat(80));

      // Check stakes
      const userStakes = await stakesCollection
        .find({
          userId: user._id,
        })
        .toArray();
      console.log(`  Stakes found: ${userStakes.length}`);
      if (userStakes.length > 0) {
        const totalStaked = userStakes.reduce((sum, s) => {
          const amount =
            typeof s.amount === "number"
              ? s.amount
              : parseFloat(s.amount || 0) || 0;
          return sum + (isNaN(amount) ? 0 : amount);
        }, 0);
        console.log(`  Total staked (calculated): ${totalStaked}`);
        console.log(
          `  Stakes: ${userStakes.map((s) => `${s.amount} (${s.status})`).join(", ")}`
        );
      }

      // Check submissions
      const userSubmissions = await submissionsCollection
        .find({
          userId: user._id,
          status: "ACCEPTED",
        })
        .toArray();
      console.log(`  Accepted submissions found: ${userSubmissions.length}`);
      if (userSubmissions.length > 0) {
        const totalScore = userSubmissions.reduce((sum, s) => {
          const score =
            typeof s.score === "number"
              ? s.score
              : parseFloat(s.score || 0) || 0;
          return sum + (isNaN(score) ? 0 : score);
        }, 0);
        console.log(`  Total score (calculated): ${totalScore}`);
        console.log(
          `  Scores: ${userSubmissions.map((s) => s.score || 0).join(", ")}`
        );
      }

      // Check userStats
      const userStat = await userStatsCollection.findOne({
        userId: user._id,
      });
      if (userStat) {
        console.log(`  UserStats exists:`);
        console.log(`    Total Challenges: ${userStat.totalChallengesCompleted || 0}`);
        console.log(`    Total Score: ${userStat.totalScore || 0}`);
        console.log(`    Total Staked: ${userStat.totalStaked || 0}`);
      } else {
        console.log(`  UserStats: NOT FOUND`);
      }

      // Check for userId type mismatches
      const stakeWithStringId = userStakes.find(
        (s) => typeof s.userId === "string"
      );
      const submissionWithStringId = userSubmissions.find(
        (s) => typeof s.userId === "string"
      );
      if (stakeWithStringId) {
        console.log(
          `  ⚠️  WARNING: Found stake with string userId: ${stakeWithStringId._id}`
        );
      }
      if (submissionWithStringId) {
        console.log(
          `  ⚠️  WARNING: Found submission with string userId: ${submissionWithStringId._id}`
        );
      }
    }

    // 7. Summary
    console.log("\n" + "=".repeat(80));
    console.log("7. SUMMARY");
    console.log("=".repeat(80));
    console.log(`Total Users: ${users.length}`);
    console.log(`Total Stakes: ${allStakes.length}`);
    console.log(`Total Submissions: ${allSubmissions.length}`);
    console.log(`Accepted Submissions: ${acceptedSubmissions.length}`);
    console.log(`Total UserStats: ${allUserStats.length}`);

    // Check for users without userStats
    const usersWithoutStats = [];
    for (const user of users) {
      const stat = await userStatsCollection.findOne({ userId: user._id });
      if (!stat) {
        usersWithoutStats.push(user);
      }
    }
    if (usersWithoutStats.length > 0) {
      console.log(
        `\n⚠️  Users without userStats: ${usersWithoutStats.length}`
      );
      usersWithoutStats.forEach((u) => {
        console.log(`  - ${u.name || "N/A"} (${u._id})`);
      });
    }

    // Check for userId type consistency
    const stakesWithStringId = allStakes.filter(
      (s) => typeof s.userId === "string"
    );
    const submissionsWithStringId = allSubmissions.filter(
      (s) => typeof s.userId === "string"
    );
    if (stakesWithStringId.length > 0) {
      console.log(
        `\n⚠️  Stakes with string userId: ${stakesWithStringId.length}`
      );
    }
    if (submissionsWithStringId.length > 0) {
      console.log(
        `\n⚠️  Submissions with string userId: ${submissionsWithStringId.length}`
      );
    }
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await client.close();
    console.log("\n✅ Database connection closed");
  }
}

diagnoseLeaderboard().catch(console.error);

