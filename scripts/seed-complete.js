const { MongoClient, ObjectId } = require("mongodb");

async function seedComplete() {
  console.log("🌱 Seeding DojoHunt MongoDB database with complete data...");

  const uri = process.env.MONGODB_URI || "mongodb://localhost:27017/dojohunt";
  const dbName = process.env.MONGODB_DB || "dojohunt";
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log("✅ Connected to MongoDB");

    const db = client.db(dbName);

    // Clear existing data
    console.log("🧹 Clearing existing data...");
    await db.collection("users").deleteMany({});
    await db.collection("challenges").deleteMany({});
    await db.collection("submissions").deleteMany({});
    await db.collection("stakes").deleteMany({});
    await db.collection("userStats").deleteMany({});
    await db.collection("achievements").deleteMany({});
    await db.collection("systemConfigs").deleteMany({});

    // Create admin user
    console.log("👤 Creating admin user...");
    const adminUser = await db.collection("users").insertOne({
      name: "Admin User",
      email: "admin@dojohunt.com",
      username: "admin",
      role: "ADMIN",
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Create sample users
    console.log("👥 Creating sample users...");
    const users = [
      {
        name: "Alice Johnson",
        email: "alice@example.com",
        username: "alice_dev",
        role: "USER",
        walletAddress: "0x1234567890123456789012345678901234567890",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "Bob Smith",
        email: "bob@example.com",
        username: "bob_coder",
        role: "USER",
        walletAddress: "0x2345678901234567890123456789012345678901",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "Charlie Brown",
        email: "charlie@example.com",
        username: "charlie_dev",
        role: "USER",
        walletAddress: "0x3456789012345678901234567890123456789012",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    const userResults = await db.collection("users").insertMany(users);
    const allUsers = [
      adminUser.insertedId,
      ...Object.values(userResults.insertedIds),
    ];

    // Create user stats for all users
    console.log("📊 Creating user stats...");
    const userStats = allUsers.map((userId, index) => ({
      userId,
      totalChallengesCompleted: Math.floor(Math.random() * 20) + index * 5,
      totalScore: Math.floor(Math.random() * 2000) + index * 500,
      averageScore: Math.floor(Math.random() * 40) + 60,
      currentStreak: Math.floor(Math.random() * 10),
      longestStreak: Math.floor(Math.random() * 20),
      totalStaked: Math.floor(Math.random() * 50) + index * 10,
      totalRewards: Math.floor(Math.random() * 10) + index * 2,
      rank: index + 1,
      lastActiveAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    await db.collection("userStats").insertMany(userStats);

    // Create challenges
    console.log("🎯 Creating challenges...");
    const challenges = [
      {
        title: "Two Sum",
        description: "Find two numbers that add up to target",
        problem: `Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.

You may assume that each input would have exactly one solution, and you may not use the same element twice.

You can return the answer in any order.`,
        difficulty: "EASY",
        category: "Arrays",
        constraints: [
          "2 <= nums.length <= 104",
          "-109 <= nums[i] <= 109",
          "-109 <= target <= 109",
          "Only one valid answer exists.",
        ],
        examples: [
          {
            input: "nums = [2,7,11,15], target = 9",
            output: "[0,1]",
            explanation: "Because nums[0] + nums[1] == 9, we return [0, 1].",
          },
          {
            input: "nums = [3,2,4], target = 6",
            output: "[1,2]",
            explanation: "Because nums[1] + nums[2] == 6, we return [1, 2].",
          },
        ],
        testCases: [
          {
            input: "[2, 7, 11, 15]\n9",
            output: "[0, 1]",
            explanation: "2 + 7 = 9",
          },
          {
            input: "[3, 2, 4]\n6",
            output: "[1, 2]",
            explanation: "2 + 4 = 6",
          },
          {
            input: "[3, 3]\n6",
            output: "[0, 1]",
            explanation: "3 + 3 = 6",
          },
        ],
        starterCode: `function main(nums, target) {
  // Your solution here
  // Return the indices of two numbers that add up to target
}`,
        solutionCode: `function main(nums, target) {
  const map = new Map();
  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i];
    if (map.has(complement)) {
      return [map.get(complement), i];
    }
    map.set(nums[i], i);
  }
  return [];
}`,
        timeLimit: 1000,
        memoryLimit: 128,
        points: 100,
        tags: ["arrays", "hash-table"],
        isActive: true,
        isPublished: true,
        createdBy: adminUser.insertedId.toString(),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        title: "Valid Parentheses",
        description: "Check if parentheses are valid",
        problem: `Given a string s containing just the characters '(', ')', '{', '}', '[' and ']', determine if the input string is valid.

An input string is valid if:
1. Open brackets must be closed by the same type of brackets.
2. Open brackets must be closed in the correct order.
3. Every close bracket has a corresponding open bracket of the same type.`,
        difficulty: "EASY",
        category: "Stack",
        constraints: [
          "1 <= s.length <= 104",
          "s consists of parentheses only '()[]{}'",
        ],
        examples: [
          {
            input: 's = "()"',
            output: "true",
            explanation: "Valid parentheses.",
          },
          {
            input: 's = "()[]{}"',
            output: "true",
            explanation: "Valid parentheses.",
          },
          {
            input: 's = "(]"',
            output: "false",
            explanation: "Invalid parentheses.",
          },
        ],
        testCases: [
          {
            input: '"()"',
            output: "true",
            explanation: "Valid parentheses",
          },
          {
            input: '"()[]{}"',
            output: "true",
            explanation: "Valid parentheses",
          },
          {
            input: '"(]"',
            output: "false",
            explanation: "Invalid parentheses",
          },
          {
            input: '"([)]"',
            output: "false",
            explanation: "Invalid parentheses",
          },
        ],
        starterCode: `function main(s) {
  // Your solution here
  // Return true if the parentheses are valid, false otherwise
}`,
        solutionCode: `function main(s) {
  const stack = [];
  const pairs = {
    ')': '(',
    '}': '{',
    ']': '['
  };
  
  for (let char of s) {
    if (char === '(' || char === '{' || char === '[') {
      stack.push(char);
    } else {
      if (stack.pop() !== pairs[char]) {
        return false;
      }
    }
  }
  
  return stack.length === 0;
}`,
        timeLimit: 1000,
        memoryLimit: 128,
        points: 100,
        tags: ["stack", "string"],
        isActive: true,
        isPublished: true,
        createdBy: adminUser.insertedId.toString(),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        title: "Maximum Subarray",
        description: "Find the maximum sum of a contiguous subarray",
        problem: `Given an integer array nums, find the subarray with the largest sum, and return its sum.

A subarray is a contiguous part of an array.`,
        difficulty: "MEDIUM",
        category: "Dynamic Programming",
        constraints: ["1 <= nums.length <= 105", "-104 <= nums[i] <= 104"],
        examples: [
          {
            input: "nums = [-2,1,-3,4,-1,2,1,-5,4]",
            output: "6",
            explanation: "The subarray [4,-1,2,1] has the largest sum 6.",
          },
          {
            input: "nums = [1]",
            output: "1",
            explanation: "The subarray [1] has the largest sum 1.",
          },
        ],
        testCases: [
          {
            input: "[-2, 1, -3, 4, -1, 2, 1, -5, 4]",
            output: "6",
            explanation: "Subarray [4, -1, 2, 1] has sum 6",
          },
          {
            input: "[1]",
            output: "1",
            explanation: "Single element array",
          },
          {
            input: "[5, 4, -1, 7, 8]",
            output: "23",
            explanation: "Entire array has sum 23",
          },
        ],
        starterCode: `function main(nums) {
  // Your solution here
  // Return the maximum sum of a contiguous subarray
}`,
        solutionCode: `function main(nums) {
  let maxSum = nums[0];
  let currentSum = nums[0];
  
  for (let i = 1; i < nums.length; i++) {
    currentSum = Math.max(nums[i], currentSum + nums[i]);
    maxSum = Math.max(maxSum, currentSum);
  }
  
  return maxSum;
}`,
        timeLimit: 1000,
        memoryLimit: 128,
        points: 150,
        tags: ["dynamic-programming", "arrays"],
        isActive: true,
        isPublished: true,
        createdBy: adminUser.insertedId.toString(),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    const challengeResults = await db
      .collection("challenges")
      .insertMany(challenges);
    const challengeIds = Object.values(challengeResults.insertedIds);

    // Create sample stakes
    console.log("💰 Creating sample stakes...");
    const stakes = [
      {
        userId: allUsers[1], // Alice
        amount: 5.0,
        startTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        endTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
        challengesRequired: 5,
        challengesCompleted: 2,
        status: "ACTIVE",
        transactionHash: "0xabc123def456ghi789jkl012mno345pqr678stu901vwx234yz",
        challengeIds: challengeIds.slice(0, 3),
        fee: 0,
        reward: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        userId: allUsers[2], // Bob
        amount: 5.0,
        startTime: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000), // 6 days ago
        endTime: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
        challengesRequired: 5,
        challengesCompleted: 5,
        status: "COMPLETED",
        transactionHash: "0xdef456ghi789jkl012mno345pqr678stu901vwx234yzabc123",
        unstakeTransactionHash:
          "0xghi789jkl012mno345pqr678stu901vwx234yzabc123def456",
        challengeIds: challengeIds,
        fee: 0,
        reward: 0.5,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    await db.collection("stakes").insertMany(stakes);

    // Create sample submissions
    console.log("📝 Creating sample submissions...");
    const submissions = [
      {
        userId: allUsers[1], // Alice
        challengeId: challengeIds[0],
        stakeId: stakes[0]._id,
        language: "JAVASCRIPT",
        code: `function twoSum(nums, target) {
  const map = new Map();
  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i];
    if (map.has(complement)) {
      return [map.get(complement), i];
    }
    map.set(nums[i], i);
  }
  return [];
}`,
        status: "ACCEPTED",
        executionTime: 15,
        memoryUsed: 45.2,
        score: 100,
        testResults: [
          {
            input: "[2, 7, 11, 15]\n9",
            expectedOutput: "[0, 1]",
            actualOutput: "[0, 1]",
            passed: true,
            executionTime: 5,
          },
          {
            input: "[3, 2, 4]\n6",
            expectedOutput: "[1, 2]",
            actualOutput: "[1, 2]",
            passed: true,
            executionTime: 3,
          },
          {
            input: "[3, 3]\n6",
            expectedOutput: "[0, 1]",
            actualOutput: "[0, 1]",
            passed: true,
            executionTime: 2,
          },
        ],
        submittedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        completedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      },
    ];

    await db.collection("submissions").insertMany(submissions);

    // Create system configurations
    console.log("⚙️ Creating system configurations...");
    const systemConfigs = [
      {
        key: "DEFAULT_STAKE_AMOUNT",
        value: "5.0",
        description: "Default Token amount for staking",
        updatedAt: new Date(),
      },
      {
        key: "DEFAULT_STAKE_PERIOD",
        value: "5",
        description: "Default staking period in days",
        updatedAt: new Date(),
      },
      {
        key: "DEFAULT_CHALLENGES_REQUIRED",
        value: "5",
        description: "Default number of challenges required to complete stake",
        updatedAt: new Date(),
      },
      {
        key: "STAKE_FEE_PERCENTAGE",
        value: "2.5",
        description: "Fee percentage if challenges are not completed",
        updatedAt: new Date(),
      },
      {
        key: "REWARD_MULTIPLIER",
        value: "1.1",
        description: "Reward multiplier for successful stake completion",
        updatedAt: new Date(),
      },
    ];

    await db.collection("systemConfigs").insertMany(systemConfigs);

    console.log("✅ Database seeding completed successfully!");
    console.log("📊 Created:");
    console.log("  - 4 users (1 admin, 3 regular users)");
    console.log("  - 3 challenges (2 Easy, 1 Medium)");
    console.log("  - 2 stakes (1 active, 1 completed)");
    console.log("  - 1 submission");
    console.log("  - 4 user stats records");
    console.log("  - 5 system configurations");
  } catch (error) {
    console.error("❌ Database seeding failed:", error.message);

    if (error.message.includes("ECONNREFUSED")) {
      console.log("\n🔧 MongoDB Connection Issue:");
      console.log("1. Make sure MongoDB is running");
      console.log("2. Check if the port 27017 is correct");
      console.log("3. Verify your MONGODB_URI in .env.local");
      console.log("4. For MongoDB Atlas, make sure your IP is whitelisted");
    } else {
      console.log("\n🔧 General Setup:");
      console.log("1. Make sure you have a .env.local file");
      console.log("2. Set MONGODB_URI in your environment");
      console.log("3. Check your MongoDB connection string");
    }
  } finally {
    await client.close();
  }
}

// Run seeding if called directly
if (require.main === module) {
  seedComplete();
}

module.exports = { seedComplete };
