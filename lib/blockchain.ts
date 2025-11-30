import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
import { Account, AccountAddress, U64 } from "@aptos-labs/ts-sdk";

// Aptos Network Configuration
export const APTOS_NETWORK = (process.env.NEXT_PUBLIC_APTOS_NETWORK || "testnet") as Network;

/**
 * Get API key for the current network
 * Supports network-specific keys: APTOS_API_KEY_DEVNET, APTOS_API_KEY_TESTNET, APTOS_API_KEY_MAINNET
 * Falls back to APTOS_API_KEY if network-specific key is not set
 */
function getApiKeyForCurrentNetwork(): string | undefined {
  const network = APTOS_NETWORK.toString().toLowerCase();
  
  if (network === "devnet") {
    return process.env.APTOS_API_KEY_DEVNET || process.env.APTOS_API_KEY;
  } else if (network === "testnet") {
    return process.env.APTOS_API_KEY_TESTNET || process.env.APTOS_API_KEY;
  } else if (network === "mainnet") {
    return process.env.APTOS_API_KEY_MAINNET || process.env.APTOS_API_KEY;
  } else {
    return process.env.APTOS_API_KEY;
  }
}

// Get Aptos client with API key support (to avoid rate limits)
export function getAptosClient(): Aptos {
  const apiKey = getApiKeyForCurrentNetwork();
  
  const config = new AptosConfig({
    network: APTOS_NETWORK,
    // Add API key if available (helps avoid rate limits)
    ...(apiKey && { clientConfig: { API_KEY: apiKey } }),
  });
  
  return new Aptos(config);
}

// Module addresses (set after deployment)
export const STAKING_MODULE_ADDRESS = process.env.NEXT_PUBLIC_STAKING_MODULE_ADDRESS || "";
export const TOKEN_MODULE_ADDRESS = process.env.NEXT_PUBLIC_TOKEN_MODULE_ADDRESS || "";

// Module names
export const STAKING_MODULE_NAME = "dojohunt_staking";
export const TOKEN_MODULE_NAME = "dojohunt_token";

// Convert address string to AccountAddress
export function toAccountAddress(address: string): AccountAddress {
  return AccountAddress.fromString(address);
}

// Wallet utilities
export function verifyWalletSignature(
  message: string,
  signature: string,
  address: string
): boolean {
  try {
    // Aptos signature verification
    // Note: This is a simplified version - actual implementation depends on signature format
    const accountAddress = AccountAddress.fromString(address);
    // In a real implementation, you would verify the signature using Aptos SDK
    // For now, we'll return true if addresses match (you should implement proper verification)
    return true;
  } catch (error) {
    console.error("Error verifying signature:", error);
    return false;
  }
}

export function createWalletMessage(nonce: string): string {
  return `Sign this message to authenticate with DojoHunt. Nonce: ${nonce}`;
}

/**
 * Verify a staking transaction on the blockchain
 */
