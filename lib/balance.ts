import { AccountAddress, Aptos } from "@aptos-labs/ts-sdk";
import { NetworkType, getAptosInstance } from "./aptos";
import { logger } from "./logger";

export interface TokenBalance {
  tokenType: string; // Aptos asset type identifier: address for fungible assets (e.g., "0xd5d0d561..."), or module path for coins (e.g., "0x1::aptos_coin::AptosCoin")
  amount: string; // Raw amount as string
  symbol?: string; // Human-readable token symbol (e.g., "USDt", "TSKULL")
  name?: string; // Human-readable token name (e.g., "Tether USD", "Trihorn Skull")
  decimals?: number; // Number of decimal places
  formattedAmount?: string; // Human-readable amount
}

export interface NFTBalance {
  collectionId: string;
  tokenId: string;
  name?: string;
  description?: string;
  uri?: string;
}

export interface WalletBalance {
  network: string;
  address: string;
  aptBalance: string; // Raw amount in octas
  aptBalanceFormatted: string; // Formatted APT amount
  tokens: TokenBalance[];
  tokenCount: number;
  nfts?: NFTBalance[]; // Optional for now
  nftCount?: number;
}

interface GraphQLFungibleAssetBalance {
  amount: string;
  asset_type: string;
  is_primary?: boolean;
  is_frozen?: boolean;
  token_standard?: string;
  last_transaction_timestamp?: string;
  last_transaction_version?: string;
  storage_id?: string;
}

interface GraphQLFungibleAssetMetadata {
  asset_type: string;
  name?: string;
  symbol?: string;
  decimals?: number;
  creator_address?: string;
  supply?: string;
  icon_uri?: string;
}

interface GraphQLResponse {
  data?: {
    current_fungible_asset_balances?: GraphQLFungibleAssetBalance[];
    fungible_asset_metadata?: GraphQLFungibleAssetMetadata[];
    current_fungible_asset_metadata?: GraphQLFungibleAssetMetadata[];
  };
  errors?: unknown;
}

/**
 * Extract coin type from resource type string
 */
function extractCoinType(resourceType: string): string | null {
  const startIndex = resourceType.indexOf("<");
  const endIndex = resourceType.lastIndexOf(">");

  if (startIndex === -1 || endIndex === -1 || startIndex >= endIndex) {
    return null;
  }

  return resourceType.substring(startIndex + 1, endIndex);
}

/**
 * Get balance value from CoinStore data structure
 */
function getBalanceFromCoinStore(coinStore: any): string | null {
  if (coinStore.coin?.value !== undefined) {
    return BigInt(coinStore.coin.value).toString();
  }
  if (coinStore.value !== undefined) {
    return BigInt(coinStore.value).toString();
  }
  if (coinStore.coin?.val !== undefined) {
    return BigInt(coinStore.coin.val).toString();
  }
  if (typeof coinStore.coin === "string") {
    return BigInt(coinStore.coin).toString();
  }
  if (typeof coinStore.coin === "number") {
    return BigInt(coinStore.coin).toString();
  }
  return null;
}

/**
 * Extract token symbol from coin type
 */
function extractTokenSymbol(coinType: string): string {
  const parts = coinType.split("::");
  const lastPart = parts[parts.length - 1] || "";

  if (lastPart.endsWith("Coin")) {
    return lastPart.slice(0, -4);
  }

  return lastPart;
}

/**
 * Format token amount with decimals
 */
