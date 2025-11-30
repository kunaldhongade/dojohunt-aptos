/**
 * Test balance with correct token address (same as staking)
 */

const { Aptos, AptosConfig, Network, AccountAddress } = require("@aptos-labs/ts-sdk");

const TESTNET_CONFIG = new AptosConfig({ network: Network.TESTNET });
const aptos = new Aptos(TESTNET_CONFIG);

// CORRECT token address (same as staking module)
const TOKEN_MODULE_ADDRESS = "0xca10b0176c34f9a8315589ff977645e04497814e9753d21f7d7e7c3d83aa7b57";
const TOKEN_MODULE_NAME = "dojohunt_token";
const COIN_TYPE = `${TOKEN_MODULE_ADDRESS}::${TOKEN_MODULE_NAME}::DojoHuntCoin`;
const COIN_STORE_TYPE = `0x1::coin::CoinStore<${COIN_TYPE}>`;

// Test address (deployer - should check if it has tokens)
const TEST_ADDRESS = "0xca10b0176c34f9a8315589ff977645e04497814e9753d21f7d7e7c3d83aa7b57";

const decimals = 6;

function getBalanceFromCoinStore(coinStore) {
  if (coinStore?.coin?.value !== undefined) {
    return BigInt(coinStore.coin.value).toString();
  }
  if (coinStore?.value !== undefined) {
    return BigInt(coinStore.value).toString();
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
  console.log("Testing with CORRECT token address:");
  console.log(`Token: ${TOKEN_MODULE_ADDRESS}`);
  console.log(`Coin Type: ${COIN_TYPE}`);
  console.log(`Test Address: ${TEST_ADDRESS}`);
  console.log();

  const accountAddress = AccountAddress.fromString(TEST_ADDRESS);

  try {
    const coinStoreResource = await aptos.getAccountResource({
      accountAddress,
      resourceType: COIN_STORE_TYPE,
    });

    console.log("✓ CoinStore found!");
    console.log("Data:", JSON.stringify(coinStoreResource.data, null, 2));

    const amountStr = getBalanceFromCoinStore(coinStoreResource.data);
    const balanceStr = amountStr || "0";
    
    const divisor = BigInt(10 ** decimals);
    const rawBalance = BigInt(balanceStr);
    const formattedBalance = Number(rawBalance) / Number(divisor);

    console.log(`Raw: ${balanceStr}`);
    console.log(`Formatted: ${formattedBalance} TSKULL`);
    console.log(`Formatted (helper): ${formatTokenAmount(balanceStr, decimals)} TSKULL`);

    return { success: true, rawBalance: balanceStr, formattedBalance: formattedBalance.toString() };
  } catch (error) {
    if (error.message?.includes("resource_not_found")) {
      console.log("✗ No CoinStore (balance is 0)");
      return { success: true, rawBalance: "0", formattedBalance: "0" };
    }
    console.log(`✗ Error: ${error.message}`);
    throw error;
  }
}

testBalance()
  .then(result => {
    console.log("\nResult:", JSON.stringify(result, null, 2));
    process.exit(0);
  })
  .catch(error => {
    console.error("Failed:", error);
    process.exit(1);
  });

