import { AccountAddress, Aptos, U64 } from "@aptos-labs/ts-sdk";
import {
  getAptosClient,
  STAKING_MODULE_ADDRESS,
  STAKING_MODULE_NAME,
  toAccountAddress,
  TOKEN_MODULE_ADDRESS,
  TOKEN_MODULE_NAME,
} from "./blockchain";

/**
 * Get the staking module address
 */
export function getStakingContractAddress(): string {
  const address = STAKING_MODULE_ADDRESS;
  if (!address) {
    throw new Error(
      "Staking module address not configured. Set NEXT_PUBLIC_STAKING_MODULE_ADDRESS in .env"
    );
  }
  return address;
}

/**
 * Get the token module address
 */
export function getTokenContractAddress(): string {
  const address = TOKEN_MODULE_ADDRESS;
  if (!address) {
    throw new Error(
      "Token module address not configured. Set NEXT_PUBLIC_TOKEN_MODULE_ADDRESS in .env"
    );
  }
  return address;
}

/**
 * Get token info (name, symbol, decimals)
 */
export async function getTokenInfoClient(aptos: Aptos) {
  const moduleAddress = getTokenContractAddress();

  try {
    // Try to get metadata from on-chain resource first (more reliable)
    try {
      const accountAddress = AccountAddress.fromString(moduleAddress);
      const metadataResource = await aptos.getAccountResource({
        accountAddress,
        resourceType: `${moduleAddress}::${TOKEN_MODULE_NAME}::TokenMetadata`,
      });

      if (metadataResource && metadataResource.data) {
        const metadata = metadataResource.data as any;
        return {
          name: metadata.name || "TSKULL",
          symbol: metadata.symbol || "TSKULL",
          decimals: Number(metadata.decimals) || 8,
        };
      }
    } catch (resourceError: any) {
      // Resource not found is expected - silently continue to view function
      // Only log if it's not a "not found" error
      if (
        resourceError?.error_code !== "resource_not_found" &&
        !resourceError?.message?.includes("not found")
      ) {
        console.log(
          "Could not get metadata from resource, trying view function:",
          resourceError?.message || resourceError
        );
      }
    }

    // Fallback to view function
    let metadata;
    try {
      metadata = await aptos.view({
        function: `${moduleAddress}::${TOKEN_MODULE_NAME}::get_metadata`,
        functionArguments: [],
      });

      // Check if metadata exists and is valid
      if (
        metadata !== undefined &&
        metadata !== null &&
        Array.isArray(metadata) &&
        metadata.length >= 3
      ) {
        // Safely extract values
        const name = metadata[0];
        const symbol = metadata[1];
        const decimals = metadata[2];

        return {
          name:
            (typeof name === "string" ? name : String(name || "TSKULL")) ||
            "TSKULL",
          symbol:
            (typeof symbol === "string"
              ? symbol
              : String(symbol || "TSKULL")) || "TSKULL",
          decimals: Number(decimals) || 8,
        };
      }
    } catch (viewError: any) {
      // If view function fails, silently continue to defaults
      // Don't log expected errors (function doesn't exist, etc.)
      const errorCode = viewError?.error_code;
      const errorMessage = viewError?.message || String(viewError || "");

      // Only log unexpected errors
      if (
        errorCode !== "resource_not_found" &&
        !errorMessage.includes("not found") &&
        !errorMessage.includes("split")
      ) {
        console.log("View function failed, using defaults:", errorMessage);
      }
      // Don't throw - fall through to return defaults
    }

    // Return default values if all methods fail
    return {
      name: "TSKULL",
      symbol: "TSKULL",
      decimals: 8, // TSKULL uses 8 decimals as shown in explorer
    };
  } catch (error: any) {
    // Only log unexpected errors (not "not found" or parsing errors)
    const errorMessage = error?.message || String(error || "");
    if (
      !errorMessage.includes("not found") &&
      !errorMessage.includes("split") &&
      !errorMessage.includes("resource_not_found")
    ) {
      console.error("Error fetching token info, using defaults:", errorMessage);
    }
    // Return default values if metadata fetch fails
    return {
      name: "TSKULL",
      symbol: "TSKULL",
      decimals: 8, // TSKULL uses 8 decimals as shown in explorer
    };
  }
}

/**
 * Get full token metadata
 */
