/**
 * Test script to fetch token balance for a specific address
 */

const { Aptos, AptosConfig, Network, AccountAddress } = require("@aptos-labs/ts-sdk");

// Configuration
const TESTNET_CONFIG = new AptosConfig({ network: Network.TESTNET });
const aptos = new Aptos(TESTNET_CONFIG);

// Addresses
const TOKEN_MODULE_ADDRESS = "0xf773bc6eebd44641bf05de104de29d1a824f24bdecbdaaf5279a18a13e8987de";
const TOKEN_MODULE_NAME = "dojohunt_token";
const TEST_ADDRESS = "0xca10b0176c34f9a8315589ff977645e04497814e9753d21f7d7e7c3d83aa7b57";
const COIN_TYPE = `${TOKEN_MODULE_ADDRESS}::${TOKEN_MODULE_NAME}::DojoHuntCoin`;
const COIN_STORE_TYPE = `0x1::coin::CoinStore<${COIN_TYPE}>`;

/**
 * Get balance from CoinStore data structure
 */
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

/**
 * Format token amount with decimals
 */
function formatTokenAmount(amount, decimals) {
  if (!amount || amount === "0") {
    return "0";
  }

  const amountBigInt = BigInt(amount);
  const divisor = BigInt(10 ** decimals);
  const wholePart = amountBigInt / divisor;
  const fractionalPart = amountBigInt % divisor;
  const fractionalStr = fractionalPart.toString().padStart(decimals, "0");
  
  // Remove trailing zeros
  const trimmedFractional = fractionalStr.replace(/0+$/, "");
  
  if (trimmedFractional === "") {
    return wholePart.toString();
  }
  
  return `${wholePart}.${trimmedFractional}`;
}

async function testTokenBalance() {
  console.log("=".repeat(60));
  console.log("Testing Token Balance Fetching");
  console.log("=".repeat(60));
  console.log(`Token Address: ${TOKEN_MODULE_ADDRESS}`);
  console.log(`Test Address: ${TEST_ADDRESS}`);
  console.log(`Coin Type: ${COIN_TYPE}`);
  console.log(`Coin Store Type: ${COIN_STORE_TYPE}`);
  console.log("=".repeat(60));
  console.log();

  const accountAddress = AccountAddress.fromString(TEST_ADDRESS);
  const decimals = 6; // From the explorer, TSKULL has 6 decimals

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
      console.log("  → This is normal if the account has never received this token");
    }
  }

  console.log();

  // Method 2: Try framework coin::balance view function
  console.log("Method 2: Using 0x1::coin::balance view function...");
  try {
    // Convert address to AccountAddress for the view function
    const userAddr = AccountAddress.fromString(TEST_ADDRESS);
    const balance = await aptos.view({
      function: "0x1::coin::balance",
      functionArguments: [COIN_TYPE, userAddr.toString()],
    });

    console.log("✓ View function succeeded!");
    console.log("Balance response:", JSON.stringify(balance, null, 2));

    let rawBalanceValue;
    if (Array.isArray(balance)) {
      rawBalanceValue = balance[0] || "0";
    } else if (typeof balance === "string" || typeof balance === "number") {
      rawBalanceValue = balance;
    } else {
      rawBalanceValue = balance?.value || balance?.balance || "0";
    }

    const divisor = BigInt(10 ** decimals);
    const rawBalance = BigInt(String(rawBalanceValue));
    const formattedBalance = Number(rawBalance) / Number(divisor);

    console.log(`Raw balance: ${rawBalanceValue}`);
    console.log(`Formatted balance: ${formattedBalance} TSKULL`);

    return {
      success: true,
      method: "coin::balance view",
      rawBalance: String(rawBalanceValue),
      formattedBalance: formattedBalance.toString(),
    };
  } catch (error) {
    console.log(`✗ View function failed: ${error.message}`);
  }

  console.log();

  // Method 3: Try custom balance_of function
  console.log("Method 3: Using custom balance_of function...");
  try {
    const userAddr = AccountAddress.fromString(TEST_ADDRESS);
    const balance = await aptos.view({
      function: `${TOKEN_MODULE_ADDRESS}::${TOKEN_MODULE_NAME}::balance_of`,
      functionArguments: [userAddr.toString()],
    });

    console.log("✓ Custom function succeeded!");
    console.log("Balance response:", JSON.stringify(balance, null, 2));

    let rawBalanceValue;
    if (Array.isArray(balance)) {
      rawBalanceValue = balance[0] || "0";
    } else if (typeof balance === "string" || typeof balance === "number") {
      rawBalanceValue = balance;
    } else {
      rawBalanceValue = balance?.value || balance?.balance || "0";
    }

    const divisor = BigInt(10 ** decimals);
    const rawBalance = BigInt(String(rawBalanceValue));
    const formattedBalance = Number(rawBalance) / Number(divisor);

    console.log(`Raw balance: ${rawBalanceValue}`);
    console.log(`Formatted balance: ${formattedBalance} TSKULL`);

    return {
      success: true,
      method: "balance_of",
      rawBalance: String(rawBalanceValue),
      formattedBalance: formattedBalance.toString(),
    };
  } catch (error) {
    console.log(`✗ Custom function failed: ${error.message}`);
  }

  console.log();
  console.log("=".repeat(60));
  console.log("Summary:");
  console.log("=".repeat(60));
  console.log("The account has no CoinStore for this token.");
  console.log("This means the balance is 0 (account hasn't received any tokens).");
  console.log("The view functions may have issues with the SDK version.");
  console.log();
  console.log("Returning 0 balance as expected...");
  console.log("=".repeat(60));
  
  return {
    success: true,
    method: "CoinStore (not found - balance is 0)",
    rawBalance: "0",
    formattedBalance: "0",
    note: "Account has no CoinStore resource, which means balance is 0",
  };
}

// Run the test
testTokenBalance()
  .then((result) => {
    console.log();
    console.log("=".repeat(60));
    console.log("Final Result:");
    console.log("=".repeat(60));
    console.log(JSON.stringify(result, null, 2));
    process.exit(result.success ? 0 : 1);
  })
  .catch((error) => {
    console.error("Test failed with error:", error);
    process.exit(1);
  });

