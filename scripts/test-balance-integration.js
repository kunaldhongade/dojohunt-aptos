/**
 * Test the balance.ts integration for TSKULL token
 */

// Use dynamic import for ES modules
async function testBalanceIntegration() {
  try {
    // Import the functions
    const { getComprehensiveBalance } = await import("../lib/balance.js");

    // Test address (you can change this to your wallet address)
    const TEST_ADDRESS =
      process.argv[2] ||
      "0xca10b0176c34f9a8315589ff977645e04497814e9753d21f7d7e7c3d83aa7b57";
    const TOKEN_ADDRESS =
      "0xf773bc6eebd44641bf05de104de29d1a824f24bdecbdaaf5279a18a13e8987de";

    console.log("=".repeat(70));
    console.log("Testing Balance.ts Integration for TSKULL Token");
    console.log("=".repeat(70));
    console.log(`Test Address: ${TEST_ADDRESS}`);
    console.log(`Token Address: ${TOKEN_ADDRESS}`);
    console.log(`Network: testnet`);
    console.log("=".repeat(70));
    console.log();

    console.log("Fetching comprehensive balance...");
    const startTime = Date.now();

    const walletBalance = await getComprehensiveBalance(
      TEST_ADDRESS,
      "testnet"
    );

    const endTime = Date.now();
    console.log(`✓ Balance fetched in ${endTime - startTime}ms`);
    console.log();

    console.log("=".repeat(70));
    console.log("Results:");
    console.log("=".repeat(70));
    console.log(`APT Balance: ${walletBalance.aptBalanceFormatted} APT`);
    console.log(`Total Tokens Found: ${walletBalance.tokenCount}`);
    console.log();

    // Find TSKULL token
    const tskullToken = walletBalance.tokens.find(
      (token) =>
        token.tokenType === TOKEN_ADDRESS ||
        token.tokenType.includes(TOKEN_ADDRESS) ||
        token.symbol === "TSKULL"
    );

    if (tskullToken) {
      console.log("✓ TSKULL Token Found!");
      console.log("-".repeat(70));
      console.log(`Token Type: ${tskullToken.tokenType}`);
      console.log(`Symbol: ${tskullToken.symbol || "N/A"}`);
      console.log(`Name: ${tskullToken.name || "N/A"}`);
      console.log(`Decimals: ${tskullToken.decimals || "N/A"}`);
      console.log(`Raw Amount: ${tskullToken.amount}`);
      console.log(
        `Formatted Amount: ${tskullToken.formattedAmount} ${
          tskullToken.symbol || "TSKULL"
        }`
      );
      console.log("-".repeat(70));
      console.log();

      console.log("=".repeat(70));
      console.log("SUCCESS! Balance found:");
      console.log("=".repeat(70));
      console.log(
        JSON.stringify(
          {
            success: true,
            balance: tskullToken.formattedAmount,
            rawBalance: tskullToken.amount,
            symbol: tskullToken.symbol,
            decimals: tskullToken.decimals,
          },
          null,
          2
        )
      );

      return {
        success: true,
        balance: tskullToken.formattedAmount,
        rawBalance: tskullToken.amount,
      };
    } else {
      console.log("✗ TSKULL Token not found in wallet");
      console.log();
      console.log("Available tokens:");
      if (walletBalance.tokens.length > 0) {
        walletBalance.tokens.forEach((token, i) => {
          console.log(
            `  ${i + 1}. ${token.symbol || "Unknown"} (${token.tokenType})`
          );
        });
      } else {
        console.log("  No tokens found");
      }
      console.log();
      console.log("=".repeat(70));
      console.log("Result: Balance is 0 (token not found)");
      console.log("=".repeat(70));
      console.log(
        JSON.stringify(
          {
            success: true,
            balance: "0",
            rawBalance: "0",
            note: "TSKULL token not found in wallet - balance is 0",
          },
          null,
          2
        )
      );

      return {
        success: true,
        balance: "0",
        rawBalance: "0",
      };
    }
  } catch (error) {
    console.error("=".repeat(70));
    console.error("ERROR:");
    console.error("=".repeat(70));
    console.error(error.message);
    console.error(error.stack);
    console.error("=".repeat(70));

    return {
      success: false,
      error: error.message,
    };
  }
}

// Run the test
testBalanceIntegration()
  .then((result) => {
    process.exit(result.success ? 0 : 1);
  })
  .catch((error) => {
    console.error("Test failed:", error);
    process.exit(1);
  });
