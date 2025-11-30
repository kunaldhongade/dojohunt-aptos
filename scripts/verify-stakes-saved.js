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

async function verifyStakesSaved() {
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
    console.log("VERIFYING STAKES AND SUBMISSIONS ARE SAVED CORRECTLY");
    console.log("=".repeat(80));
    console.log("");

    // Get all active users
    const users = await usersCollection.find({ isActive: true }).toArray();
    console.log(`Found ${users.length} active users\n`);

    let issuesFound = 0;
    let totalStakes = 0;
    let totalSubmissions = 0;

    for (const user of users) {
      console.log(`\n📊 Checking: ${user.name || "N/A"} (${user._id})`);
      console.log(`   Email: ${user.email || "N/A"}`);
      console.log(`   Wallet: ${user.walletAddress || "N/A"}`);

      // Check stakes
      const stakes = await stakesCollection
        .find({
          $or: [
            { userId: user._id },
            { userId: user._id.toString() },
          ],
        })
        .toArray();

      console.log(`   Stakes found: ${stakes.length}`);
      totalStakes += stakes.length;

      if (stakes.length > 0) {
        stakes.forEach((stake, idx) => {
          console.log(`     ${idx + 1}. Stake ${stake._id}:`);
          console.log(`        Amount: ${stake.amount} TSKULL`);
          console.log(`        Status: ${stake.status}`);
          console.log(`        UserId type: ${typeof stake.userId}`);
          console.log(`        UserId matches: ${stake.userId instanceof ObjectId ? stake.userId.equals(user._id) : stake.userId === user._id.toString()}`);
          
          // Check for issues
          if (!stake.userId) {
            console.log(`        ⚠️  ISSUE: Missing userId!`);
            issuesFound++;
          } else if (stake.userId instanceof ObjectId && !stake.userId.equals(user._id)) {
            console.log(`        ⚠️  ISSUE: userId mismatch!`);
            issuesFound++;
          } else if (typeof stake.userId === "string" && stake.userId !== user._id.toString()) {
            console.log(`        ⚠️  ISSUE: userId string mismatch!`);
            issuesFound++;
          }
          
          if (!stake.amount || stake.amount <= 0) {
            console.log(`        ⚠️  ISSUE: Invalid amount!`);
            issuesFound++;
          }
          
          if (!stake.status) {
            console.log(`        ⚠️  ISSUE: Missing status!`);
            issuesFound++;
          }
        });
      }

      // Check submissions
      const submissions = await submissionsCollection
        .find({
          $or: [
            { userId: user._id },
            { userId: user._id.toString() },
          ],
          status: "ACCEPTED",
        })
        .toArray();

      console.log(`   Accepted submissions found: ${submissions.length}`);
      totalSubmissions += submissions.length;

      if (submissions.length > 0) {
        submissions.forEach((sub, idx) => {
          console.log(`     ${idx + 1}. Submission ${sub._id}:`);
          console.log(`        Score: ${sub.score || 0}`);
          console.log(`        ChallengeId: ${sub.challengeId}`);
          console.log(`        UserId type: ${typeof sub.userId}`);
          console.log(`        UserId matches: ${sub.userId instanceof ObjectId ? sub.userId.equals(user._id) : sub.userId === user._id.toString()}`);
          
          // Check for issues
          if (!sub.userId) {
            console.log(`        ⚠️  ISSUE: Missing userId!`);
            issuesFound++;
          } else if (sub.userId instanceof ObjectId && !sub.userId.equals(user._id)) {
            console.log(`        ⚠️  ISSUE: userId mismatch!`);
            issuesFound++;
          } else if (typeof sub.userId === "string" && sub.userId !== user._id.toString()) {
            console.log(`        ⚠️  ISSUE: userId string mismatch!`);
            issuesFound++;
          }
        });
      }

      // Check userStats
      const userStats = await userStatsCollection.findOne({
        userId: user._id,
      });

      if (userStats) {
        const calculatedStaked = stakes.reduce((sum, s) => sum + (s.amount || 0), 0);
        const calculatedScore = submissions.reduce((sum, s) => sum + (s.score || 0), 0);
        const calculatedChallenges = submissions.length;

        console.log(`   UserStats:`);
        console.log(`     Total Staked (DB): ${userStats.totalStaked || 0}`);
        console.log(`     Total Staked (Calculated): ${calculatedStaked}`);
        console.log(`     Total Score (DB): ${userStats.totalScore || 0}`);
        console.log(`     Total Score (Calculated): ${calculatedScore}`);
        console.log(`     Challenges (DB): ${userStats.totalChallengesCompleted || 0}`);
        console.log(`     Challenges (Calculated): ${calculatedChallenges}`);

        if (Math.abs((userStats.totalStaked || 0) - calculatedStaked) > 0.01) {
          console.log(`     ⚠️  ISSUE: Staked amount mismatch!`);
          issuesFound++;
        }
        if (Math.abs((userStats.totalScore || 0) - calculatedScore) > 0.01) {
          console.log(`     ⚠️  ISSUE: Score mismatch!`);
          issuesFound++;
        }
        if ((userStats.totalChallengesCompleted || 0) !== calculatedChallenges) {
          console.log(`     ⚠️  ISSUE: Challenges count mismatch!`);
          issuesFound++;
        }
      } else {
        console.log(`   ⚠️  UserStats: NOT FOUND (will be created by leaderboard)`);
      }
    }

    console.log("\n" + "=".repeat(80));
    console.log("SUMMARY");
    console.log("=".repeat(80));
    console.log(`Total Users Checked: ${users.length}`);
    console.log(`Total Stakes Found: ${totalStakes}`);
    console.log(`Total Submissions Found: ${totalSubmissions}`);
    console.log(`Issues Found: ${issuesFound}`);

    if (issuesFound === 0) {
      console.log("\n✅ No issues found! All data looks correct.");
    } else {
      console.log(`\n⚠️  Found ${issuesFound} issues that need to be fixed.`);
      console.log("Run the fix script to correct these issues.");
    }
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await client.close();
    console.log("\n✅ Database connection closed");
  }
}

verifyStakesSaved().catch(console.error);

