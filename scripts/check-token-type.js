/**
 * Check what type of token this is and how to get balance
 */

const { Aptos, AptosConfig, Network, AccountAddress } = require("@aptos-labs/ts-sdk");

const TESTNET_CONFIG = new AptosConfig({ network: Network.TESTNET });
const aptos = new Aptos(TESTNET_CONFIG);

const TOKEN_ADDRESS = "0xf773bc6eebd44641bf05de104de29d1a824f24bdecbdaaf5279a18a13e8987de";
const TEST_ADDRESS = process.argv[2] || "0xca10b0176c34f9a8315589ff977645e04497814e9753d21f7d7e7c3d83aa7b57";

async function checkTokenType() {
  console.log("=".repeat(70));
  console.log("Checking Token Type and Balance Method");
  console.log("=".repeat(70));
  console.log(`Token Address: ${TOKEN_ADDRESS}`);
  console.log(`Test Address: ${TEST_ADDRESS}`);
  console.log("=".repeat(70));
  console.log();

  const accountAddress = AccountAddress.fromString(TEST_ADDRESS);
  const tokenAddr = AccountAddress.fromString(TOKEN_ADDRESS);

  // Check 1: Get all account resources to see what's there
  console.log("1. Checking all account resources...");
  try {
    const resources = await aptos.getAccountResources({ accountAddress });
    
    console.log(`Found ${resources.length} resources`);
    
    // Look for CoinStore resources
    const coinStores = resources.filter(r => r.type.includes("CoinStore"));
    console.log(`\nCoinStore resources found: ${coinStores.length}`);
    coinStores.forEach((store, i) => {
      console.log(`  ${i + 1}. ${store.type}`);
      if (store.type.includes(TOKEN_ADDRESS) || store.type.includes("dojohunt") || store.type.includes("DojoHunt")) {
        console.log(`     DATA: ${JSON.stringify(store.data, null, 2)}`);
      }
    });

    // Look for fungible asset stores
    const faStores = resources.filter(r => r.type.includes("FungibleAsset") || r.type.includes("fungible"));
    console.log(`\nFungible Asset resources found: ${faStores.length}`);
    faStores.forEach((store, i) => {
      console.log(`  ${i + 1}. ${store.type}`);
    });

  } catch (error) {
    console.log(`Error: ${error.message}`);
  }

  console.log("\n" + "=".repeat(70));

  // Check 2: Try to get token metadata from the token address
  console.log("\n2. Checking token metadata at token address...");
  try {
    const metadataResource = await aptos.getAccountResource({
      accountAddress: tokenAddr,
      resourceType: `${TOKEN_ADDRESS}::dojohunt_token::TokenMetadata`,
    });
    console.log("✓ TokenMetadata found:");
    console.log(JSON.stringify(metadataResource.data, null, 2));
  } catch (error) {
    console.log(`✗ TokenMetadata not found: ${error.message}`);
  }

  // Check 3: Try CoinInfo
  console.log("\n3. Checking CoinInfo...");
  try {
    const coinInfo = await aptos.getAccountResource({
      accountAddress: tokenAddr,
      resourceType: `0x1::coin::CoinInfo<${TOKEN_ADDRESS}::dojohunt_token::DojoHuntCoin>`,
    });
    console.log("✓ CoinInfo found:");
    console.log(JSON.stringify(coinInfo.data, null, 2));
  } catch (error) {
    console.log(`✗ CoinInfo not found: ${error.message}`);
  }

  // Check 4: Try different coin type formats
  console.log("\n4. Testing different coin type formats...");
  const coinTypeFormats = [
    `${TOKEN_ADDRESS}::dojohunt_token::DojoHuntCoin`,
    `${TOKEN_ADDRESS}::dojohunt_token::TSKULL`,
    `${TOKEN_ADDRESS}::dojohunt_token::Coin`,
  ];

  for (const coinType of coinTypeFormats) {
    const coinStoreType = `0x1::coin::CoinStore<${coinType}>`;
    try {
      const store = await aptos.getAccountResource({
        accountAddress,
        resourceType: coinStoreType,
      });
      console.log(`✓ Found CoinStore for: ${coinType}`);
      console.log(`  Data: ${JSON.stringify(store.data, null, 2)}`);
    } catch (error) {
      // Silently continue
    }
  }

  // Check 5: Try fungible asset balance
  console.log("\n5. Checking fungible asset balance...");
  try {
    // Fungible assets are stored differently - they use the asset address directly
    const faMetadata = await aptos.getAccountResource({
      accountAddress: tokenAddr,
      resourceType: "0x1::fungible_asset::Metadata",
    });
    console.log("✓ Fungible Asset Metadata found:");
    console.log(JSON.stringify(faMetadata.data, null, 2));
    
    // Try to get balance using fungible asset methods
    // Note: This might require different API calls
  } catch (error) {
    console.log(`✗ Fungible Asset Metadata not found: ${error.message}`);
  }

  console.log("\n" + "=".repeat(70));
  console.log("Check complete!");
  console.log("=".repeat(70));
}

checkTokenType()
  .then(() => process.exit(0))
  .catch(error => {
    console.error("Error:", error);
    process.exit(1);
  });