function formatTokenAmount(amount: string, decimals: number): string {
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

/**
 * Get API key for a specific network
 * Supports network-specific keys: APTOS_API_KEY_DEVNET, APTOS_API_KEY_TESTNET, APTOS_API_KEY_MAINNET
 * Falls back to APTOS_API_KEY if network-specific key is not set
 */
function getApiKeyForNetwork(network: NetworkType): string | undefined {
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

/**
 * Get token metadata from on-chain resource
 * For fungible assets, metadata is stored at the asset type address
 */
async function getTokenMetadataFromChain(
  aptos: Aptos,
  assetType: string
): Promise<{ name?: string; symbol?: string; decimals?: number } | null> {
  try {
    // If asset_type is just an address (no "::"), it's a fungible asset address
    // Metadata is stored at that address in 0x1::fungible_asset::Metadata resource
    if (!assetType.includes("::")) {
      const assetAddress = AccountAddress.fromString(assetType);

      try {
        const metadataResource = await aptos.getAccountResource({
          accountAddress: assetAddress,
          resourceType: "0x1::fungible_asset::Metadata",
        });

        const metadata = metadataResource.data as any;

        return {
          name: metadata.name || undefined,
          symbol: metadata.symbol || undefined,
          decimals:
            metadata.decimals !== undefined
              ? Number(metadata.decimals)
              : undefined,
        };
      } catch (error: any) {
        // Resource doesn't exist, return null
        return null;
      }
    }
  } catch (error: any) {
    // Silently fail - not all tokens have on-chain metadata
    return null;
  }

  return null;
}

/**
 * Get token metadata from GraphQL Indexer API
 */
async function getTokenMetadataFromIndexer(
  assetTypes: string[],
  network: NetworkType
): Promise<Map<string, { name?: string; symbol?: string; decimals?: number }>> {
  const metadataMap = new Map<
    string,
    { name?: string; symbol?: string; decimals?: number }
  >();

  if (assetTypes.length === 0) {
    return metadataMap;
  }

  try {
    // GraphQL endpoint URLs
    const graphqlUrls: Record<NetworkType, string> = {
      mainnet: "https://api.mainnet.aptoslabs.com/v1/graphql",
      testnet: "https://api.testnet.aptoslabs.com/v1/graphql",
      devnet: "https://api.devnet.aptoslabs.com/v1/graphql",
    };

    const graphqlUrl = graphqlUrls[network] || graphqlUrls.devnet;

    // Query metadata for all asset types at once
    // Using fungible_asset_metadata (without 'current_' prefix)
    const query = `
      query GetFungibleAssetMetadata($asset_types: [String!]!) {
        fungible_asset_metadata(
          where: { asset_type: { _in: $asset_types } }
        ) {
          asset_type
          name
          symbol
          decimals
          creator_address
        }
      }
    `;

    const variables = {
      asset_types: assetTypes,
    };

    // Get network-specific API key
    const apiKey = getApiKeyForNetwork(network);

    const response = await fetch(graphqlUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(apiKey ? { "X-API-Key": apiKey } : {}),
      },
      body: JSON.stringify({
        query,
        variables,
      }),
    });

    if (response.ok) {
      const result = (await response.json()) as GraphQLResponse;

      if (result.data?.fungible_asset_metadata) {
        for (const metadata of result.data.fungible_asset_metadata) {
          if (metadata.asset_type) {
            metadataMap.set(metadata.asset_type, {
              name: metadata.name || undefined,
              symbol: metadata.symbol || undefined,
              decimals:
                metadata.decimals !== undefined ? metadata.decimals : undefined,
            });
          }
        }
      }
    } else {
      // Log error for debugging
      const errorText = await response.text();
      logger.warn(
        `GraphQL metadata query failed: ${
          response.status
        } - ${errorText.substring(0, 200)}`
      );
    }
  } catch (error: any) {
    logger.error(
      `Error fetching token metadata from indexer: ${error.message}`
    );
  }

  return metadataMap;
}

/**
 * Get fungible assets using GraphQL Indexer API
 */
