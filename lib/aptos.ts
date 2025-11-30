import {
  Account,
  AccountAddress,
  Aptos,
  AptosConfig,
  Ed25519PrivateKey,
  Network,
} from "@aptos-labs/ts-sdk";
import { logger } from "./logger";

// Network type for API requests
export type NetworkType = "mainnet" | "testnet" | "devnet";

// Get network from environment variable (defaults to DEVNET for testing)
const getNetwork = (): Network => {
  const networkEnv = (process.env.APTOS_NETWORK || "devnet").toLowerCase();

  switch (networkEnv) {
    case "mainnet":
      return Network.MAINNET;
    case "testnet":
      return Network.TESTNET;
    case "devnet":
    default:
      return Network.DEVNET;
  }
};

// Convert network string to Network enum
export function parseNetwork(networkStr?: string): Network {
  const network = (
    networkStr ||
    process.env.APTOS_NETWORK ||
    "devnet"
  ).toLowerCase();

  switch (network) {
    case "mainnet":
      return Network.MAINNET;
    case "testnet":
      return Network.TESTNET;
    case "devnet":
    default:
      return Network.DEVNET;
  }
}

/**
 * Get API key for a specific network
 * Supports network-specific keys: APTOS_API_KEY_DEVNET, APTOS_API_KEY_TESTNET, APTOS_API_KEY_MAINNET
 * Falls back to APTOS_API_KEY if network-specific key is not set
 */
function getApiKeyForNetwork(network: Network): string | undefined {
  // Get network-specific API key
  let apiKey: string | undefined;

  if (network === Network.DEVNET) {
    apiKey = process.env.APTOS_API_KEY_DEVNET || process.env.APTOS_API_KEY;
  } else if (network === Network.TESTNET) {
    apiKey = process.env.APTOS_API_KEY_TESTNET || process.env.APTOS_API_KEY;
  } else if (network === Network.MAINNET) {
    apiKey = process.env.APTOS_API_KEY_MAINNET || process.env.APTOS_API_KEY;
  } else {
    // Fallback to generic API key
    apiKey = process.env.APTOS_API_KEY;
  }

  return apiKey;
}

// Get Aptos instance for a specific network
export function getAptosInstance(network?: NetworkType | Network): Aptos {
  const networkEnum =
    typeof network === "string"
      ? parseNetwork(network)
      : network || parseNetwork();

  // Get network-specific API key
  const apiKey = getApiKeyForNetwork(networkEnum);

  const config = new AptosConfig({
    network: networkEnum,
    // Add API key if available (all networks can use API keys for rate limiting)
    ...(apiKey && { clientConfig: { API_KEY: apiKey } }),
  });
  return new Aptos(config);
}

// Default Aptos instance (for backward compatibility)
const defaultNetwork = getNetwork();
const defaultApiKey = getApiKeyForNetwork(defaultNetwork);
const defaultConfig = new AptosConfig({
  network: defaultNetwork,
  // Add API key if available
  ...(defaultApiKey && { clientConfig: { API_KEY: defaultApiKey } }),
});
const aptos = new Aptos(defaultConfig);

logger.info(
  `Aptos SDK default configured for: ${
    defaultNetwork === Network.MAINNET
      ? "MAINNET"
      : defaultNetwork === Network.TESTNET
      ? "TESTNET"
      : "DEVNET"
  }`
);

/**
 * Generate a new Aptos account
 *
 * Aptos Standards Compliance:
 * - Uses Ed25519 signature scheme (Aptos standard)
 * - Cryptographically secure random key generation
 * - Standard Aptos account format
 * - Compatible with Aptos SDK and network
 *
 * Security:
 * - Private keys are generated using secure random number generator
 * - Keys are never logged or exposed in error messages
 * - Keys are immediately encrypted before storage
 */
export function generateAptosAccount(): {
  address: string;
  publicKey: string;
  privateKey: string;
} {
  // Generate account using Aptos SDK (uses Ed25519 by default)
  // This ensures compatibility with Aptos network standards
  const account = Account.generate();

  // Normalize private key: remove 0x prefix if present, ensure 64 hex chars
  let privateKey = account.privateKey.toString();
  if (privateKey.startsWith("0x")) {
    privateKey = privateKey.slice(2);
  }

  return {
    address: account.accountAddress.toString(),
    publicKey: account.publicKey.toString(),
    privateKey, // Ed25519 hex format (64 chars, no 0x prefix)
  };
}