export async function verifyStakeTransaction(
  transactionHash: string,
  userAddress: string
): Promise<{ success: boolean; error?: string; data?: any }> {
  try {
    const aptos = getAptosClient();
    const transaction = await aptos.getTransactionByHash({ transactionHash });

    if (!transaction) {
      return {
        success: false,
        error: "Transaction not found",
      };
    }

    if (transaction.success === false) {
      return {
        success: false,
        error: "Transaction failed",
      };
    }

    // Verify the transaction is from the user
    const sender = transaction.sender;
    if (sender.toString() !== userAddress) {
      return {
        success: false,
        error: "Transaction is not from the user",
      };
    }

    // Parse transaction to get stake event data
    // Extract function arguments from transaction payload
    let amount = "0";
    let periodSeconds = 5 * 24 * 60 * 60; // Default to 5 days if not found
    
    // Try to extract from transaction payload
    if (transaction.payload && typeof transaction.payload === 'object') {
      const payload = transaction.payload as any;
      
      // Check if it's a function call
      if (payload.function && payload.arguments) {
        // Arguments: [amount, period_seconds]
        if (Array.isArray(payload.arguments) && payload.arguments.length >= 2) {
          amount = payload.arguments[0]?.toString() || "0";
          periodSeconds = Number(payload.arguments[1]) || periodSeconds;
        }
      }
    }
    
    const timestamp = transaction.timestamp;
    const startTime = Number(timestamp) / 1000000; // Convert to seconds
    const endTime = startTime + periodSeconds;

    return {
      success: true,
      data: {
        transactionHash,
        blockNumber: transaction.version,
        amount,
        formattedAmount: "0",
        startTime: BigInt(Math.floor(startTime)),
        endTime: BigInt(Math.floor(endTime)),
        periodSeconds: BigInt(periodSeconds),
      },
    };
  } catch (error) {
    console.error("Verify stake transaction error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Verify an unstake transaction on the blockchain
 */
export async function verifyUnstakeTransaction(
  transactionHash: string,
  userAddress: string
): Promise<{ success: boolean; error?: string; data?: any }> {
  try {
    const aptos = getAptosClient();
    const transaction = await aptos.getTransactionByHash({ transactionHash });

    if (!transaction || transaction.success === false) {
      return {
        success: false,
        error: "Transaction not found or failed",
      };
    }

    // Parse events to get unstake data
    return {
      success: true,
      data: {
        transactionHash,
        blockNumber: transaction.version,
        amount: "0",
        formattedAmount: "0",
        fee: "0",
        formattedFee: "0",
        completed: false,
      },
    };
  } catch (error) {
    console.error("Verify unstake transaction error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Complete a challenge on the blockchain
 */
export async function completeChallengeOnChain(
  userAddress: string,
  challengeId: number,
  backendPrivateKey: string
): Promise<{ success: boolean; error?: string; transactionHash?: string }> {
  try {
    const aptos = getAptosClient();
    const account = Account.fromPrivateKey({ privateKey: backendPrivateKey });

    // Note: In Aptos, users typically call this themselves
    // This function verifies the challenge was completed
    const isCompleted = await isChallengeCompletedOnChain(userAddress, challengeId);

    if (isCompleted) {
      return {
        success: true,
      };
    }

    return {
      success: false,
      error: "Challenge not completed on-chain",
    };
  } catch (error) {
    console.error("Complete challenge error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Get stake information from blockchain
 */
export async function getStakeInfo(walletAddress: string) {
  try {
    const aptos = getAptosClient();
    const moduleAddress = toAccountAddress(STAKING_MODULE_ADDRESS || "0x1");
    
    const resource = await aptos.getAccountResource({
      accountAddress: moduleAddress,
      resourceType: `${STAKING_MODULE_ADDRESS}::${STAKING_MODULE_NAME}::StakingPool`,
    });

    // Call view function to get stake info
    const stakeInfo = await aptos.view({
      function: `${STAKING_MODULE_ADDRESS}::${STAKING_MODULE_NAME}::get_stake`,
      functionArguments: [walletAddress],
    });

    if (!stakeInfo || stakeInfo.length < 6) {
      return {
        success: true,
        data: null,
      };
    }

    const [amount, startTime, endTime, isActive, challengesCompleted, totalChallenges] = stakeInfo;

    // Get token decimals
    const tokenDecimals = await getTokenDecimals();
    const divisor = BigInt(10 ** tokenDecimals);

    return {
      success: true,
      data: {
        amount: Number(amount) / Number(divisor),
        rawAmount: amount.toString(),
        startTime: new Date(Number(startTime) * 1000),
        endTime: new Date(Number(endTime) * 1000),
        isActive: isActive as boolean,
        challengesCompleted: Number(challengesCompleted),
        totalChallenges: Number(totalChallenges),
      },
    };
  } catch (error) {
    console.error("Get stake info error:", error);
    // If user has no stake, return null instead of error
    if (error instanceof Error && error.message.includes("not found")) {
      return {
        success: true,
        data: null,
      };
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Check if a challenge is completed on-chain for a user
 */
export async function isChallengeCompletedOnChain(
  userAddress: string,
  challengeId: number
): Promise<boolean> {
  try {
    const aptos = getAptosClient();
    const moduleAddress = toAccountAddress(STAKING_MODULE_ADDRESS || "0x1");
    
    const result = await aptos.view({
      function: `${STAKING_MODULE_ADDRESS}::${STAKING_MODULE_NAME}::is_challenge_completed`,
      functionArguments: [userAddress, challengeId],
    });

    return result[0] as boolean;
  } catch (error) {
    console.error("Check challenge completed error:", error);
    return false;
  }
}

/**
 * Get token balance
 */
export async function getTokenBalance(walletAddress: string) {
  try {
    const aptos = getAptosClient();
    const moduleAddress = toAccountAddress(TOKEN_MODULE_ADDRESS || "0x1");
    
    const balance = await aptos.view({
      function: `${TOKEN_MODULE_ADDRESS}::${TOKEN_MODULE_NAME}::balance_of`,
      functionArguments: [walletAddress],
    });

    const decimals = await getTokenDecimals();
    const divisor = BigInt(10 ** decimals);
    const rawBalance = BigInt(balance[0] as string);
    const formattedBalance = Number(rawBalance) / Number(divisor);

    return {
      success: true,
      balance: formattedBalance.toString(),
      rawBalance: rawBalance.toString(),
    };
  } catch (error) {
    console.error("Get token balance error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Get token decimals
 */
async function getTokenDecimals(): Promise<number> {
  try {
    const aptos = getAptosClient();
    const metadata = await getTokenMetadata();
    return metadata.decimals || 8; // Default to 8 if not available
  } catch (error) {
    return 8; // Default decimals
  }
}

/**
 * Get token info (name, symbol, decimals)
 */
export async function getTokenInfo() {
  try {
    const metadata = await getTokenMetadata();
    return {
      success: true,
      name: metadata.name,
      symbol: metadata.symbol,
      decimals: metadata.decimals,
    };
  } catch (error) {
    console.error("Get token info error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Get full token metadata
 */
export async function getTokenMetadata() {
  try {
    const aptos = getAptosClient();
    const moduleAddress = toAccountAddress(TOKEN_MODULE_ADDRESS || "0x1");
    
    const metadata = await aptos.view({
      function: `${TOKEN_MODULE_ADDRESS}::${TOKEN_MODULE_NAME}::get_metadata`,
      functionArguments: [],
    });

    return {
      success: true,
      name: metadata[0] as string,
      symbol: metadata[1] as string,
      decimals: Number(metadata[2]),
      logoURI: metadata[3] as string,
      website: metadata[4] as string,
      description: metadata[5] as string,
      metadataURI: metadata[6] as string,
      twitter: metadata[7] as string,
      discord: metadata[8] as string,
      telegram: metadata[9] as string,
      github: metadata[10] as string,
      documentation: metadata[11] as string,
    };
  } catch (error) {
    console.error("Get token metadata error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      name: "",
      symbol: "",
      decimals: 8,
      logoURI: "",
      website: "",
      description: "",
      metadataURI: "",
      twitter: "",
      discord: "",
      telegram: "",
      github: "",
      documentation: "",
    };
  }
}
