import { Aptos, AccountAddress, U64 } from "@aptos-labs/ts-sdk";
import { getAptosClient, STAKING_MODULE_ADDRESS, TOKEN_MODULE_ADDRESS, STAKING_MODULE_NAME, TOKEN_MODULE_NAME, toAccountAddress } from "./blockchain";

/**
 * Get the staking module address
 */
export function getStakingContractAddress(): string {
  const address = STAKING_MODULE_ADDRESS;
  if (!address) {
    throw new Error("Staking module address not configured. Set NEXT_PUBLIC_STAKING_MODULE_ADDRESS in .env");
  }
  return address;
}

/**
 * Get the token module address
 */
export function getTokenContractAddress(): string {
  const address = TOKEN_MODULE_ADDRESS;
  if (!address) {
    throw new Error("Token module address not configured. Set NEXT_PUBLIC_TOKEN_MODULE_ADDRESS in .env");
  }
  return address;
}

/**
 * Get token info (name, symbol, decimals)
 */
export async function getTokenInfoClient(aptos: Aptos) {
  const moduleAddress = getTokenContractAddress();
  
  const metadata = await aptos.view({
    function: `${moduleAddress}::${TOKEN_MODULE_NAME}::get_metadata`,
    functionArguments: [],
  });

  return {
    name: metadata[0] as string,
    symbol: metadata[1] as string,
    decimals: Number(metadata[2]),
  };
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
 * Get token balance for a user
 */
export async function getTokenBalanceClient(
  aptos: Aptos,
  userAddress: string
) {
  const moduleAddress = getTokenContractAddress();
  
  const balance = await aptos.view({
    function: `${moduleAddress}::${TOKEN_MODULE_NAME}::balance_of`,
    functionArguments: [userAddress],
  });

  const decimals = await getTokenDecimalsClient(aptos);
  const divisor = BigInt(10 ** decimals);
  const rawBalance = BigInt(balance[0] as string);
  const formattedBalance = Number(rawBalance) / Number(divisor);

  return {
    balance: formattedBalance.toString(),
    rawBalance: rawBalance.toString(),
  };
}

/**
 * Get token decimals
 */
async function getTokenDecimalsClient(aptos: Aptos): Promise<number> {
  try {
    const info = await getTokenInfoClient(aptos);
    return info.decimals;
  } catch (error) {
    return 8; // Default decimals
  }
}

/**
 * Build stake transaction (client-side)
 * Returns transaction payload that can be signed by wallet
 */
export async function buildStakeTransaction(
  senderAddress: string,
  amount: string
): Promise<{ transaction: any; amountU64: bigint }> {
  const aptos = getAptosClient();
  const moduleAddress = getStakingContractAddress();
  
  // Get token decimals
  const decimals = await getTokenDecimalsClient(aptos);
  const divisor = BigInt(10 ** decimals);
  const amountU64 = BigInt(Math.floor(Number.parseFloat(amount) * Number(divisor)));

  const transaction = await aptos.transaction.build.simple({
    sender: senderAddress,
    data: {
      function: `${moduleAddress}::${STAKING_MODULE_NAME}::stake`,
      functionArguments: [amountU64],
    },
  });

  return { transaction, amountU64 };
}

/**
 * Stake tokens (client-side) - uses wallet adapter
 */
export async function stakeTokensClient(
  signAndSubmitTransaction: (transaction: any) => Promise<{ hash: string }>,
  senderAddress: string,
  amount: string
): Promise<{ hash: string; wait: () => Promise<any> }> {
  const aptos = getAptosClient();
  const { transaction } = await buildStakeTransaction(senderAddress, amount);

  const pendingTransaction = await signAndSubmitTransaction(transaction);

  // Wait for transaction
  const executedTransaction = await aptos.waitForTransaction({
    transactionHash: pendingTransaction.hash,
  });

  return {
    hash: pendingTransaction.hash,
    wait: async () => executedTransaction,
  };
}

/**
 * Build unstake transaction (client-side)
 */
export async function buildUnstakeTransaction(
  senderAddress: string
): Promise<any> {
  const aptos = getAptosClient();
  const moduleAddress = getStakingContractAddress();

  const transaction = await aptos.transaction.build.simple({
    sender: senderAddress,
    data: {
      function: `${moduleAddress}::${STAKING_MODULE_NAME}::unstake`,
      functionArguments: [],
    },
  });

  return transaction;
}

/**
 * Unstake tokens (client-side) - uses wallet adapter
 */
export async function unstakeTokensClient(
  signAndSubmitTransaction: (transaction: any) => Promise<{ hash: string }>,
  senderAddress: string
): Promise<{ hash: string; wait: () => Promise<any> }> {
  const aptos = getAptosClient();
  const transaction = await buildUnstakeTransaction(senderAddress);

  const pendingTransaction = await signAndSubmitTransaction(transaction);

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
 */
export async function completeChallengeClient(
  signAndSubmitTransaction: (transaction: any) => Promise<{ hash: string }>,
  senderAddress: string,
  challengeId: number
): Promise<{ hash: string; wait: () => Promise<any> }> {
  const aptos = getAptosClient();
  const moduleAddress = getStakingContractAddress();

  const transaction = await aptos.transaction.build.simple({
    sender: senderAddress,
    data: {
      function: `${moduleAddress}::${STAKING_MODULE_NAME}::complete_challenge`,
      functionArguments: [challengeId],
    },
  });

  const pendingTransaction = await signAndSubmitTransaction(transaction);

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
export async function getStakeInfoClient(
  aptos: Aptos,
  userAddress: string
) {
  const moduleAddress = getStakingContractAddress();
  
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

  const [amount, startTime, endTime, isActive, challengesCompleted, totalChallenges] = stakeInfo;
  
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
}

/**
 * Transfer tokens (client-side) - uses wallet adapter
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
  const divisor = BigInt(10 ** decimals);
  const amountU64 = BigInt(Math.floor(Number.parseFloat(amount) * Number(divisor)));

  const transaction = await aptos.transaction.build.simple({
    sender: senderAddress,
    data: {
      function: `${moduleAddress}::${TOKEN_MODULE_NAME}::transfer`,
      functionArguments: [to, amountU64],
    },
  });

  const pendingTransaction = await signAndSubmitTransaction(transaction);

  const executedTransaction = await aptos.waitForTransaction({
    transactionHash: pendingTransaction.hash,
  });

  return {
    hash: pendingTransaction.hash,
    wait: async () => executedTransaction,
  };
}