/**
 * Create an account from a private key
 * Handles keys with or without 0x prefix
 */
export function accountFromPrivateKey(privateKeyHex: string): Account {
  try {
    // Normalize: remove 0x prefix if present
    let normalizedKey = privateKeyHex.trim();
    if (normalizedKey.startsWith("0x")) {
      normalizedKey = normalizedKey.slice(2);
    }

    const privateKey = new Ed25519PrivateKey(normalizedKey);
    return Account.fromPrivateKey({ privateKey });
  } catch (error) {
    logger.error("Error creating account from private key:", error);
    throw new Error("Invalid private key format");
  }
}

/**
 * Get account balance (APT only)
 * Uses getAccountAPTAmount for accurate balance
 */
export async function getAccountBalance(
  address: string,
  network?: NetworkType
): Promise<string> {
  try {
    const aptosInstance = network ? getAptosInstance(network) : aptos;
    const accountAddress = AccountAddress.fromString(address);

    // Use getAccountAPTAmount for accurate APT balance
    const balance = await aptosInstance.getAccountAPTAmount({
      accountAddress,
    });

    return balance.toString();
  } catch (error: any) {
    if (
      error.message?.includes("Account not found") ||
      error.message?.includes("RESOURCE_NOT_FOUND")
    ) {
      return "0"; // Account doesn't exist or has no balance
    }
    logger.error(`Error getting balance for ${address}:`, error);
    return "0";
  }
}

/**
 * Sign a transaction
 * Returns the signed transaction data that can be submitted later
 */
