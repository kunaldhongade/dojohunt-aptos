import { verifyUnstakeTransaction } from "@/lib/blockchain";
import { getCollection } from "@/lib/mongodb";
import { getUserIdFromRequest, getUserIdFromJWT } from "@/lib/auth-utils";
import { ObjectId } from "mongodb";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const unstakeSchema = z.object({
  transactionHash: z.string().min(1, "Transaction hash is required"),
  walletAddress: z.string().min(1, "Wallet address is required"),
});

export async function POST(request: NextRequest) {
  try {
    // Get user ID from NextAuth session or JWT token
    let userId = await getUserIdFromRequest(request);
    
    // Fallback to JWT token from Authorization header
    if (!userId) {
      const authHeader = request.headers.get("authorization");
      userId = getUserIdFromJWT(authHeader);
    }

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized. Please sign in to unstake tokens." },
        { 
          status: 401,
          headers: { "Content-Type": "application/json" }
        }
      );
    }

    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      console.error("Error parsing request body:", parseError);
      return NextResponse.json(
        { error: "Invalid request body" },
        { 
          status: 400,
          headers: { "Content-Type": "application/json" }
        }
      );
    }

    let transactionHash: string;
    let walletAddress: string;
    try {
      const parsed = unstakeSchema.parse(body);
      transactionHash = parsed.transactionHash;
      walletAddress = parsed.walletAddress;
    } catch (validationError) {
      if (validationError instanceof z.ZodError) {
        return NextResponse.json(
          { error: "Validation error", details: validationError.issues },
          { 
            status: 400,
            headers: { "Content-Type": "application/json" }
          }
        );
      }
      throw validationError;
    }

    // Verify user owns the wallet
    const usersCollection = await getCollection("users");
    const user = await usersCollection.findOne({
      _id: new ObjectId(userId),
    });

    if (user && user.walletAddress && user.walletAddress !== walletAddress) {
      return NextResponse.json(
        { error: "Wallet address mismatch. Please use your registered wallet." },
        { 
          status: 403,
          headers: { "Content-Type": "application/json" }
        }
      );
    }

    // Get the active stake
    const stakesCollection = await getCollection("stakes");
    const stake = await stakesCollection.findOne({
      userId: new ObjectId(userId),
      status: "ACTIVE",
    });

    if (!stake) {
      return NextResponse.json(
        { error: "No active stake found" },
        { 
          status: 404,
          headers: { "Content-Type": "application/json" }
        }
      );
    }

    // Verify the unstaking transaction on blockchain
    let verifyResult;
    try {
      verifyResult = await verifyUnstakeTransaction(transactionHash, walletAddress);
    } catch (verifyError) {
      console.error("Error verifying unstake transaction:", verifyError);
      return NextResponse.json(
        { 
          error: "Failed to verify unstaking transaction",
          message: verifyError instanceof Error ? verifyError.message : String(verifyError),
        },
        { 
          status: 400,
          headers: { "Content-Type": "application/json" }
        }
      );
    }

    if (!verifyResult.success) {
      console.error("Unstake transaction verification failed:", verifyResult.error);
      return NextResponse.json(
        { 
          error: verifyResult.error || "Failed to verify unstaking transaction" 
        },
        { 
          status: 400,
          headers: { "Content-Type": "application/json" }
        }
      );
    }

    console.log("Unstake transaction verified on-chain:", {
      transactionHash,
      walletAddress,
      stakeId: stake._id.toString(),
    });

    // Update stake status to COMPLETED or CANCELLED
    // Check if all challenges were completed
    const challengesCompleted = stake.challengesCompleted || 0;
    const challengesRequired = stake.challengesRequired || 5;
    const status = challengesCompleted >= challengesRequired ? "COMPLETED" : "CANCELLED";

    console.log("Updating stake in database:", {
      stakeId: stake._id.toString(),
      userId: userId,
      oldStatus: stake.status,
      newStatus: status,
      challengesCompleted,
      challengesRequired,
    });

    // CRITICAL: Update database FIRST - this is the source of truth
    const updateResult = await stakesCollection.updateOne(
      { _id: stake._id, status: "ACTIVE" }, // Only update if still ACTIVE (prevent race conditions)
      {
        $set: {
          status,
          unstakeTransactionHash: transactionHash,
          updatedAt: new Date(),
        },
      }
    );

          // Log unstake verification
          console.log("✅ [UNSTAKE] Unstake transaction verified:", {
            userId: userId,
            userObjectId: new ObjectId(userId).toString(),
            transactionHash: transactionHash,
            walletAddress: walletAddress,
            stakeId: stake._id.toString(),
            stakeAmount: stake.amount,
            challengesCompleted: challengesCompleted,
            challengesRequired: challengesRequired,
            newStatus: status,
          });

          // Verify the update was successful
          if (updateResult.matchedCount === 0) {
            console.error("⚠️ [UNSTAKE] Stake not found for update (may have been updated already):", {
              stakeId: stake._id.toString(),
              currentStatus: stake.status,
            });
      // Check if stake was already updated
      const currentStake = await stakesCollection.findOne({ _id: stake._id });
      if (currentStake && currentStake.status !== "ACTIVE") {
        // Stake was already updated (possibly by another request)
        console.log("Stake was already updated to:", currentStake.status);
        return NextResponse.json({
          success: true,
          message: "Tokens successfully unstaked",
          stake: {
            id: stake._id.toString(),
            status: currentStake.status,
            isActive: false,
          },
        });
      }
      return NextResponse.json(
        { error: "Stake not found for update" },
        { 
          status: 404,
          headers: { "Content-Type": "application/json" }
        }
      );
    }

    if (updateResult.modifiedCount === 0) {
      console.warn("Stake update matched but was not modified:", {
        stakeId: stake._id.toString(),
        matchedCount: updateResult.matchedCount,
        modifiedCount: updateResult.modifiedCount,
      });
    } else {
      console.log("✅ Stake successfully updated in database:", {
        stakeId: stake._id.toString(),
        newStatus: status,
        userId: userId,
        modifiedCount: updateResult.modifiedCount,
      });
    }

    // Update user stats
    try {
      const userStatsCollection = await getCollection("userStats");
      const statsUpdateResult = await userStatsCollection.updateOne(
        { userId: new ObjectId(userId) },
        {
          $inc: { totalUnstaked: stake.amount },
          $set: { updatedAt: new Date() },
        },
        { upsert: true } // Create if doesn't exist
      );

      console.log("📊 [UNSTAKE] Updated userStats:", {
        userId: userId,
        userObjectId: new ObjectId(userId).toString(),
        totalUnstaked: stake.amount,
        matchedCount: statsUpdateResult.matchedCount,
        modifiedCount: statsUpdateResult.modifiedCount,
        upsertedId: statsUpdateResult.upsertedId?.toString(),
      });
    } catch (statsError) {
      console.error("❌ [UNSTAKE] Error updating user stats:", statsError);
      // Don't fail the request if stats update fails
    }

    return NextResponse.json({
      success: true,
      message: "Tokens successfully unstaked",
      stake: {
        id: stake._id.toString(),
        status,
        isActive: false, // Explicitly mark as inactive
      },
    }, {
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Unstaking error:", error);
    
    // Always return JSON, even on errors
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { 
          status: 400,
          headers: { "Content-Type": "application/json" }
        }
      );
    }
    
    // Log the full error for debugging
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Full unstaking error details:", {
      message: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
      error: error,
    });
    
    return NextResponse.json(
      { 
        error: "Unstaking failed",
        message: errorMessage,
      },
      { 
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
}

