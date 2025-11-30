import { Aptos, Account } from "@aptos-labs/ts-sdk";
import { getAptosClient, TOKEN_MODULE_ADDRESS, TOKEN_MODULE_NAME } from "./blockchain";

/**
 * Mint tokens to a user address (requires owner private key)
 */
export async function mintTokensToUser(
  userAddress: string,
  amount: number, // Amount in tokens (will be converted to raw amount)
  ownerPrivateKey: string
): Promise<{ success: boolean; transactionHash?: string; error?: string }> {
  try {
    const aptos = getAptosClient();
    
    // Get token decimals
    const decimals = await getTokenDecimals(aptos);
    const divisor = BigInt(10 ** decimals);
    const amountU64 = BigInt(Math.floor(amount * Number(divisor)));

    // Create account from private key
    const ownerAccount = Account.fromPrivateKey({ privateKey: ownerPrivateKey });

    // Build mint transaction
    const transaction = await aptos.transaction.build.simple({
      sender: ownerAccount.accountAddress.toString(),
      data: {
        function: `${TOKEN_MODULE_ADDRESS}::${TOKEN_MODULE_NAME}::mint`,
        functionArguments: [userAddress, amountU64],
      },
    });

    // Sign and submit transaction
    const pendingTransaction = await aptos.signAndSubmitTransaction({
      signer: ownerAccount,
      transaction,
    });

    // Wait for transaction
    const executedTransaction = await aptos.waitForTransaction({
      transactionHash: pendingTransaction.hash,
    });

    if (executedTransaction.success === false) {
      return {
        success: false,
        error: "Transaction failed",
      };
    }

    return {
      success: true,
      transactionHash: pendingTransaction.hash,
    };
  } catch (error) {
    console.error("Mint tokens error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Transfer tokens from treasury to user (requires treasury private key)
 */
export async function transferTokensFromTreasury(
  userAddress: string,
  amount: number, // Amount in tokens (will be converted to raw amount)
  treasuryPrivateKey: string
): Promise<{ success: boolean; transactionHash?: string; error?: string }> {
  try {
    const aptos = getAptosClient();
    
    // Get token decimals
    const decimals = await getTokenDecimals(aptos);
    const divisor = BigInt(10 ** decimals);
    const amountU64 = BigInt(Math.floor(amount * Number(divisor)));

    // Create treasury account from private key
    const treasuryAccount = Account.fromPrivateKey({ privateKey: treasuryPrivateKey });

    // Build transfer transaction
    const transaction = await aptos.transaction.build.simple({
      sender: treasuryAccount.accountAddress.toString(),
      data: {
        function: `${TOKEN_MODULE_ADDRESS}::${TOKEN_MODULE_NAME}::transfer`,
        functionArguments: [userAddress, amountU64],
      },
    });

    // Sign and submit transaction
    const pendingTransaction = await aptos.signAndSubmitTransaction({
      signer: treasuryAccount,
      transaction,
    });

    // Wait for transaction
    const executedTransaction = await aptos.waitForTransaction({
      transactionHash: pendingTransaction.hash,
    });

    if (executedTransaction.success === false) {
      return {
        success: false,
        error: "Transaction failed",
      };
    }

    return {
      success: true,
      transactionHash: pendingTransaction.hash,
    };
  } catch (error) {
    console.error("Transfer tokens error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Get token decimals
 */
async function getTokenDecimals(aptos: Aptos): Promise<number> {
  try {
    const metadata = await aptos.view({
      function: `${TOKEN_MODULE_ADDRESS}::${TOKEN_MODULE_NAME}::get_metadata`,
      functionArguments: [],
    });
    return Number(metadata[2]) || 8; // Default to 8 if not available
  } catch (error) {
    return 8; // Default decimals
  }
}

/**
 * Distribute welcome tokens to a user
 * Tries minting first (if owner key is available), otherwise transfers from treasury
 */
export async function distributeWelcomeTokens(
  userAddress: string,
  amount: number = 10
): Promise<{ success: boolean; transactionHash?: string; error?: string; method?: "mint" | "transfer" }> {
  const ownerPrivateKey = process.env.TOKEN_OWNER_PRIVATE_KEY;
  const treasuryPrivateKey = process.env.TREASURY_PRIVATE_KEY;

  // Try minting first if owner key is available
  if (ownerPrivateKey) {
    const result = await mintTokensToUser(userAddress, amount, ownerPrivateKey);
    if (result.success) {
      return { ...result, method: "mint" };
    }
    // If minting fails, try transfer
  }

  // Try transferring from treasury if treasury key is available
  if (treasuryPrivateKey) {
    const result = await transferTokensFromTreasury(userAddress, amount, treasuryPrivateKey);
    if (result.success) {
      return { ...result, method: "transfer" };
    }
  }

  return {
    success: false,
    error: "No valid private key configured. Set TOKEN_OWNER_PRIVATE_KEY or TREASURY_PRIVATE_KEY in .env",
  };
}