export async function signTransaction(
  privateKey: string,
  payload: {
    function: string;
    typeArguments: string[];
    functionArguments: any[];
  },
  network?: NetworkType
): Promise<{ transaction: any; authenticator: any }> {
  try {
    const account = accountFromPrivateKey(privateKey);
    const aptosInstance = network ? getAptosInstance(network) : aptos;

    const transaction = await aptosInstance.transaction.build.simple({
      sender: account.accountAddress,
      data: {
        function: payload.function as `${string}::${string}::${string}`,
        typeArguments: payload.typeArguments,
        functionArguments: payload.functionArguments,
      },
    });

    const senderAuthenticator = aptos.transaction.sign({
      signer: account,
      transaction,
    });

    return {
      transaction,
      authenticator: senderAuthenticator,
    };
  } catch (error) {
    logger.error("Error signing transaction:", error);
    throw new Error(
      `Failed to sign transaction: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

/**
 * Submit a signed transaction
 * Accepts serialized signed transaction data
 */
export async function submitTransaction(
  signedTransactionData: string | { transaction: any; authenticator: any },
  network?: NetworkType
): Promise<{ hash: string; success: boolean }> {
  try {
    let transaction: any;
    let authenticator: any;
    const aptosInstance = network ? getAptosInstance(network) : aptos;

    if (typeof signedTransactionData === "string") {
      // Deserialize from base64
      const data = JSON.parse(
        Buffer.from(signedTransactionData, "base64").toString()
      );
      transaction = data.transaction;
      authenticator = data.authenticator;
    } else {
      transaction = signedTransactionData.transaction;
      authenticator = signedTransactionData.authenticator;
    }

    const pendingTxn = await aptosInstance.transaction.submit.simple({
      transaction,
      senderAuthenticator: authenticator,
    });

    await aptosInstance.waitForTransaction({
      transactionHash: pendingTxn.hash,
    });

    return {
      hash: pendingTxn.hash,
      success: true,
    };
  } catch (error) {
    logger.error("Error submitting transaction:", error);
    throw new Error(
      `Failed to submit transaction: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

/**
 * Transfer fungible asset using Aptos SDK's built-in transferFungibleAsset method
 * This is the recommended way per Aptos documentation
 */
export async function transferFungibleAsset(
  privateKey: string,
  metadataAddress: string,
  amount: string | number,
  recipientAddress: string,
  network?: NetworkType
): Promise<{ hash: string; success: boolean }> {
  const account = accountFromPrivateKey(privateKey);
  const aptosInstance = network ? getAptosInstance(network) : aptos;

  try {
    // Build transaction manually using primary_fungible_store::transfer
    // The SDK's transferFungibleAsset might not support fee payer, so we build it manually
    const recipientAddr = AccountAddress.fromString(recipientAddress);
    const metadataAddr = AccountAddress.fromString(metadataAddress);

    // Build transaction using the correct entry function
    // Function signature: transfer<T: key>(sender: &signer, metadata: Object<T>, recipient: address, amount: u64)
    // For fungible assets, the type T is the metadata struct type: 0x1::fungible_asset::Metadata
    // The metadata address is passed as Object<T> in function arguments
    // But the type argument T should be the struct type, not the address
    const metadataType = "0x1::fungible_asset::Metadata"; // Use the standard metadata struct type

    const transaction = await aptosInstance.transaction.build.simple({
      sender: account.accountAddress,
      data: {
        function: "0x1::primary_fungible_store::transfer",
        typeArguments: [metadataType], // Use standard metadata struct type
        functionArguments: [metadataAddr, recipientAddr, BigInt(amount)], // metadata Object, recipient, amount
      },
    });

    const senderAuthenticator = aptosInstance.transaction.sign({
      signer: account,
      transaction,
    });

    const pendingTxn = await aptosInstance.transaction.submit.simple({
      transaction,
      senderAuthenticator,
    });

    await aptosInstance.waitForTransaction({
      transactionHash: pendingTxn.hash,
    });

    return {
      hash: pendingTxn.hash,
      success: true,
    };
  } catch (error) {
    logger.error("Error in transferFungibleAsset:", error);
    throw new Error(
      `Fungible asset transfer failed: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

/**
 * Sign and submit a transaction in one call
 * Automatically detects fungible assets and uses appropriate transfer method
 */
export async function signAndSubmitTransaction(
  privateKey: string,
  payload: {
    function: string;
    typeArguments: string[];
    functionArguments: any[];
  },
  network?: NetworkType
): Promise<{ hash: string; success: boolean }> {
  const account = accountFromPrivateKey(privateKey);
  const aptosInstance = network ? getAptosInstance(network) : aptos;

  try {
    // Check if this is a fungible asset transfer attempt
    // If function is coin::transfer but typeArgument is an address-only fungible asset
    if (
      payload.function === "0x1::coin::transfer" &&
      payload.typeArguments.length === 1 &&
      isFungibleAsset(payload.typeArguments[0])
    ) {
      // This is a fungible asset, use the correct transfer function
      logger.info(
        `Detected fungible asset transfer, using primary_fungible_store::transfer instead of coin::transfer`
      );
      const metadataAddress = payload.typeArguments[0];
      // Function arguments for coin::transfer are [to, amount]
      // But primary_fungible_store::transfer expects [amount, to]
      const [to, amount] = payload.functionArguments;
      return await transferFungibleAsset(
        privateKey,
        metadataAddress,
        amount,
        to,
        network
      );
    }

    const transaction = await aptosInstance.transaction.build.simple({
      sender: account.accountAddress,
      data: {
        function: payload.function as `${string}::${string}::${string}`,
        typeArguments: payload.typeArguments,
        functionArguments: payload.functionArguments,
      },
    });

    const senderAuthenticator = aptosInstance.transaction.sign({
      signer: account,
      transaction,
    });

    const pendingTxn = await aptosInstance.transaction.submit.simple({
      transaction,
      senderAuthenticator,
    });

    await aptosInstance.waitForTransaction({
      transactionHash: pendingTxn.hash,
    });

    return {
      hash: pendingTxn.hash,
      success: true,
    };
  } catch (error) {
    logger.error("Error in signAndSubmitTransaction:", error);
    throw new Error(
      `Transaction failed: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

/**
 * Check if a token type is a fungible asset (address-only identifier)
 */
export function isFungibleAsset(tokenType: string): boolean {
  // Fungible assets use address-only identifiers (64 hex chars, no :: separators)
  // Coins use full type paths like "0x1::aptos_coin::AptosCoin"
  return (
    !tokenType.includes("::") &&
    tokenType.length >= 32 &&
    /^0x[0-9a-fA-F]+$/.test(tokenType)
  );
}

/**
 * Convert fungible asset address to proper type argument for transfer
 * For fungible assets, we need to use the metadata address as a type parameter
 */
export function getFungibleAssetTypeArg(metadataAddress: string): string {
  // The metadata address IS the type identifier for fungible assets
  // But we need to construct it as a proper type: address::fungible_asset::Metadata
  // However, the SDK might accept just the address - we'll try both approaches
  return metadataAddress;
}

/**
 * Transfer fungible asset with paymaster sponsorship
 * Uses Aptos SDK's transferFungibleAsset and wraps it with fee payer support
 */
export async function transferFungibleAssetSponsored(
  senderPrivateKey: string,
  paymasterPrivateKey: string,
  metadataAddress: string,
  amount: string | number,
  recipientAddress: string,
  network?: NetworkType
): Promise<{ hash: string; success: boolean; gasCostApt?: number }> {
  const senderAccount = accountFromPrivateKey(senderPrivateKey);
  const paymasterAccount = accountFromPrivateKey(paymasterPrivateKey);
  const aptosInstance = network ? getAptosInstance(network) : aptos;

  try {
    // Use Aptos SDK's transferFungibleAsset to build the transaction
    // Then modify it to add fee payer support
    const recipientAddr = AccountAddress.fromString(recipientAddress);
    const metadataAddr = AccountAddress.fromString(metadataAddress);

    // Build the transaction using SDK's method
    const transaction = await aptosInstance.transaction.build.simple({
      sender: senderAccount.accountAddress,
      data: {
        function: "0x1::primary_fungible_store::transfer",
        typeArguments: ["0x1::fungible_asset::Metadata"], // Use standard metadata struct type
        functionArguments: [metadataAddr, recipientAddr, BigInt(amount)], // metadata Object, recipient, amount
      },
      withFeePayer: true, // Enable fee payer
    });

    // Set fee payer address
    transaction.feePayerAddress = paymasterAccount.accountAddress;

    // Sign with sender
    const senderAuthenticator = aptosInstance.transaction.sign({
      signer: senderAccount,
      transaction,
    });

    // Sign with paymaster (fee payer)
    const feePayerAuthenticator = aptosInstance.transaction.signAsFeePayer({
      signer: paymasterAccount,
      transaction,
    });

    // Submit sponsored transaction
    const pendingTxn = await aptosInstance.transaction.submit.simple({
      transaction,
      senderAuthenticator,
      feePayerAuthenticator,
    });

    await aptosInstance.waitForTransaction({
      transactionHash: pendingTxn.hash,
    });

    // Extract gas cost
    const txDetails = await aptosInstance.getTransactionByHash({
      transactionHash: pendingTxn.hash,
    });

    let gasCostApt = 0;
    if (txDetails && "gas_used" in txDetails && "gas_unit_price" in txDetails) {
      const gasUsed = BigInt((txDetails as any).gas_used || 0);
      const gasUnitPrice = BigInt((txDetails as any).gas_unit_price || 0);
      const gasCostOctas = gasUsed * gasUnitPrice;
      gasCostApt = Number(gasCostOctas) / 100_000_000;
    }

    return {
      hash: pendingTxn.hash,
      success: true,
      gasCostApt: gasCostApt > 0 ? gasCostApt : undefined,
    };
  } catch (error) {
    logger.error("Error in transferFungibleAssetSponsored:", error);
    throw new Error(
      `Sponsored fungible asset transfer failed: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

/**
 * Sign and submit a sponsored transaction (paymaster pays fees)
 * This enables gasless transactions for users
 * Supports both coin transfers and fungible asset transfers
 */
export async function signAndSubmitSponsoredTransaction(
  senderPrivateKey: string,
  paymasterPrivateKey: string,
  payload: {
    function: string;
    typeArguments: string[];
    functionArguments: any[];
  },
  network?: NetworkType
): Promise<{ hash: string; success: boolean; gasCostApt?: number }> {
  const senderAccount = accountFromPrivateKey(senderPrivateKey);
  const paymasterAccount = accountFromPrivateKey(paymasterPrivateKey);
  const aptosInstance = network ? getAptosInstance(network) : aptos;

  try {
    // Check if this is a fungible asset transfer attempt
    // If function is coin::transfer but typeArgument is an address-only fungible asset
    if (
      payload.function === "0x1::coin::transfer" &&
      payload.typeArguments.length === 1 &&
      isFungibleAsset(payload.typeArguments[0])
    ) {
      // This is a fungible asset, use the correct transfer function with paymaster
      logger.info(
        `Detected fungible asset transfer with paymaster, using primary_fungible_store::transfer`
      );
      const metadataAddress = payload.typeArguments[0];
      // Function arguments for coin::transfer are [to, amount]
      // But primary_fungible_store::transfer expects [amount, to]
      const [to, amount] = payload.functionArguments;
      return await transferFungibleAssetSponsored(
        senderPrivateKey,
        paymasterPrivateKey,
        metadataAddress,
        amount,
        to,
        network
      );
    }

    // Build transaction with fee payer
    const transaction = await aptosInstance.transaction.build.simple({
      sender: senderAccount.accountAddress,
      data: {
        function: payload.function as `${string}::${string}::${string}`,
        typeArguments: payload.typeArguments,
        functionArguments: payload.functionArguments,
      },
      withFeePayer: true, // Enable fee payer
    });

    // Set fee payer address
    transaction.feePayerAddress = paymasterAccount.accountAddress;

    // Sign with sender
    const senderAuthenticator = aptosInstance.transaction.sign({
      signer: senderAccount,
      transaction,
    });

    // Sign with paymaster (fee payer)
    const feePayerAuthenticator = aptosInstance.transaction.signAsFeePayer({
      signer: paymasterAccount,
      transaction,
    });

    // Submit sponsored transaction
    const pendingTxn = await aptosInstance.transaction.submit.simple({
      transaction,
      senderAuthenticator,
      feePayerAuthenticator,
    });

    await aptosInstance.waitForTransaction({
      transactionHash: pendingTxn.hash,
    });

    // Get actual gas cost from transaction
    const txDetails = await aptosInstance.getTransactionByHash({
      transactionHash: pendingTxn.hash,
    });

    let gasCostApt = 0;

    // Extract gas cost from transaction details
    // Transaction response can have different structures depending on type
    if (txDetails) {
      // Check if it's a user transaction with gas information
      if ("gas_used" in txDetails && "gas_unit_price" in txDetails) {
        const gasUsed = BigInt((txDetails as any).gas_used || 0);
        const gasUnitPrice = BigInt((txDetails as any).gas_unit_price || 0);
        const gasCostOctas = gasUsed * gasUnitPrice;
        gasCostApt = Number(gasCostOctas) / 100_000_000; // Convert to APT
      }
      // Check nested structure (some transaction types have gas info nested)
      else if (
        "transaction" in txDetails &&
        typeof txDetails.transaction === "object"
      ) {
        const innerTx = (txDetails as any).transaction;
        if (innerTx && "gas_used" in innerTx && "gas_unit_price" in innerTx) {
          const gasUsed = BigInt(innerTx.gas_used || 0);
          const gasUnitPrice = BigInt(innerTx.gas_unit_price || 0);
          const gasCostOctas = gasUsed * gasUnitPrice;
          gasCostApt = Number(gasCostOctas) / 100_000_000;
        }
      }
      // Check for fee information directly
      else if ("gas_fee" in txDetails) {
        const gasFee = (txDetails as any).gas_fee;
        if (typeof gasFee === "string") {
          gasCostApt = parseFloat(gasFee) / 100_000_000;
        } else if (typeof gasFee === "number") {
          gasCostApt = gasFee / 100_000_000;
        }
      }
    }

    // If we couldn't extract gas cost, log a warning but don't fail
    // The estimated cost will be used for tracking
    if (gasCostApt === 0) {
      logger.warn(
        `Could not extract gas cost from transaction ${pendingTxn.hash}, using estimated cost`
      );
    }

    return {
      hash: pendingTxn.hash,
      success: true,
      gasCostApt: gasCostApt > 0 ? gasCostApt : undefined, // Return undefined if extraction failed
    };
  } catch (error) {
    logger.error("Error in signAndSubmitSponsoredTransaction:", error);
    throw new Error(
      `Sponsored transaction failed: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

/**
 * Get transaction details
 */
export async function getTransaction(
  hash: string,
  network?: NetworkType
): Promise<any> {
  try {
    const aptosInstance = network ? getAptosInstance(network) : aptos;
    return await aptosInstance.getTransactionByHash({ transactionHash: hash });
  } catch (error) {
    logger.error(`Error getting transaction ${hash}:`, error);
    throw error;
  }
}