export async function getTokenMetadataClient(aptos: Aptos) {
  const moduleAddress = getTokenContractAddress();

  try {
    const metadata = await aptos.view({
      function: `${moduleAddress}::${TOKEN_MODULE_NAME}::get_metadata`,
      functionArguments: [],
    });

    return {
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
    // Fallback to basic info if getMetadata is not available
    const basicInfo = await getTokenInfoClient(aptos);
    return {
      ...basicInfo,
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

/**
 * Get balance from CoinStore data structure
 */
function getBalanceFromCoinStore(coinStore: any): string | null {
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
 * Get token balance for a user
 * Uses GraphQL indexer from balance.ts (works for fungible assets)
 */
export async function getTokenBalanceClient(aptos: Aptos, userAddress: string) {
  const moduleAddress = getTokenContractAddress();

  try {
    // Import the balance function dynamically to avoid circular dependencies
    const { getComprehensiveBalance } = await import("./balance");

    // Get network from environment
    const network = (process.env.NEXT_PUBLIC_APTOS_NETWORK || "testnet") as
      | "testnet"
      | "mainnet"
      | "devnet";

    // Get comprehensive balance which includes fungible assets via GraphQL
    const walletBalance = await getComprehensiveBalance(userAddress, network);

    // Find TSKULL token in the tokens array
    // The token address is the fungible asset address
    const tskullToken = walletBalance.tokens.find(
      (token) =>
        token.tokenType === moduleAddress ||
        token.tokenType.includes(moduleAddress) ||
        token.symbol === "TSKULL"
    );

    if (tskullToken) {
      return {
        balance: tskullToken.formattedAmount || "0",
        rawBalance: tskullToken.amount || "0",
      };
    }

    // If not found in tokens, balance is 0
    return {
      balance: "0",
      rawBalance: "0",
    };
  } catch (error) {
    console.error("Error fetching token balance using balance.ts:", error);
    // Return 0 balance instead of throwing
    return {
      balance: "0",
      rawBalance: "0",
    };
  }
}

/**
 * Get token decimals
 */
async function getTokenDecimalsClient(aptos: Aptos): Promise<number> {
  try {
    const info = await getTokenInfoClient(aptos);
    return info.decimals;
  } catch (error) {
    return 8; // Default decimals (TSKULL uses 8 decimals as shown in explorer)
  }
}

/**
 * Build stake transaction (client-side)
 * Returns transaction payload that can be signed by wallet
 */
export async function buildStakeTransaction(
  senderAddress: string,
  amount: string,
  periodDays: number
): Promise<{ transaction: any; amountU64: bigint; periodSeconds: bigint }> {
  const aptos = getAptosClient();
  const moduleAddress = getStakingContractAddress();

  // Validate inputs
  if (!senderAddress) {
    throw new Error("Sender address is required");
  }
  if (!amount || Number.parseFloat(amount) <= 0) {
    throw new Error("Amount must be greater than 0");
  }
  if (periodDays < 1 || periodDays > 90) {
    throw new Error("Staking period must be between 1 and 90 days");
  }

  // Get token decimals (with fallback)
  const decimals = await getTokenDecimalsClient(aptos);

  // Convert amount string to raw amount with proper decimal handling
  // This avoids floating point precision issues
  const amountStr = amount.trim();
  const decimalIndex = amountStr.indexOf(".");

  let amountU64: bigint;
  if (decimalIndex === -1) {
    // No decimal point - whole number
    amountU64 = BigInt(amountStr) * BigInt(10 ** decimals);
  } else {
    // Has decimal point - split and handle precisely
    const wholePart = amountStr.substring(0, decimalIndex) || "0";
    const fractionalPart = amountStr.substring(decimalIndex + 1);
    const fractionalPadded = fractionalPart
      .padEnd(decimals, "0")
      .substring(0, decimals);
    amountU64 =
      BigInt(wholePart) * BigInt(10 ** decimals) + BigInt(fractionalPadded);
  }

  // Convert days to seconds (1 day = 86400 seconds)
  const periodSeconds = BigInt(periodDays * 86400);

  // Retry logic for rate limit errors
  const maxRetries = 3;
  let lastError: any = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      // Convert sender address string to AccountAddress
      const senderAccountAddress = AccountAddress.fromString(senderAddress);

      if (attempt === 0) {
        console.log("Building stake transaction with params:", {
          sender: senderAddress,
          senderAccountAddress: senderAccountAddress.toString(),
          moduleAddress,
          function: `${moduleAddress}::${STAKING_MODULE_NAME}::stake`,
          amountU64: amountU64.toString(),
          periodSeconds: periodSeconds.toString(),
        });
      } else {
        console.log(
          `Retrying transaction build (attempt ${attempt + 1}/${maxRetries})...`
        );
        // Wait before retrying (exponential backoff)
        await new Promise((resolve) =>
          setTimeout(resolve, 1000 * (attempt + 1))
        );
      }

      const transaction = await aptos.transaction.build.simple({
        sender: senderAccountAddress,
        data: {
          function: `${moduleAddress}::${STAKING_MODULE_NAME}::stake`,
          functionArguments: [amountU64, periodSeconds],
        },
      });

      console.log("Transaction build result:", {
        hasTransaction: !!transaction,
        transactionType: typeof transaction,
        isObject: typeof transaction === "object",
        isNull: transaction === null,
        keys: transaction ? Object.keys(transaction) : [],
        constructor: transaction?.constructor?.name,
      });

      if (!transaction) {
        throw new Error(
          "Failed to build transaction - transaction is undefined"
        );
      }

      // Validate transaction has required properties
      if (typeof transaction !== "object" || transaction === null) {
        throw new Error(
          "Failed to build transaction - invalid transaction object"
        );
      }

      return { transaction, amountU64, periodSeconds };
    } catch (error: any) {
      lastError = error;
      const errorMessage = error?.message || String(error || "");

      // Check if it's a rate limit error
      const isRateLimit =
        errorMessage.includes("Per anonym") ||
        errorMessage.includes("rate limit") ||
        errorMessage.includes("429") ||
        errorMessage.includes("Unexpected token 'P'");

      if (isRateLimit && attempt < maxRetries - 1) {
        console.warn(
          `Rate limit hit, will retry (attempt ${attempt + 1}/${maxRetries})`
        );
        continue; // Retry
      }

      // If it's not a rate limit or we've exhausted retries, throw
      console.error("Error building stake transaction:", errorMessage, error);
      throw new Error(`Failed to build transaction: ${errorMessage}`);
    }
  }

  // If we get here, all retries failed
  const errorMessage = lastError?.message || String(lastError || "");
  throw new Error(
    `Failed to build transaction after ${maxRetries} attempts: ${errorMessage}`
  );
}

/**
 * Stake tokens (client-side) - uses wallet adapter
 * The wallet adapter expects InputTransactionData format, not a built transaction
 */
export async function stakeTokensClient(
  signAndSubmitTransaction: (transaction: any) => Promise<{ hash: string }>,
  senderAddress: string,
  amount: string,
  periodDays: number
): Promise<{ hash: string; wait: () => Promise<any> }> {
  const aptos = getAptosClient();
  const moduleAddress = getStakingContractAddress();

  // Get token decimals (with fallback)
  const decimals = await getTokenDecimalsClient(aptos);

  // Convert amount string to raw amount with proper decimal handling
  // This avoids floating point precision issues
  const amountStr = amount.trim();
  const decimalIndex = amountStr.indexOf(".");

  let amountU64: bigint;
  if (decimalIndex === -1) {
    // No decimal point - whole number
    amountU64 = BigInt(amountStr) * BigInt(10 ** decimals);
  } else {
    // Has decimal point - split and handle precisely
    const wholePart = amountStr.substring(0, decimalIndex) || "0";
    const fractionalPart = amountStr.substring(decimalIndex + 1);
    const fractionalPadded = fractionalPart
      .padEnd(decimals, "0")
      .substring(0, decimals);
    amountU64 =
      BigInt(wholePart) * BigInt(10 ** decimals) + BigInt(fractionalPadded);
  }

  // Convert days to seconds (1 day = 86400 seconds)
  const periodSeconds = BigInt(periodDays * 86400);

  // The wallet adapter expects InputTransactionData format:
  // { data: { function: string, functionArguments: any[], typeArguments?: string[] } }
  // The wallet adapter will build the transaction itself
  // Convert BigInt to string for wallet adapter compatibility
  const transactionData = {
    data: {
      function: `${moduleAddress}::${STAKING_MODULE_NAME}::stake`,
      functionArguments: [amountU64.toString(), periodSeconds.toString()],
    },
  };

  try {
    // Verify the conversion is correct
    const verificationAmount = Number(amountU64) / 10 ** decimals;
    const expectedAmount = Number.parseFloat(amount);

    console.log("Submitting transaction to wallet adapter:", {
      function: transactionData.data.function,
      inputAmount: amount,
      inputAmountType: typeof amount,
      decimals: decimals,
      amountU64: amountU64.toString(),
      amountU64Number: Number(amountU64),
      periodSeconds: periodSeconds.toString(),
      // Verify conversion: amountU64 / 10^decimals should equal input amount
      verification: `${verificationAmount} tokens`,
      expected: `${expectedAmount} tokens`,
      match: verificationAmount === expectedAmount,
    });

    // Double-check: if verification doesn't match, log warning
    if (Math.abs(verificationAmount - expectedAmount) > 0.000001) {
      console.error("⚠️ DECIMAL CONVERSION MISMATCH!", {
        input: amount,
        expected: expectedAmount,
        calculated: verificationAmount,
        rawAmount: amountU64.toString(),
        decimals,
      });
    }

    // Pass InputTransactionData to wallet adapter (not a built transaction)
    // The wallet adapter will build and sign the transaction internally
    const pendingTransaction = await signAndSubmitTransaction(transactionData);

    if (!pendingTransaction) {
      throw new Error("Transaction submission returned undefined");
    }

    if (!pendingTransaction.hash) {
      throw new Error("Transaction submission failed - no hash returned");
    }

    console.log("Transaction submitted, hash:", pendingTransaction.hash);

    // Wait for transaction
    const executedTransaction = await aptos.waitForTransaction({
      transactionHash: pendingTransaction.hash,
    });

    return {
      hash: pendingTransaction.hash,
      wait: async () => executedTransaction,
    };
  } catch (error: any) {
    const errorMessage = error?.message || String(error || "");
    console.error("Error in stakeTokensClient:", errorMessage, error);

    // Re-throw with more context
    if (
      errorMessage.includes("rejected") ||
      errorMessage.includes("User rejected")
    ) {
      throw new Error("Transaction was rejected by user");
    } else if (errorMessage.includes("insufficient")) {
      throw new Error("Insufficient token balance");
    } else if (errorMessage.includes("Cannot use 'in' operator")) {
      throw new Error("Transaction format error - please try again");
    } else {
      throw new Error(`Staking failed: ${errorMessage}`);
    }
  }
}

/**
 * Build unstake transaction (client-side)
 */
export async function buildUnstakeTransaction(
  senderAddress: string
): Promise<any> {
  const aptos = getAptosClient();
  const moduleAddress = getStakingContractAddress();

  // Convert sender address string to AccountAddress
  const senderAccountAddress = AccountAddress.fromString(senderAddress);

  const transaction = await aptos.transaction.build.simple({
    sender: senderAccountAddress,
    data: {
      function: `${moduleAddress}::${STAKING_MODULE_NAME}::unstake`,
      functionArguments: [],
    },
  });

  return transaction;
}

/**
 * Unstake tokens (client-side) - uses wallet adapter
 * The wallet adapter expects InputTransactionData format, not a built transaction
 */
export async function unstakeTokensClient(
  signAndSubmitTransaction: (transaction: any) => Promise<{ hash: string }>,
  senderAddress: string
): Promise<{ hash: string; wait: () => Promise<any> }> {
  const aptos = getAptosClient();
  const moduleAddress = getStakingContractAddress();

  // The wallet adapter expects InputTransactionData format
  const transactionData = {
    data: {
      function: `${moduleAddress}::${STAKING_MODULE_NAME}::unstake`,
      functionArguments: [],
    },
  };

  const pendingTransaction = await signAndSubmitTransaction(transactionData);

  const executedTransaction = await aptos.waitForTransaction({
    transactionHash: pendingTransaction.hash,
  });

  return {
    hash: pendingTransaction.hash,
    wait: async () => executedTransaction,
  };
}

/**
 * Complete a challenge (client-side) - uses wallet adapter
 * The wallet adapter expects InputTransactionData format, not a built transaction
 */
export async function completeChallengeClient(
  signAndSubmitTransaction: (transaction: any) => Promise<{ hash: string }>,
  senderAddress: string,
  challengeId: number
): Promise<{ hash: string; wait: () => Promise<any> }> {
  const aptos = getAptosClient();
  const moduleAddress = getStakingContractAddress();

  // The wallet adapter expects InputTransactionData format
  const transactionData = {
    data: {
      function: `${moduleAddress}::${STAKING_MODULE_NAME}::complete_challenge`,
      functionArguments: [challengeId],
    },
  };

  const pendingTransaction = await signAndSubmitTransaction(transactionData);

  const executedTransaction = await aptos.waitForTransaction({
    transactionHash: pendingTransaction.hash,
  });

  return {
    hash: pendingTransaction.hash,
    wait: async () => executedTransaction,
  };
}

/**
 * Get stake info (client-side)
 */
export async function getStakeInfoClient(aptos: Aptos, userAddress: string) {
  try {
    const moduleAddress = getStakingContractAddress();

    if (!moduleAddress || !userAddress) {
      throw new Error("Module address or user address is missing");
    }

    const stakeInfo = await aptos.view({
      function: `${moduleAddress}::${STAKING_MODULE_NAME}::get_stake`,
      functionArguments: [userAddress],
    });

    if (!stakeInfo || stakeInfo.length < 6) {
      return {
        amount: "0",
        startTime: new Date(),
        endTime: new Date(),
        isActive: false,
        challengesCompleted: 0,
        totalChallenges: 5,
      };
    }

    const [
      amount,
      startTime,
      endTime,
      isActive,
      challengesCompleted,
      totalChallenges,
    ] = stakeInfo;

    const decimals = await getTokenDecimalsClient(aptos);
    const divisor = BigInt(10 ** decimals);
    const amountNum = Number(BigInt(amount as string)) / Number(divisor);

    return {
      amount: amountNum.toString(),
      startTime: new Date(Number(startTime) * 1000),
      endTime: new Date(Number(endTime) * 1000),
      isActive: isActive as boolean,
      challengesCompleted: Number(challengesCompleted),
      totalChallenges: Number(totalChallenges),
    };
  } catch (error) {
    console.error("Error getting stake info client:", error);
    // Return default inactive stake on error
    return {
      amount: "0",
      startTime: new Date(),
      endTime: new Date(),
      isActive: false,
      challengesCompleted: 0,
      totalChallenges: 5,
    };
  }
}

/**
 * Transfer tokens (client-side) - uses wallet adapter
 * The wallet adapter expects InputTransactionData format, not a built transaction
 */
export async function transferTokensClient(
  signAndSubmitTransaction: (transaction: any) => Promise<{ hash: string }>,
  senderAddress: string,
  to: string,
  amount: string
): Promise<{ hash: string; wait: () => Promise<any> }> {
  const aptos = getAptosClient();
  const moduleAddress = getTokenContractAddress();

  const decimals = await getTokenDecimalsClient(aptos);

  // Convert amount string to raw amount with proper decimal handling
  // This avoids floating point precision issues
  const amountStr = amount.trim();
  const decimalIndex = amountStr.indexOf(".");

  let amountU64: bigint;
  if (decimalIndex === -1) {
    // No decimal point - whole number
    amountU64 = BigInt(amountStr) * BigInt(10 ** decimals);
  } else {
    // Has decimal point - split and handle precisely
    const wholePart = amountStr.substring(0, decimalIndex) || "0";
    const fractionalPart = amountStr.substring(decimalIndex + 1);
    const fractionalPadded = fractionalPart
      .padEnd(decimals, "0")
      .substring(0, decimals);
    amountU64 =
      BigInt(wholePart) * BigInt(10 ** decimals) + BigInt(fractionalPadded);
  }

  // The wallet adapter expects InputTransactionData format
  // Convert BigInt to string and address to string for wallet adapter compatibility
  const transactionData = {
    data: {
      function: `${moduleAddress}::${TOKEN_MODULE_NAME}::transfer`,
      functionArguments: [to, amountU64.toString()],
    },
  };

  const pendingTransaction = await signAndSubmitTransaction(transactionData);

  const executedTransaction = await aptos.waitForTransaction({
    transactionHash: pendingTransaction.hash,
  });

  return {
    hash: pendingTransaction.hash,
    wait: async () => executedTransaction,
  };
}
