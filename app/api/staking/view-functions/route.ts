import { getAptosClient } from "@/lib/blockchain";
import { getStakingContractAddress } from "@/lib/contract-helpers";
import { NextRequest, NextResponse } from "next/server";

const STAKING_MODULE_NAME = "dojohunt_staking";

/**
 * GET /api/staking/view-functions
 * Query parameters:
 * - function: 'get_all_stakes' | 'get_all_active_stakes' | 'get_pool_stats' | 'get_user_stake' | 'get_user_challenges' | 'get_user_challenges_count'
 * - walletAddress: (required for user-specific functions)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const functionName = searchParams.get("function");
    const walletAddress = searchParams.get("walletAddress");

    if (!functionName) {
      return NextResponse.json(
        { error: "Function name is required" },
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const aptos = getAptosClient();
    const moduleAddress = getStakingContractAddress();

    if (!moduleAddress) {
      return NextResponse.json(
        { error: "Staking contract address not configured" },
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    let result;

    switch (functionName) {
      case "get_all_stakes":
        result = await aptos.view({
          function: `${moduleAddress}::${STAKING_MODULE_NAME}::get_all_stakes`,
          functionArguments: [],
        });
        // Result is vector<StakeInfo> where StakeInfo is:
        // { wallet_address, amount, start_time, end_time, challenges_completed, is_active }
        const allStakes = (result as any[]).map((stake: any) => ({
          walletAddress: stake.wallet_address || stake[0],
          amount: Number(stake.amount || stake[1]),
          startTime: new Date(Number(stake.start_time || stake[2]) * 1000),
          endTime: new Date(Number(stake.end_time || stake[3]) * 1000),
          challengesCompleted: Number(stake.challenges_completed || stake[4]),
          isActive: stake.is_active !== undefined ? stake.is_active : stake[5],
        }));
        return NextResponse.json(
          { success: true, data: allStakes },
          { headers: { "Content-Type": "application/json" } }
        );

      case "get_all_active_stakes":
        result = await aptos.view({
          function: `${moduleAddress}::${STAKING_MODULE_NAME}::get_all_active_stakes`,
          functionArguments: [],
        });
        // Result is vector<StakeInfo> where StakeInfo is:
        // { wallet_address, amount, start_time, end_time, challenges_completed, is_active }
        const activeStakes = (result as any[]).map((stake: any) => ({
          walletAddress: stake.wallet_address || stake[0],
          amount: Number(stake.amount || stake[1]),
          startTime: new Date(Number(stake.start_time || stake[2]) * 1000),
          endTime: new Date(Number(stake.end_time || stake[3]) * 1000),
          challengesCompleted: Number(stake.challenges_completed || stake[4]),
          isActive: true, // All returned stakes are active
        }));
        return NextResponse.json(
          { success: true, data: activeStakes },
          { headers: { "Content-Type": "application/json" } }
        );

      case "get_pool_stats":
        result = await aptos.view({
          function: `${moduleAddress}::${STAKING_MODULE_NAME}::get_pool_stats`,
          functionArguments: [],
        });
        // Result is (u64, u64, u64) = (total_staked, total_fees, total_stakers)
        const stats = result as any[];
        return NextResponse.json(
          {
            success: true,
            data: {
              totalStaked: Number(stats[0]),
              totalFees: Number(stats[1]),
              totalStakers: Number(stats[2]),
            },
          },
          { headers: { "Content-Type": "application/json" } }
        );

      case "get_user_stake":
        if (!walletAddress) {
          return NextResponse.json(
            { error: "walletAddress is required for get_user_stake" },
            { status: 400, headers: { "Content-Type": "application/json" } }
          );
        }
        result = await aptos.view({
          function: `${moduleAddress}::${STAKING_MODULE_NAME}::get_stake`,
          functionArguments: [walletAddress],
        });
        // Result is (u64, u64, u64, bool, u64, u64)
        const stakeData = result as any[];
        return NextResponse.json(
          {
            success: true,
            data: {
              amount: Number(stakeData[0]),
              startTime: new Date(Number(stakeData[1]) * 1000),
              endTime: new Date(Number(stakeData[2]) * 1000),
              isActive: stakeData[3],
              challengesCompleted: Number(stakeData[4]),
              challengesRequired: Number(stakeData[5]),
            },
          },
          { headers: { "Content-Type": "application/json" } }
        );

      case "get_user_challenges":
        if (!walletAddress) {
          return NextResponse.json(
            { error: "walletAddress is required for get_user_challenges" },
            { status: 400, headers: { "Content-Type": "application/json" } }
          );
        }
        result = await aptos.view({
          function: `${moduleAddress}::${STAKING_MODULE_NAME}::get_user_completed_challenges`,
          functionArguments: [walletAddress],
        });
        // Result is vector<u64> (challenge IDs)
        return NextResponse.json(
          {
            success: true,
            data: {
              completedChallengeIds: (result as any[]).map((id) => Number(id)),
            },
          },
          { headers: { "Content-Type": "application/json" } }
        );

      case "get_user_challenges_count":
        if (!walletAddress) {
          return NextResponse.json(
            { error: "walletAddress is required for get_user_challenges_count" },
            { status: 400, headers: { "Content-Type": "application/json" } }
          );
        }
        result = await aptos.view({
          function: `${moduleAddress}::${STAKING_MODULE_NAME}::get_user_challenges_count`,
          functionArguments: [walletAddress],
        });
        // Result is u64
        return NextResponse.json(
          {
            success: true,
            data: {
              completedChallengesCount: Number(result),
            },
          },
          { headers: { "Content-Type": "application/json" } }
        );

      case "get_all_stakers":
        result = await aptos.view({
          function: `${moduleAddress}::${STAKING_MODULE_NAME}::get_all_stakers`,
          functionArguments: [],
        });
        // Result is vector<address>
        return NextResponse.json(
          {
            success: true,
            data: {
              stakerAddresses: result as string[],
            },
          },
          { headers: { "Content-Type": "application/json" } }
        );

      default:
        return NextResponse.json(
          {
            error: `Unknown function: ${functionName}`,
            availableFunctions: [
              "get_all_stakes",
              "get_all_active_stakes",
              "get_pool_stats",
              "get_user_stake",
              "get_user_challenges",
              "get_user_challenges_count",
              "get_all_stakers",
            ],
          },
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
    }
  } catch (error) {
    console.error("[STAKING VIEW] Error calling view function:", error);
    const errorMessage =
      error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      {
        error: "Failed to call view function",
        message: errorMessage,
      },
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

