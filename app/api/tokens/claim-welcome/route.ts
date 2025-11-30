import { getCollection } from "@/lib/mongodb";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { distributeWelcomeTokens } from "@/lib/token-distribution";
import { AccountAddress } from "@aptos-labs/ts-sdk";

const WELCOME_TOKEN_AMOUNT = 10; // 10 TSKULL tokens

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    console.log("[WELCOME TOKENS] POST: Claim request received");

    if (!session?.user?.id || !session?.user?.email) {
      console.log("[WELCOME TOKENS] POST: Unauthorized - no session");
      return NextResponse.json(
        { error: "Unauthorized. Please sign in." },
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log("[WELCOME TOKENS] POST: Processing claim for user:", session.user.id);

    const usersCollection = await getCollection("users");
    const user = await usersCollection.findOne({
      _id: new ObjectId(session.user.id),
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Check if user has already claimed welcome tokens
    if (user.hasClaimedWelcomeTokens) {
      console.log("[WELCOME TOKENS] POST: User has already claimed");
      return NextResponse.json(
        { error: "Welcome tokens have already been claimed" },
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Check if user has a wallet address
    if (!user.walletAddress) {
      console.log("[WELCOME TOKENS] POST: User has no wallet address");
      return NextResponse.json(
        { error: "Please connect your wallet first to receive tokens" },
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log("[WELCOME TOKENS] POST: Distributing tokens to:", user.walletAddress);

    // Validate Aptos address format
    try {
      AccountAddress.fromString(user.walletAddress);
    } catch (error) {
      return NextResponse.json(
        { error: "Invalid wallet address format" },
        { status: 400 }
      );
    }

    // Distribute tokens
    const result = await distributeWelcomeTokens(user.walletAddress, WELCOME_TOKEN_AMOUNT);

    if (!result.success) {
      console.error("[WELCOME TOKENS] POST: Token distribution failed:", result.error);
      return NextResponse.json(
        { error: result.error || "Failed to distribute tokens" },
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log("[WELCOME TOKENS] POST: Tokens distributed successfully:", {
      transactionHash: result.transactionHash,
      method: result.method,
    });

    // Mark user as having claimed welcome tokens
    await usersCollection.updateOne(
      { _id: new ObjectId(session.user.id) },
      {
        $set: {
          hasClaimedWelcomeTokens: true,
          updatedAt: new Date(),
        },
      }
    );

    console.log("[WELCOME TOKENS] POST: User marked as having claimed tokens");

    return NextResponse.json({
      success: true,
      message: `Successfully distributed ${WELCOME_TOKEN_AMOUNT} TSKULL tokens`,
      transactionHash: result.transactionHash,
      method: result.method,
    }, { headers: { "Content-Type": "application/json" } });
  } catch (error) {
    console.error("[WELCOME TOKENS] POST: Error claiming welcome tokens:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

/**
 * Check if user has claimed welcome tokens
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      console.log("[WELCOME TOKENS] GET: No session found");
      return NextResponse.json(
        { 
          error: "Unauthorized",
          hasClaimed: false,
          hasWallet: false,
        },
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log("[WELCOME TOKENS] GET: Checking status for user:", session.user.id);

    const usersCollection = await getCollection("users");
    const user = await usersCollection.findOne({
      _id: new ObjectId(session.user.id),
    });

    if (!user) {
      console.log("[WELCOME TOKENS] GET: User not found in database");
      return NextResponse.json(
        { 
          error: "User not found",
          hasClaimed: false,
          hasWallet: false,
        },
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    const hasClaimed = user.hasClaimedWelcomeTokens || false;
    const hasWallet = !!user.walletAddress;

    console.log("[WELCOME TOKENS] GET: Status:", {
      userId: session.user.id,
      hasClaimed,
      hasWallet,
      walletAddress: user.walletAddress || "none",
    });

    return NextResponse.json({
      hasClaimed,
      hasWallet,
    }, { headers: { "Content-Type": "application/json" } });
  } catch (error) {
    console.error("[WELCOME TOKENS] GET: Error checking welcome tokens status:", error);
    return NextResponse.json(
      { 
        error: "Internal server error",
        hasClaimed: false,
        hasWallet: false,
      },
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}


