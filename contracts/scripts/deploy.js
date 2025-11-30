#!/usr/bin/env node

/**
 * Deployment script for DojoHunt contracts
 * Based on Aptos best practices from create-aptos-dapp templates
 *
 * Usage:
 *   node scripts/deploy.js [--network testnet|mainnet] [--upgrade]
 */

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../../.env") });

// Try to use TypeScript SDK CLI wrapper if available
let MoveCLI = null;
let AptosSDK = null;
try {
  AptosSDK = require("@aptos-labs/ts-sdk");
  const cli = require("@aptos-labs/ts-sdk/dist/common/cli/index.js");
  MoveCLI = cli.Move;
  log("✅ TypeScript SDK CLI wrapper available", "green");
} catch (error) {
  // Fallback to direct aptos CLI if SDK not available
  MoveCLI = null;
  AptosSDK = null;
}

// Colors for console output
const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  blue: "\x1b[34m",
};

function log(message, color = "reset") {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function exec(command, options = {}) {
  try {
    const result = execSync(command, {
      encoding: "utf-8",
      stdio: "pipe", // Capture output to check for errors
      ...options,
    });
    // Print output
    console.log(result);
    return result;
  } catch (error) {
    // Print error output
    if (error.stdout) console.log(error.stdout);
    if (error.stderr) console.error(error.stderr);
    log(`❌ Error executing: ${command}`, "red");
    throw error;
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
const network = args.includes("--network")
  ? args[args.indexOf("--network") + 1] || "testnet"
  : "testnet";
const isUpgrade = args.includes("--upgrade");
const isNewDeployment = args.includes("--new") || !isUpgrade;

// Get configuration from .env
let PRIVATE_KEY = process.env.TOKEN_OWNER_PRIVATE_KEY;
const MODULE_ADDRESS =
  process.env.NEXT_PUBLIC_STAKING_MODULE_ADDRESS ||
  process.env.NEXT_PUBLIC_TOKEN_MODULE_ADDRESS;
const API_KEY = process.env.APTOS_API_KEY;

if (!PRIVATE_KEY) {
  log("❌ Error: TOKEN_OWNER_PRIVATE_KEY not found in .env", "red");
  process.exit(1);
}

// Remove quotes and whitespace if present
PRIVATE_KEY = PRIVATE_KEY.replace(/^["'\s]+|["'\s]+$/g, "").trim();

// Fix duplicate private key (sometimes .env has it duplicated)
if (PRIVATE_KEY.includes("ed25519-priv-0x")) {
  // Check if there are multiple occurrences
  const occurrences = (PRIVATE_KEY.match(/ed25519-priv-0x/g) || []).length;
  if (occurrences > 1) {
    log("⚠️  Detected duplicate private key, fixing...", "yellow");
    // Extract the first valid private key (ed25519-priv-0x + 64 hex chars)
    const match = PRIVATE_KEY.match(/ed25519-priv-0x[a-fA-F0-9]{64}/);
    if (match) {
      PRIVATE_KEY = match[0];
      log("✅ Fixed private key format", "green");
    } else {
      log(
        "❌ Error: Could not extract valid private key from duplicate",
        "red"
      );
      log(`   Raw key: ${PRIVATE_KEY.substring(0, 50)}...`, "red");
      process.exit(1);
    }
  }
}

// Validate private key format
// Expected: "ed25519-priv-0x" (17 chars) + 64 hex chars = 81 chars total
if (!PRIVATE_KEY.startsWith("ed25519-priv-0x")) {
  log(
    "❌ Error: Invalid private key format. Must start with 'ed25519-priv-0x'",
    "red"
  );
  log(`   Got: ${PRIVATE_KEY.substring(0, 30)}...`, "red");
  process.exit(1);
}

// Check hex part length (should be 64 chars after "ed25519-priv-0x")
const hexPart = PRIVATE_KEY.replace("ed25519-priv-0x", "");
if (hexPart.length !== 64 || !/^[a-fA-F0-9]{64}$/.test(hexPart)) {
  log(
    "❌ Error: Invalid private key format. Hex part must be exactly 64 characters",
    "red"
  );
  log(`   Got hex part length: ${hexPart.length}`, "red");
  log(`   Private key: ${PRIVATE_KEY.substring(0, 50)}...`, "red");
  process.exit(1);
}

// Set API key if available
if (API_KEY) {
  process.env.APTOS_API_KEY = API_KEY;
  log(`✅ Using API key: ${API_KEY.substring(0, 20)}...`, "green");
}

log(`🚀 Deploying DojoHunt Contracts to ${network.toUpperCase()}`, "blue");
if (isUpgrade) {
  log(
    "📦 Mode: UPGRADE (publishing new version at existing address)",
    "yellow"
  );
} else {
  log(
    "📦 Mode: NEW DEPLOYMENT (creating new contract at new address)",
    "yellow"
  );
}

// Determine module address
let moduleAddress = MODULE_ADDRESS;
if (!moduleAddress && isUpgrade) {
  log(
    "❌ Error: Module address required for upgrade. Set NEXT_PUBLIC_STAKING_MODULE_ADDRESS in .env",
    "red"
  );
  process.exit(1);
}

// For new deployments, always use 0x0 (will be determined during publish)
if (!isUpgrade) {
  moduleAddress = "0x0";
  log("📝 Using 0x0 - new address will be determined during publish", "yellow");
  log("💡 The deployed address will be shown in the output", "yellow");
} else {
  log(`📝 Module Address: ${moduleAddress}`, "yellow");
}

// For new deployments, get the publisher account address first
let actualModuleAddress = moduleAddress;
if (!isUpgrade && moduleAddress === "0x0") {
  log("🔍 Getting publisher account address...", "yellow");
  try {
    // Derive account address from private key
    const { Account, Ed25519PrivateKey } = require("@aptos-labs/ts-sdk");
    const privateKey = new Ed25519PrivateKey(
      PRIVATE_KEY.replace("ed25519-priv-0x", "")
    );
    const account = Account.fromPrivateKey({ privateKey });
    actualModuleAddress = account.accountAddress.toString();
    log(`✅ Publisher account address: ${actualModuleAddress}`, "green");
    log(`📝 Will deploy to this address`, "yellow");
  } catch (error) {
    log("⚠️  Could not derive address from private key, using 0x0", "yellow");
    log("   The address will be determined during publish", "yellow");
    actualModuleAddress = "0x0";
  }
}

// Clean build directory first to avoid cached artifacts
log("🧹 Cleaning build directory...", "yellow");
try {
  const buildDir = path.join(__dirname, "..", "build");
  if (fs.existsSync(buildDir)) {
    fs.rmSync(buildDir, { recursive: true, force: true });
    log("✅ Build directory cleaned", "green");
  }
} catch (error) {
  log("⚠️  Could not clean build directory (may not exist)", "yellow");
}

// Compile contracts
log("🔨 Compiling contracts...", "yellow");
try {
  exec(`aptos move compile --named-addresses dojohunt=${actualModuleAddress}`, {
    cwd: path.join(__dirname, ".."),
  });
  log("✅ Compilation successful", "green");
} catch (error) {
  log("❌ Compilation failed", "red");
  process.exit(1);
}

// Publish contracts
log("📤 Publishing contracts...", "yellow");
log("⏳ This may take a few minutes...", "yellow");

try {
  // Use TypeScript SDK CLI wrapper if available (better API key handling)
  if (MoveCLI && AptosSDK) {
    log("📦 Using TypeScript SDK CLI wrapper...", "yellow");

    // Get API URL with API key if available
    let apiUrl = AptosSDK.NetworkToNodeAPI[network.toUpperCase()];
    if (API_KEY && apiUrl) {
      // Add API key to URL query params
      try {
        const url = new URL(apiUrl);
        url.searchParams.set("api_key", API_KEY);
        apiUrl = url.toString();
        log(`✅ API key added to URL`, "green");
      } catch (e) {
        log(`⚠️  Could not parse URL, using as-is: ${e.message}`, "yellow");
      }
    }

    const move = new MoveCLI();

    // Build extra arguments
    // For module upgrades, just publish to the same address (no special flag needed)
    const extraArgs = [
      `--private-key=${PRIVATE_KEY}`,
      `--url=${apiUrl}`,
      "--assume-yes",
    ];

    // Use publishPackage for module-based deployments
    move.publishPackage({
      packageDirectoryPath: path.join(__dirname, ".."),
      namedAddresses: {
        dojohunt: isUpgrade ? moduleAddress : actualModuleAddress,
      },
      extraArguments: extraArgs,
    });
  } else {
    // Fallback to direct aptos CLI
    log("📦 Using direct aptos CLI (SDK not available)...", "yellow");

    // Get API URL with API key embedded in URL (better for rate limits)
    let apiUrl = "";
    if (API_KEY) {
      // Get base URL from network
      const baseUrls = {
        testnet: "https://api.testnet.aptoslabs.com",
        mainnet: "https://api.mainnet.aptoslabs.com",
        devnet: "https://api.devnet.aptoslabs.com",
      };
      const baseUrl = baseUrls[network.toLowerCase()] || baseUrls.testnet;
      apiUrl = `${baseUrl}?api_key=${API_KEY}`;
      log(`✅ Using API URL with key: ${baseUrl}?api_key=***`, "green");
    }

    // For module upgrades, just publish to the same address (no special flag needed)
    // Use actualModuleAddress for publishing (may be different from moduleAddress for new deployments)
    const publishAddress = isUpgrade ? moduleAddress : actualModuleAddress;
    let publishCommand = `aptos move publish --named-addresses dojohunt=${publishAddress} --private-key "${PRIVATE_KEY}" --assume-yes`;

    if (apiUrl) {
      publishCommand += ` --url "${apiUrl}"`;
    } else {
      publishCommand += " --profile default";
    }

    // Set API key in environment as backup
    const env = { ...process.env };
    if (API_KEY) {
      env.APTOS_API_KEY = API_KEY;
      env.APTOS_NETWORK_API_KEY = API_KEY;
    }

    const output = exec(publishCommand, {
      cwd: path.join(__dirname, ".."),
      env: env,
    });

    // Check if output contains error
    if (output && (output.includes("Error") || output.includes("error"))) {
      throw new Error("Deployment failed - see output above");
    }
  }

  // Only show success if we got here without throwing
  log("✅ Contracts published successfully!", "green");

  if (isUpgrade) {
    log("✅ Contract upgraded at address:", "green");
    log(`   ${moduleAddress}`, "green");
  } else {
    log("✅ Contract deployed successfully!", "green");
    log(`📋 Deployed address: ${actualModuleAddress}`, "green");
    log("", "reset");
    log("📝 IMPORTANT: Update your .env file with:", "yellow");
    log(
      `   NEXT_PUBLIC_STAKING_MODULE_ADDRESS="${actualModuleAddress}"`,
      "yellow"
    );
    log(
      `   NEXT_PUBLIC_TOKEN_MODULE_ADDRESS="${actualModuleAddress}"`,
      "yellow"
    );
  }

  log("", "reset");
  log("📝 New view functions available:", "yellow");
  log("  - get_all_stakes()", "reset");
  log("  - get_all_active_stakes()", "reset");
  log("  - get_all_stakers()", "reset");
  log("  - get_pool_stats()", "reset");
  log("  - get_user_completed_challenges(address)", "reset");
  log("  - get_user_challenges_count(address)", "reset");
} catch (error) {
  log("❌ Deployment failed", "red");
  if (error.message.includes("rate limit")) {
    log("⚠️  Rate limit exceeded. Wait 5 minutes and try again.", "yellow");
    log("💡 Tip: Make sure APTOS_API_KEY is set in .env", "yellow");
  }
  process.exit(1);
}