async function getFungibleAssetsFromIndexer(
  _aptos: Aptos,
  accountAddress: AccountAddress,
  network: NetworkType
): Promise<TokenBalance[]> {
  const tokenHoldings: TokenBalance[] = [];

  try {
    // GraphQL endpoint URLs
    const graphqlUrls: Record<NetworkType, string> = {
      mainnet: "https://api.mainnet.aptoslabs.com/v1/graphql",
      testnet: "https://api.testnet.aptoslabs.com/v1/graphql",
      devnet: "https://api.devnet.aptoslabs.com/v1/graphql",
    };

    const graphqlUrl = graphqlUrls[network] || graphqlUrls.devnet;

    const query = `
      query GetFungibleAssetBalances($owner_address: String!) {
        current_fungible_asset_balances(
          where: { owner_address: { _eq: $owner_address }, amount: { _gt: "0" } }
        ) {
          amount
          asset_type
          is_primary
          is_frozen
          token_standard
          last_transaction_timestamp
          last_transaction_version
          storage_id
        }
      }
    `;

    const variables = {
      owner_address: accountAddress.toString(),
    };

    // Get network-specific API key
    const apiKey = getApiKeyForNetwork(network);

    const response = await fetch(graphqlUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(apiKey ? { "X-API-Key": apiKey } : {}),
      },
      body: JSON.stringify({
        query,
        variables,
      }),
    });

    if (response.ok) {
      const result = (await response.json()) as GraphQLResponse;

      if (result.data?.current_fungible_asset_balances) {
        // Collect unique asset types
        const assetTypes = Array.from(
          new Set(
            result.data.current_fungible_asset_balances
              .map((b) => b.asset_type)
              .filter(
                (type) =>
                  !type.includes("aptos_coin::AptosCoin") &&
                  type !== "0x1::aptos_coin::AptosCoin"
              )
          )
        );

        // Fetch metadata for all tokens from GraphQL indexer
        const metadataMap = await getTokenMetadataFromIndexer(
          assetTypes,
          network
        );

        // Known tokens (fallback for tokens not in indexer)
        const knownTokens: {
          [key: string]: { symbol: string; name: string; decimals: number };
        } = {
          "0x357b0b74bc833e95a115ad22604854d6b0fca151cecd94111770e5d6ffc9dc2b":
            {
              symbol: "USDC",
              name: "USD Coin",
              decimals: 6,
            },
          "0xbae207659db88bea0cbead6da0ed00aac12edcdda169e591cd41c94180b46f3b":
            {
              symbol: "USDT",
              name: "Tether USD",
              decimals: 6,
            },
          "0xf773bc6eebd44641bf05de104de29d1a824f24bdecbdaaf5279a18a13e8987de":
            {
              symbol: "TSKULL",
              name: "Trihorn Skull",
              decimals: 8,
            },
        };

        // Process each balance and fetch metadata if needed
        for (const balance of result.data.current_fungible_asset_balances) {
          // Skip APT (handled separately)
          if (
            balance.asset_type.includes("aptos_coin::AptosCoin") ||
            balance.asset_type === "0x1::aptos_coin::AptosCoin"
          ) {
            continue;
          }

          // Get metadata from indexer or fallback
          let metadata = metadataMap.get(balance.asset_type);
          const knownToken = knownTokens[balance.asset_type];

          // If no metadata from indexer and asset_type is just an address, try on-chain
          if (!metadata && !balance.asset_type.includes("::")) {
            try {
              const chainMetadata = await getTokenMetadataFromChain(
                _aptos,
                balance.asset_type
              );
              if (chainMetadata) {
                metadata = chainMetadata;
                // Cache it for future use
                metadataMap.set(balance.asset_type, chainMetadata);
              }
            } catch (error: any) {
              // Silently continue - on-chain fetch failed
            }
          }

          let symbol: string | undefined;
          let tokenName: string | undefined;
          let decimals = 8; // Default

          // Priority: Indexer metadata > On-chain metadata > Known tokens > Extract from asset_type
          if (metadata) {
            // Use metadata from indexer or on-chain (most reliable)
            symbol = metadata.symbol;
            tokenName = metadata.name;
            decimals = metadata.decimals ?? 8;
          } else if (knownToken) {
            // Use known token mapping
            symbol = knownToken.symbol;
            tokenName = knownToken.name;
            decimals = knownToken.decimals;
          } else {
            // Fallback: Extract from asset_type
            if (balance.asset_type.includes("::")) {
              const assetTypeParts = balance.asset_type.split("::");
              const lastPart =
                assetTypeParts[assetTypeParts.length - 1] || balance.asset_type;
              symbol = lastPart.endsWith("Coin")
                ? lastPart.slice(0, -4)
                : lastPart;
              tokenName = symbol;
            } else {
              // It's just an address - use shortened version for symbol, full address for name
              symbol = `${balance.asset_type.slice(
                0,
                6
              )}...${balance.asset_type.slice(-4)}`;
              tokenName = balance.asset_type;
            }
          }

          const amountStr = String(balance.amount);
          const formattedAmount = formatTokenAmount(amountStr, decimals);

          tokenHoldings.push({
            tokenType: balance.asset_type,
            amount: amountStr,
            symbol: symbol,
            name: tokenName,
            decimals: decimals,
            formattedAmount: formattedAmount,
          });
        }
      }
    }
  } catch (error: any) {
    logger.error(
      `Error fetching fungible assets from indexer: ${error.message}`
    );
  }

  return tokenHoldings;
}

/**
 * Get comprehensive wallet balance including APT, tokens, and NFTs
 */
