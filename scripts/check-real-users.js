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

async function checkRealUsers() {
  const uri = process.env.MONGODB_URI || "mongodb://localhost:27017/dojohunt";
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log("✅ Connected to MongoDB\n");

    const db = client.db();
    const usersCollection = db.collection("users");
    const stakesCollection = db.collection("stakes");
    const submissionsCollection = db.collection("submissions");

    // First, list ALL users to see what we have
    console.log("=".repeat(80));
    console.log("ALL USERS IN DATABASE");
    console.log("=".repeat(80));
    const allUsers = await usersCollection.find({}).toArray();
    console.log(`Total users: ${allUsers.length}\n`);
    allUsers.forEach((user) => {
      console.log(`  ${user._id} - ${user.name || "N/A"} (${user.email || "N/A"})`);
      console.log(`    isActive: ${user.isActive !== false ? "true" : "false"}`);
      console.log(`    Wallet: ${user.walletAddress || "N/A"}`);
      console.log("");
    });

    // Get the ACTUAL user IDs from database (not API response)
    const actualUserIds = [
      "68f31e2e1a26c3bc830ec495", // My Self
      "6911bb0eed54ccb1269f872a", // Kunal Dhongade
      "68f284ad1a26c3bc830ec492", // Vaishnavi Dhongade
      "692b4212574284d8140d8662", // design m
      "692b4c9cbf1e586091b7728f", // tech pathpulse
    ];

    console.log("\n" + "=".repeat(80));
    console.log("CHECKING REAL USERS FOR STAKES AND SUBMISSIONS");
    console.log("=".repeat(80) + "\n");

    for (const userIdStr of actualUserIds) {
      const userId = new ObjectId(userIdStr);
      const user = await usersCollection.findOne({ _id: userId });

      if (!user) {
        console.log(`❌ User ${userIdStr} not found in database`);
        continue;
      }

      console.log(`\n📊 ${user.name || "N/A"} (${userIdStr})`);
      console.log(`   Email: ${user.email || "N/A"}`);
      console.log(`   Wallet: ${user.walletAddress || "N/A"}`);

      // Check stakes with ObjectId
      const stakesWithObjectId = await stakesCollection
        .find({ userId: userId })
        .toArray();

      // Check stakes with string userId (in case of mismatch)
      const stakesWithString = await stakesCollection
        .find({ userId: userIdStr })
        .toArray();

      // Check all stakes to see if any have this userId in any format
      const allStakes = await stakesCollection.find({}).toArray();
      const matchingStakes = allStakes.filter((stake) => {
        if (stake.userId) {
          if (stake.userId instanceof ObjectId) {
            return stake.userId.equals(userId);
          } else if (typeof stake.userId === "string") {
            return stake.userId === userIdStr || stake.userId === userId.toString();
          }
        }
        return false;
      });

      console.log(`   Stakes (ObjectId query): ${stakesWithObjectId.length}`);
      console.log(`   Stakes (String query): ${stakesWithString.length}`);
      console.log(`   Stakes (Manual match): ${matchingStakes.length}`);

      if (matchingStakes.length > 0) {
        matchingStakes.forEach((stake) => {
          console.log(`     - Stake ${stake._id}: ${stake.amount} TSKULL (${stake.status})`);
          console.log(`       userId type: ${typeof stake.userId}, value: ${stake.userId}`);
        });
      }

      // Check submissions
      const submissionsWithObjectId = await submissionsCollection
        .find({ userId: userId, status: "ACCEPTED" })
        .toArray();

      const submissionsWithString = await submissionsCollection
        .find({ userId: userIdStr, status: "ACCEPTED" })
        .toArray();

      const allSubmissions = await submissionsCollection.find({ status: "ACCEPTED" }).toArray();
      const matchingSubmissions = allSubmissions.filter((sub) => {
        if (sub.userId) {
          if (sub.userId instanceof ObjectId) {
            return sub.userId.equals(userId);
          } else if (typeof sub.userId === "string") {
            return sub.userId === userIdStr || sub.userId === userId.toString();
          }
        }
        return false;
      });

      console.log(`   Submissions (ObjectId query): ${submissionsWithObjectId.length}`);
      console.log(`   Submissions (String query): ${submissionsWithString.length}`);
      console.log(`   Submissions (Manual match): ${matchingSubmissions.length}`);

      if (matchingSubmissions.length > 0) {
        matchingSubmissions.forEach((sub) => {
          console.log(`     - Submission ${sub._id}: Score ${sub.score || 0}`);
          console.log(`       userId type: ${typeof sub.userId}, value: ${sub.userId}`);
        });
      }
    }

    // Also check all stakes/submissions to see their userId types
    console.log("\n" + "=".repeat(80));
    console.log("CHECKING ALL STAKES/SUBMISSIONS FOR USERID TYPE CONSISTENCY");
    console.log("=".repeat(80));

    const allStakes = await stakesCollection.find({}).toArray();
    console.log(`\nTotal stakes: ${allStakes.length}`);
    allStakes.forEach((stake) => {
      console.log(
        `  Stake ${stake._id}: userId type=${typeof stake.userId}, value=${stake.userId}`
      );
    });

    const allSubmissions = await submissionsCollection.find({ status: "ACCEPTED" }).toArray();
    console.log(`\nTotal accepted submissions: ${allSubmissions.length}`);
    allSubmissions.forEach((sub) => {
      console.log(
        `  Submission ${sub._id}: userId type=${typeof sub.userId}, value=${sub.userId}`
      );
    });
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await client.close();
  }
}

checkRealUsers().catch(console.error);

