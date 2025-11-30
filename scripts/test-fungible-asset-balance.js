/**
 * Test balance for fungible asset (not managed coin)
 */

const { Aptos, AptosConfig, Network, AccountAddress } = require("@aptos-labs/ts-sdk");

const TESTNET_CONFIG = new AptosConfig({ network: Network.TESTNET });
const aptos = new Aptos(TESTNET_CONFIG);

// Fungible asset address (this is the asset itself, not a module)
const ASSET_ADDRESS = "0xf773bc6eebd44641bf05de104de29d1a824f24bdecbdaaf5279a18a13e8987de";
const TEST_ADDRESS = process.argv[2] || "0xca10b0176c34f9a8315589ff977645e04497814e9753d21f7d7e7c3d83aa7b57";

const decimals = 6;

async function testFungibleAssetBalance() {
  console.log("=".repeat(70));
  console.log("Testing Fungible Asset Balance");
  console.log("=".repeat(70));
  console.log(`Asset Address: ${ASSET_ADDRESS}`);
  console.log(`Test Address: ${TEST_ADDRESS}`);
  console.log("=".repeat(70));
  console.log();

  const accountAddress = AccountAddress.fromString(TEST_ADDRESS);
  const assetAddress = AccountAddress.fromString(ASSET_ADDRESS);

  // Method 1: Check for PrimaryFungibleStore (fungible assets use this)
  console.log("Method 1: Checking PrimaryFungibleStore...");
  try {
    const store = await aptos.getAccountResource({
      accountAddress,
      resourceType: "0x1::primary_fungible_store::FungibleStore",
    });
    
    console.log("✓ FungibleStore found!");
    console.log("Data:", JSON.stringify(store.data, null, 2));
    
    // The balance might be in the store's balances map
    if (store.data && typeof store.data === 'object') {
      const data = store.data;
      if (data.balances) {
        console.log("Balances map:", JSON.stringify(data.balances, null, 2));
      }
    }
  } catch (error) {
    console.log(`✗ FungibleStore not found: ${error.message}`);
  }

  console.log();

  // Method 2: Try using the asset address directly as coin type
  console.log("Method 2: Trying asset address as coin type...");
  const coinStoreType1 = `0x1::coin::CoinStore<${ASSET_ADDRESS}>`;
  try {
    const store = await aptos.getAccountResource({
      accountAddress,
      resourceType: coinStoreType1,
    });
    console.log("✓ Found CoinStore with asset address!");
    console.log("Data:", JSON.stringify(store.data, null, 2));
  } catch (error) {
    console.log(`✗ Not found: ${error.message}`);
  }

  console.log();

  // Method 3: Check all resources for anything related to this asset
  console.log("Method 3: Searching all resources for asset...");
  try {
    const resources = await aptos.getAccountResources({ accountAddress });
    const relevant = resources.filter(r => 
      r.type.includes(ASSET_ADDRESS) || 
      r.type.includes("fungible") ||
      r.type.includes("Fungible")
    );
    
    console.log(`Found ${relevant.length} relevant resources:`);
    relevant.forEach((r, i) => {
      console.log(`  ${i + 1}. ${r.type}`);
      if (r.data) {
        console.log(`     Data keys: ${Object.keys(r.data).join(", ")}`);
      }
    });
  } catch (error) {
    console.log(`Error: ${error.message}`);
  }

  console.log();

  // Method 4: Try using GraphQL indexer (fungible assets are often indexed)
  console.log("Method 4: Trying GraphQL indexer...");
  try {
    const query = `
      query GetBalance($owner: String!, $assetType: String!) {
        current_fungible_asset_balances(
          where: { 
            owner_address: { _eq: $owner },
            asset_type: { _eq: $assetType }
          }
        ) {
          amount
          asset_type
        }
      }
    `;

    const response = await fetch("https://api.testnet.aptoslabs.com/v1/graphql", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query,
        variables: {
          owner: TEST_ADDRESS,
          assetType: ASSET_ADDRESS,
        },
      }),
    });

    if (response.ok) {
      const result = await response.json();
      console.log("✓ GraphQL response:");
      console.log(JSON.stringify(result, null, 2));
      
      if (result.data?.current_fungible_asset_balances?.length > 0) {
        const balance = result.data.current_fungible_asset_balances[0];
        const amount = BigInt(balance.amount);
        const divisor = BigInt(10 ** decimals);
        const formatted = Number(amount) / Number(divisor);
        
        console.log(`\n✓ Balance found: ${formatted} TSKULL`);
        return { success: true, balance: formatted.toString() };
      }
    } else {
      console.log(`✗ GraphQL failed: ${response.status}`);
    }
  } catch (error) {
    console.log(`✗ GraphQL error: ${error.message}`);
  }

  console.log("\n" + "=".repeat(70));
  console.log("All methods tested");
  console.log("=".repeat(70));
}

testFungibleAssetBalance()
  .then(() => process.exit(0))
  .catch(error => {
    console.error("Error:", error);
    process.exit(1);
  });

