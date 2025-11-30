import { getUserIdFromJWT, getUserIdFromRequest } from "@/lib/auth-utils";
import { getStakeInfo, verifyStakeTransaction } from "@/lib/blockchain";
import { getCollection } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const stakeSchema = z.object({
  transactionHash: z.string().min(1, "Transaction hash is required"),
  walletAddress: z.string().min(1, "Wallet address is required"),
});

export async function POST(request: NextRequest) {
  try {
    // Get user ID from NextAuth session or JWT token
    let userId: string | null = null;
    try {
      userId = await getUserIdFromRequest(request);
    } catch (authError) {
      console.error("[STAKING] Error getting userId from request:", authError);
    }

    // Fallback to JWT token from Authorization header
    if (!userId) {
      try {
        const authHeader = request.headers.get("authorization");
        userId = getUserIdFromJWT(authHeader);
      } catch (jwtError) {
        console.error("[STAKING] Error getting userId from JWT:", jwtError);
      }
    }

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized. Please sign in to stake tokens." },
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    let body;
    try {
      body = await request.json();
    } catch (jsonError) {
      console.error("[STAKING] Error parsing request body:", jsonError);
      return NextResponse.json(
        { error: "Invalid request body. Expected JSON." },
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    let transactionHash: string;
    let walletAddress: string;
    try {
      const parsed = stakeSchema.parse(body);
      transactionHash = parsed.transactionHash;
      walletAddress = parsed.walletAddress;
    } catch (validationError) {
      if (validationError instanceof z.ZodError) {
        return NextResponse.json(
          { error: "Validation error", details: validationError.issues },
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }
      return NextResponse.json(
        { error: "Invalid request data" },
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Verify user owns the wallet (get user from database to check wallet)
    let usersCollection;
    let user;
    try {
      usersCollection = await getCollection("users");
      
      // Try to find user by ID first
      try {
        user = await usersCollection.findOne({
          _id: new ObjectId(userId),
        });
      } catch (idError) {
        console.log("[STAKING] Invalid ObjectId format, trying alternative lookup");
        // If ObjectId conversion fails, try as string
        user = await usersCollection.findOne({
          _id: userId,
        });
      }
      
      // If still not found, try to get user from session email (fallback)
      if (!user) {
        const { getServerSession } = require("next-auth");
        const { authOptions } = require("@/lib/auth-options");
        const session = await getServerSession(authOptions);
        
        if (session?.user?.email) {
          user = await usersCollection.findOne({
            email: session.user.email,
          });
          
          if (user) {
            console.log("[STAKING] Found user by email, ID mismatch:", {
              sessionId: userId,
              dbId: user._id.toString(),
            });
          }
        }
      }
    } catch (dbError) {
      console.error("[STAKING] Error accessing users collection:", dbError);
      return NextResponse.json(
        { error: "Database error. Please try again." },
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    if (!user) {
      console.error("[STAKING] User not found in database:", {
        userId,
        userIdType: typeof userId,
      });
      return NextResponse.json(
        { error: "User not found. Please ensure you are signed in." },
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    // ENFORCE ONE WALLET PER USER: Use wallet from DB, not from request
    // The wallet address in the request should match the DB wallet
    if (!user.walletAddress) {
      return NextResponse.json(
        {
          error:
            "No wallet connected. Please connect your wallet in Settings first.",
        },
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Verify the wallet address matches the user's registered wallet
    if (user.walletAddress !== walletAddress) {
      return NextResponse.json(
        {
          error:
            "Wallet address mismatch. Please use your registered wallet. Each user can only use one wallet.",
        },
        { status: 403, headers: { "Content-Type": "application/json" } }
      );
    }

    // Use the DB wallet address (source of truth)
    const dbWalletAddress = user.walletAddress;

    // Use the actual user._id from database (may differ from session userId)
    const actualUserId = user._id;
    
    // Check if user already has an active stake
    let stakesCollection;
    let existingStake;
    try {
      stakesCollection = await getCollection("stakes");
      existingStake = await stakesCollection.findOne({
        userId: actualUserId,
        status: "ACTIVE",
      });
    } catch (dbError) {
      console.error("[STAKING] Error accessing stakes collection:", dbError);
      return NextResponse.json(
        { error: "Database error. Please try again." },
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    if (existingStake) {
      return NextResponse.json(
        { error: "User already has an active stake" },
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Verify the staking transaction on blockchain using DB wallet address
    let verifyResult;
    try {
      verifyResult = await verifyStakeTransaction(
        transactionHash,
        dbWalletAddress // Use DB wallet address
      );
    } catch (verifyError) {
      console.error("Error verifying stake transaction:", verifyError);
      return NextResponse.json(
        {
          error: "Failed to verify staking transaction",
          message:
            verifyError instanceof Error
              ? verifyError.message
              : String(verifyError),
        },
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    if (!verifyResult.success || !verifyResult.data) {
      return NextResponse.json(
        {
          error: verifyResult.error || "Failed to verify staking transaction",
        },
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const stakeData = verifyResult.data;
    const amount = stakeData.amount; // This is the raw amount

    // Get token info to format amount correctly
    let tokenMetadata;
    try {
      const { getTokenMetadata } = await import("@/lib/blockchain");
      tokenMetadata = await getTokenMetadata();
    } catch (tokenError) {
      console.error("Error getting token metadata:", tokenError);
      // Use default decimals if metadata fetch fails
      tokenMetadata = { decimals: 8 };
    }

    const decimals = tokenMetadata.decimals || 8;
    const divisor = BigInt(10 ** decimals);
    const formattedAmount = Number(BigInt(amount)) / Number(divisor);

    // Use end time from blockchain transaction
    const endTime = new Date(Number(stakeData.endTime) * 1000);
    const startTime = new Date(Number(stakeData.startTime) * 1000);

    // Get random challenges for this stake
    let challengesCollection;
    let challenges;
    try {
      challengesCollection = await getCollection("challenges");
      challenges = await challengesCollection
        .find({
          isActive: true,
          isPublished: true,
        })
        .limit(5)
        .toArray();
    } catch (dbError) {
      console.error(
        "[STAKING] Error accessing challenges collection:",
        dbError
      );
      return NextResponse.json(
        { error: "Database error. Please try again." },
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // Create stake record in database
    const stakeRecord = {
      userId: actualUserId, // Use actual user._id from database
      walletAddress: dbWalletAddress, // Store DB wallet address (source of truth)
      amount: formattedAmount, // Use formatted amount (already a number)
      startTime,
      endTime,
      challengesRequired: 5,
      challengesCompleted: 0,
      status: "ACTIVE",
      transactionHash,
      challengeIds: challenges.map((challenge) => challenge._id),
      fee: 0,
      reward: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    let stakeResult_db;
    try {
      stakeResult_db = await stakesCollection.insertOne(stakeRecord);
    } catch (dbError) {
      console.error("[STAKING] Error inserting stake record:", dbError);
      return NextResponse.json(
        { error: "Database error. Failed to create stake record." },
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
    const stake = { ...stakeRecord, _id: stakeResult_db.insertedId };

    // Log stake creation
    console.log("📝 [STAKING] Creating stake record:", {
      sessionUserId: userId,
      actualUserId: actualUserId.toString(),
      walletAddress: dbWalletAddress,
      amount: formattedAmount,
      transactionHash: transactionHash,
      stakeId: stakeResult_db.insertedId.toString(),
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
    });

    // Update user stats
    let userStatsCollection;
    let statsUpdateResult;
    try {
      userStatsCollection = await getCollection("userStats");
      statsUpdateResult = await userStatsCollection.updateOne(
        { userId: actualUserId }, // Use actual user._id from database
        {
          $inc: { totalStaked: stake.amount },
          $set: { updatedAt: new Date() },
        },
        { upsert: true } // Create if doesn't exist
      );

      // Log stats update
      console.log("📊 [STAKING] Updated userStats:", {
        sessionUserId: userId,
        actualUserId: actualUserId.toString(),
        totalStaked: stake.amount,
        matchedCount: statsUpdateResult.matchedCount,
        modifiedCount: statsUpdateResult.modifiedCount,
        upsertedId: statsUpdateResult.upsertedId?.toString(),
      });
    } catch (dbError) {
      console.error("[STAKING] Error updating userStats:", dbError);
      // Don't fail the request if stats update fails, but log it
      // The stake was already created, so we can continue
    }

    return NextResponse.json(
      {
        success: true,
        stake: {
          id: stake._id.toString(),
          amount: stake.amount,
          startTime: stake.startTime,
          endTime: stake.endTime,
          challengesRequired: stake.challengesRequired,
          challengesCompleted: stake.challengesCompleted,
          status: stake.status,
          transactionHash: stake.transactionHash,
          challenges: challenges.map((challenge) => ({
            id: challenge._id.toString(),
            title: challenge.title,
            difficulty: challenge.difficulty,
            category: challenge.category,
          })),
        },
      },
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Staking error:", error);

    // Always return JSON, even on errors
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Log the full error for debugging
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Full staking error details:", {
      message: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
      error: error,
    });

    return NextResponse.json(
      {
        error: "Staking failed",
        message: errorMessage,
      },
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get user ID from NextAuth session or JWT token
    let userId = null;
    try {
      userId = await getUserIdFromRequest(request);
    } catch (authError) {
      console.error("[STAKING] GET: Error getting userId from request:", authError);
    }

    // Fallback to JWT token from Authorization header
    if (!userId) {
      try {
        const authHeader = request.headers.get("authorization");
        userId = getUserIdFromJWT(authHeader);
      } catch (jwtError) {
        console.error("[STAKING] GET: Error getting userId from JWT:", jwtError);
      }
    }

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized. Please sign in to view your stake." },
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }
    
    // Get user to verify they exist and get their actual _id
    const usersCollection = await getCollection("users");
    let user = null;
    
    // Try to find user by ID first
    try {
      user = await usersCollection.findOne({
        _id: new ObjectId(userId),
      });
    } catch (idError) {
      console.log("[STAKING] GET: Invalid ObjectId format, trying alternative lookup");
      // If ObjectId conversion fails, try as string
      user = await usersCollection.findOne({
        _id: userId,
      });
    }
    
    // If still not found, try to get user from session email (fallback)
    if (!user) {
      const { getServerSession } = require("next-auth");
      const { authOptions } = require("@/lib/auth-options");
      const session = await getServerSession(authOptions);
      
      if (session?.user?.email) {
        user = await usersCollection.findOne({
          email: session.user.email,
        });
        
        if (user) {
          console.log("[STAKING] GET: Found user by email, ID mismatch:", {
            sessionId: userId,
            dbId: user._id.toString(),
          });
        }
      }
    }
    
    if (!user) {
      console.error("[STAKING] GET: User not found in database:", {
        userId,
        userIdType: typeof userId,
      });
      return NextResponse.json(
        { 
          success: true,
          stake: null,
        },
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }
    
    // Use the actual user._id from database (may differ from session userId)
    const actualUserId = user._id;

    // Get current stake
    const stakesCollection = await getCollection("stakes");
    const challengesCollection = await getCollection("challenges");
    const submissionsCollection = await getCollection("submissions");

    // Database is the source of truth - check for ACTIVE stake
    // Only sync with on-chain if there's a mismatch (background sync)
    const stake = await stakesCollection.findOne({
      userId: actualUserId, // Use actual user._id from database
      status: "ACTIVE",
    });

    if (!stake) {
      // No active stake in database - return null
      return NextResponse.json(
        {
          success: true,
          stake: null,
        },
        {
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Background sync: Verify on-chain status (non-blocking)
    // This helps keep DB in sync but doesn't block the response
    // The database status is what we return to the frontend
    try {
      const { getStakeInfo } = await import("@/lib/blockchain");
      const walletAddress = user?.walletAddress; // Use user already fetched above

      if (walletAddress) {
        // Fire and forget - don't wait for this
        getStakeInfo(walletAddress)
          .then((onChainStake) => {
            // If stake is not active on-chain but marked as ACTIVE in DB, update it
            if (
              !onChainStake.success ||
              !onChainStake.data ||
              !onChainStake.data.isActive
            ) {
              const challengesCompleted = stake.challengesCompleted || 0;
              const challengesRequired = stake.challengesRequired || 5;
              const status =
                challengesCompleted >= challengesRequired
                  ? "COMPLETED"
                  : "CANCELLED";

              stakesCollection
                .updateOne(
                  { _id: stake._id },
                  {
                    $set: {
                      status,
                      updatedAt: new Date(),
                    },
                  }
                )
                .catch((err) => {
                  console.error(
                    "Error updating stake status in background sync:",
                    err
                  );
                });
            }
          })
          .catch((err) => {
            // Silently fail - on-chain check is optional
            console.error("Background on-chain check failed:", err);
          });
      }
    } catch (error) {
      // Silently fail - on-chain check is optional for background sync
      console.error("Error initiating background on-chain check:", error);
    }

    // Get challenges for this stake
    const challenges = await challengesCollection
      .find({
        _id: { $in: stake.challengeIds },
      })
      .project({
        _id: 1,
        title: 1,
        difficulty: 1,
        category: 1,
      })
      .toArray();

    // Get completed submissions
    const submissions = await submissionsCollection
      .find({
        stakeId: stake._id,
        status: "ACCEPTED",
      })
      .project({
        challengeId: 1,
        score: 1,
        submittedAt: 1,
      })
      .toArray();

    // Calculate time remaining
    const now = new Date();
    const timeRemaining = Math.max(0, stake.endTime.getTime() - now.getTime());

    return NextResponse.json(
      {
        success: true,
        stake: {
          id: stake._id.toString(),
          amount: stake.amount,
          startTime: stake.startTime,
          endTime: stake.endTime,
          challengesRequired: stake.challengesRequired,
          challengesCompleted: stake.challengesCompleted,
          status: stake.status,
          timeRemaining,
          challenges: challenges.map((challenge) => ({
            id: challenge._id.toString(),
            title: challenge.title,
            difficulty: challenge.difficulty,
            category: challenge.category,
          })),
          completedChallenges: submissions.map((sub) =>
            sub.challengeId.toString()
          ),
        },
      },
      {
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Get stake error:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      {
        error: "Failed to get stake",
        message: errorMessage,
      },
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
