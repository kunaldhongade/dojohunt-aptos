/**
 * Test balance with CORRECT token address (fungible asset address)
 */

const { Aptos, AptosConfig, Network, AccountAddress } = require("@aptos-labs/ts-sdk");

const TESTNET_CONFIG = new AptosConfig({ network: Network.TESTNET });
const aptos = new Aptos(TESTNET_CONFIG);

// CORRECT token address (fungible asset address from explorer)
const TOKEN_MODULE_ADDRESS = "0xf773bc6eebd44641bf05de104de29d1a824f24bdecbdaaf5279a18a13e8987de";
const TOKEN_MODULE_NAME = "dojohunt_token";
const COIN_TYPE = `${TOKEN_MODULE_ADDRESS}::${TOKEN_MODULE_NAME}::DojoHuntCoin`;
const COIN_STORE_TYPE = `0x1::coin::CoinStore<${COIN_TYPE}>`;

// Test with a wallet address that should have tokens
// User should provide their wallet address here
const TEST_ADDRESS = process.argv[2] || "0xca10b0176c34f9a8315589ff977645e04497814e9753d21f7d7e7c3d83aa7b57";

const decimals = 6; // TSKULL has 6 decimals

function getBalanceFromCoinStore(coinStore) {
  if (coinStore?.coin?.value !== undefined) {
    return BigInt(coinStore.coin.value).toString();
  }
  if (coinStore?.value !== undefined) {
    return BigInt(coinStore.value).toString();
  }
  if (coinStore?.coin?.val !== undefined) {
    return BigInt(coinStore.coin.val).toString();
  }
  if (typeof coinStore?.coin === "string") {
    return BigInt(coinStore.coin).toString();
  }
  if (typeof coinStore?.coin === "number") {
    return BigInt(coinStore.coin).toString();
  }
  return null;
}

function formatTokenAmount(amount, decimals) {
  if (!amount || amount === "0") return "0";
  const amountBigInt = BigInt(amount);
  const divisor = BigInt(10 ** decimals);
  const wholePart = amountBigInt / divisor;
  const fractionalPart = amountBigInt % divisor;
  const fractionalStr = fractionalPart.toString().padStart(decimals, "0");
  const trimmedFractional = fractionalStr.replace(/0+$/, "");
  if (trimmedFractional === "") return wholePart.toString();
  return `${wholePart}.${trimmedFractional}`;
}

async function testBalance() {
  console.log("=".repeat(70));
  console.log("Testing Token Balance with CORRECT Fungible Asset Address");
  console.log("=".repeat(70));
  console.log(`Token Address: ${TOKEN_MODULE_ADDRESS}`);
  console.log(`Token Module: ${TOKEN_MODULE_NAME}`);
  console.log(`Coin Type: ${COIN_TYPE}`);
  console.log(`Coin Store Type: ${COIN_STORE_TYPE}`);
  console.log(`Test Address: ${TEST_ADDRESS}`);
  console.log(`Decimals: ${decimals}`);
  console.log("=".repeat(70));
  console.log();

  const accountAddress = AccountAddress.fromString(TEST_ADDRESS);

  // Method 1: Try CoinStore resource directly
  console.log("Method 1: Reading CoinStore resource directly...");
  try {
    const coinStoreResource = await aptos.getAccountResource({
      accountAddress,
      resourceType: COIN_STORE_TYPE,
    });

    console.log("✓ CoinStore resource found!");
    console.log("CoinStore data:", JSON.stringify(coinStoreResource.data, null, 2));

    if (coinStoreResource && coinStoreResource.data) {
      const amountStr = getBalanceFromCoinStore(coinStoreResource.data);
      const balanceStr = amountStr || "0";
      
      console.log(`Raw balance: ${balanceStr}`);
      
      const divisor = BigInt(10 ** decimals);
      const rawBalance = BigInt(balanceStr);
      const formattedBalance = Number(rawBalance) / Number(divisor);

      console.log(`Formatted balance: ${formattedBalance} TSKULL`);
      console.log(`Formatted (with helper): ${formatTokenAmount(balanceStr, decimals)} TSKULL`);
      
      console.log();
      console.log("=".repeat(70));
      console.log("SUCCESS! Balance found:");
      console.log("=".repeat(70));
      console.log(JSON.stringify({
        success: true,
        method: "CoinStore",
        rawBalance: balanceStr,
        formattedBalance: formattedBalance.toString(),
      }, null, 2));
      
      return {
        success: true,
        method: "CoinStore",
        rawBalance: balanceStr,
        formattedBalance: formattedBalance.toString(),
      };
    }
  } catch (error) {
    console.log(`✗ CoinStore method failed: ${error.message}`);
    if (error.message?.includes("RESOURCE_NOT_FOUND") || 
        error.message?.includes("resource_not_found") ||
        error.message?.includes("Account not found")) {
      console.log("  → Account has no CoinStore for this token (balance is 0)");
      console.log("  → This means the wallet has never received TSKULL tokens");
      console.log();
      console.log("=".repeat(70));
      console.log("Result: Balance is 0");
      console.log("=".repeat(70));
      console.log(JSON.stringify({
        success: true,
        method: "CoinStore (not found)",
        rawBalance: "0",
        formattedBalance: "0",
        note: "Account has no CoinStore resource for this token"
      }, null, 2));
      
      return {
        success: true,
        method: "CoinStore (not found)",
        rawBalance: "0",
        formattedBalance: "0",
      };
    }
  }

  console.log();
  console.log("=".repeat(70));
  console.log("All methods failed!");
  console.log("=".repeat(70));
  
  return {
    success: false,
    error: "All balance fetching methods failed",
  };
}

testBalance()
  .then(result => {
    process.exit(result.success ? 0 : 1);
  })
  .catch(error => {
    console.error("Test failed:", error);
    process.exit(1);
  });

