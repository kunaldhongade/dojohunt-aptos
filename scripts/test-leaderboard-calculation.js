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

async function testLeaderboardCalculation() {
  const uri = process.env.MONGODB_URI || "mongodb://localhost:27017/dojohunt";
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log("✅ Connected to MongoDB\n");

    const db = client.db();
    const usersCollection = db.collection("users");
    const stakesCollection = db.collection("stakes");
    const submissionsCollection = db.collection("submissions");

    // Get active users (same query as leaderboard API)
    const users = await usersCollection.find({ isActive: true }).toArray();
    console.log(`Found ${users.length} active users (same as leaderboard API)\n`);

    console.log("=".repeat(80));
    console.log("TESTING LEADERBOARD CALCULATION FOR EACH USER");
    console.log("=".repeat(80));

    for (const user of users) {
      console.log(`\n📊 User: ${user.name || "N/A"} (${user._id})`);
      console.log(`   Email: ${user.email || "N/A"}`);

      // Query stakes (same as leaderboard API)
      const allTimeStakes = await stakesCollection
        .find({
          $or: [
            { userId: user._id },
            { userId: user._id.toString() },
          ],
          status: { $in: ["ACTIVE", "COMPLETED", "CANCELLED"] },
        })
        .toArray();

      // Calculate total staked (same as leaderboard API)
      let totalStakedFromStakes = 0;
      for (const stake of allTimeStakes) {
        let amount = 0;
        if (typeof stake.amount === "number") {
          amount = stake.amount;
        } else if (typeof stake.amount === "string") {
          amount = parseFloat(stake.amount) || 0;
        } else if (stake.amount != null) {
          amount = Number(stake.amount) || 0;
        }
        if (isNaN(amount) || amount < 0) {
          amount = 0;
        }
        totalStakedFromStakes += amount;
      }
      totalStakedFromStakes = Math.round(totalStakedFromStakes * 100) / 100;

      // Query submissions (same as leaderboard API)
      const allSubmissions = await submissionsCollection
        .find({
          $or: [
            { userId: user._id },
            { userId: user._id.toString() },
          ],
          status: "ACCEPTED",
        })
        .toArray();

      // Calculate stats (same as leaderboard API)
      const totalChallengesCompleted = allSubmissions.length;
      const totalScore = allSubmissions.reduce((sum, sub) => {
        const score =
          typeof sub.score === "number"
            ? sub.score
            : parseFloat(sub.score || 0) || 0;
        return sum + (isNaN(score) ? 0 : score);
      }, 0);

      const averageScore =
        totalChallengesCompleted > 0
          ? Math.round((totalScore / totalChallengesCompleted) * 100) / 100
          : 0;

      // Calculate rewards
      const completedStakes = allTimeStakes.filter(
        (s) => s.status === "COMPLETED"
      );
      const totalRewards = completedStakes.reduce((sum, stake) => {
        const reward =
          typeof stake.reward === "number"
            ? stake.reward
            : parseFloat(stake.reward || 0) || 0;
        return sum + (isNaN(reward) ? 0 : reward);
      }, 0);

      console.log(`   Stakes found: ${allTimeStakes.length}`);
      if (allTimeStakes.length > 0) {
        allTimeStakes.forEach((s, idx) => {
          console.log(`     ${idx + 1}. ${s.amount} TSKULL (${s.status})`);
        });
      }

      console.log(`   Submissions found: ${allSubmissions.length}`);
      if (allSubmissions.length > 0) {
        allSubmissions.forEach((s, idx) => {
          console.log(`     ${idx + 1}. Score: ${s.score || 0}`);
        });
      }

      console.log(`\n   📊 Calculated Stats:`);
      console.log(`      Total Staked: ${totalStakedFromStakes} TSKULL`);
      console.log(`      Total Score: ${totalScore}`);
      console.log(`      Challenges Completed: ${totalChallengesCompleted}`);
      console.log(`      Average Score: ${averageScore}`);
      console.log(`      Total Rewards: ${totalRewards} TSKULL`);

      // This is what the leaderboard API should return
      const expectedResponse = {
        id: user._id.toString(),
        name: user.name || "Anonymous",
        username: user.username || `user_${user._id.toString().slice(-6)}`,
        stats: {
          totalChallengesCompleted,
          totalScore,
          averageScore,
          totalStaked: totalStakedFromStakes,
          totalRewards,
        },
      };

      console.log(`\n   ✅ Expected API Response:`);
      console.log(`      ${JSON.stringify(expectedResponse.stats, null, 2)}`);
    }

    console.log("\n" + "=".repeat(80));
    console.log("SUMMARY");
    console.log("=".repeat(80));
    console.log(`Total Active Users: ${users.length}`);
    const usersWithData = users.filter(async (u) => {
      const stakes = await stakesCollection.find({
        $or: [{ userId: u._id }, { userId: u._id.toString() }],
      }).toArray();
      const subs = await submissionsCollection.find({
        $or: [{ userId: u._id }, { userId: u._id.toString() }],
        status: "ACCEPTED",
      }).toArray();
      return stakes.length > 0 || subs.length > 0;
    });
    console.log(`Users with stakes/submissions: Check above output`);
    console.log("\n✅ Leaderboard calculation test completed!");
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await client.close();
    console.log("\n✅ Database connection closed");
  }
}

testLeaderboardCalculation().catch(console.error);

