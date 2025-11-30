// Test the leaderboard API endpoint to see what it returns
const http = require("http");

const options = {
  hostname: "localhost",
  port: 3000,
  path: "/api/leaderboard?timeFilter=all-time&categoryFilter=score",
  method: "GET",
};

console.log("Testing leaderboard API endpoint...");
console.log(`URL: http://${options.hostname}:${options.port}${options.path}\n`);

const req = http.request(options, (res) => {
  let data = "";

  res.on("data", (chunk) => {
    data += chunk;
  });

  res.on("end", () => {
    try {
      const json = JSON.parse(data);
      console.log("Response Status:", res.statusCode);
      console.log("\nResponse Data:");
      console.log(JSON.stringify(json, null, 2));

      if (json.success && json.data && json.data.users) {
        console.log("\n" + "=".repeat(80));
        console.log("USER STATS SUMMARY");
        console.log("=".repeat(80));
        json.data.users.forEach((user, index) => {
          console.log(`\n${index + 1}. ${user.name} (@${user.username})`);
          console.log(`   Score: ${user.stats.totalScore}`);
          console.log(`   Challenges: ${user.stats.totalChallengesCompleted}`);
          console.log(`   Staked: ${user.stats.totalStaked} TSKULL`);
          console.log(`   Rewards: ${user.stats.totalRewards} TSKULL`);
        });
      }
    } catch (e) {
      console.error("Error parsing JSON:", e);
      console.log("Raw response:", data);
    }
  });
});

req.on("error", (e) => {
  console.error(`Problem with request: ${e.message}`);
  console.log("\nMake sure the Next.js dev server is running on port 3000");
});

req.end();