export async function getComprehensiveBalance(
  address: string,
  network?: NetworkType
): Promise<WalletBalance> {
  const networkType =
    network || (process.env.APTOS_NETWORK as NetworkType) || "devnet";
  const aptosInstance = getAptosInstance(networkType);
  const accountAddress = AccountAddress.fromString(address);

  // Get APT balance using getAccountAPTAmount (most accurate)
  let aptBalanceRaw = "0";
  let aptBalanceFormatted = "0";

  try {
    const aptAmount = await aptosInstance.getAccountAPTAmount({
      accountAddress,
    });
    aptBalanceRaw = aptAmount.toString();
    aptBalanceFormatted = formatTokenAmount(aptBalanceRaw, 8);
  } catch (error: any) {
    // Handle rate limit errors gracefully
    const errorMessage = error?.message || String(error || "");
    if (
      errorMessage.includes("Per anonym") ||
      errorMessage.includes("rate limit") ||
      errorMessage.includes("429") ||
      errorMessage.includes("Unexpected token")
    ) {
      logger.warn("Rate limit hit when fetching APT balance, skipping");
    } else if (
      !errorMessage.includes("Account not found") &&
      !errorMessage.includes("RESOURCE_NOT_FOUND")
    ) {
      logger.error(`Error getting APT balance: ${errorMessage}`);
    }
  }

  // Get all tokens
  const tokens: TokenBalance[] = [];

  // 1. Get fungible assets from GraphQL indexer (most reliable)
  try {
    const indexerTokens = await getFungibleAssetsFromIndexer(
      aptosInstance,
      accountAddress,
      networkType
    );
    tokens.push(...indexerTokens);
  } catch (error: any) {
    // Handle rate limit errors gracefully
    const errorMessage = error?.message || String(error || "");
    if (
      errorMessage.includes("Per anonym") ||
      errorMessage.includes("rate limit") ||
      errorMessage.includes("429") ||
      errorMessage.includes("Unexpected token")
    ) {
      logger.warn(
        "Rate limit hit when fetching tokens from indexer, will try CoinStore fallback"
      );
    } else {
      logger.error(`Error getting tokens from indexer: ${errorMessage}`);
    }
  }

  // 2. Get CoinStore resources for other tokens
  try {
    const resources = await aptosInstance.getAccountResources({
      accountAddress,
    });

    for (const resource of resources) {
      const resourceType = resource.type;

      if (
        resourceType.includes("::coin::CoinStore") ||
        resourceType.includes("CoinStore<")
      ) {
        const coinStore = resource.data as any;
        const coinType = extractCoinType(resourceType);

        if (!coinType) {
          continue;
        }

        // Skip APT (already handled)
        const isAPT =
          coinType.includes("0x1::aptos_coin::AptosCoin") ||
          coinType.includes("aptos_coin::AptosCoin") ||
          coinType === "0x1::aptos_coin::AptosCoin" ||
          resourceType.includes("aptos_coin::AptosCoin");

        if (isAPT) {
          continue;
        }

        const amountStr = getBalanceFromCoinStore(coinStore);

        if (amountStr && amountStr !== "0") {
          // Check if we already have this token from indexer
          const existingToken = tokens.find((t) => t.tokenType === coinType);

          if (!existingToken) {
            const symbol = extractTokenSymbol(coinType);
            const formattedAmount = formatTokenAmount(amountStr, 8);

            tokens.push({
              tokenType: coinType,
              amount: amountStr,
              symbol: symbol || undefined,
              decimals: 8,
              formattedAmount: formattedAmount,
            });
          }
        }
      }
    }
  } catch (error: any) {
    // Handle rate limit errors gracefully
    const errorMessage = error?.message || String(error || "");
    if (
      errorMessage.includes("Per anonym") ||
      errorMessage.includes("rate limit") ||
      errorMessage.includes("429") ||
      errorMessage.includes("Unexpected token")
    ) {
      logger.warn("Rate limit hit when fetching CoinStore resources, skipping");
    } else if (
      !errorMessage.includes("Account not found") &&
      !errorMessage.includes("RESOURCE_NOT_FOUND")
    ) {
      logger.error(`Error getting CoinStore resources: ${errorMessage}`);
    }
  }

  return {
    network: networkType,
    address: address,
    aptBalance: aptBalanceRaw,
    aptBalanceFormatted: aptBalanceFormatted,
    tokens: tokens,
    tokenCount: tokens.length,
  };
}
