import { verifyStakeTransaction, getStakeInfo } from "@/lib/blockchain";
import { getCollection } from "@/lib/mongodb";
import { getUserIdFromRequest, getUserIdFromJWT } from "@/lib/auth-utils";
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
    let userId = await getUserIdFromRequest(request);
    
    // Fallback to JWT token from Authorization header
    if (!userId) {
      const authHeader = request.headers.get("authorization");
      userId = getUserIdFromJWT(authHeader);
    }

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized. Please sign in to stake tokens." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { transactionHash, walletAddress } = stakeSchema.parse(body);

    // Verify user owns the wallet (get user from database to check wallet)
    const usersCollection = await getCollection("users");
    const user = await usersCollection.findOne({
      _id: new ObjectId(userId),
    });

    // Update or set user's wallet address
    if (user) {
      if (user.walletAddress && user.walletAddress !== walletAddress) {
        return NextResponse.json(
          { error: "Wallet address mismatch. Please use your registered wallet." },
          { status: 403 }
        );
      }
      // Update wallet address if not set
      if (!user.walletAddress) {
        await usersCollection.updateOne(
          { _id: new ObjectId(userId) },
          { $set: { walletAddress } }
        );
      }
    }

    // Check if user already has an active stake
    const stakesCollection = await getCollection("stakes");
    const existingStake = await stakesCollection.findOne({
      userId: new ObjectId(userId),
      status: "ACTIVE",
    });

    if (existingStake) {
      return NextResponse.json(
        { error: "User already has an active stake" },
        { status: 400 }
      );
    }

    // Verify the staking transaction on blockchain
    const verifyResult = await verifyStakeTransaction(transactionHash, walletAddress);
    if (!verifyResult.success || !verifyResult.data) {
      return NextResponse.json(
        { error: verifyResult.error || "Failed to verify staking transaction" },
        { status: 400 }
      );
    }

    const stakeData = verifyResult.data;
    const amount = stakeData.amount; // This is the raw amount
    
    // Get token info to format amount correctly
    const { getTokenMetadata } = await import("@/lib/blockchain");
    const tokenMetadata = await getTokenMetadata();
    const decimals = tokenMetadata.decimals || 8;
    const divisor = BigInt(10 ** decimals);
    const formattedAmount = Number(BigInt(amount)) / Number(divisor);

    // Use end time from blockchain transaction
    const endTime = new Date(Number(stakeData.endTime) * 1000);
    const startTime = new Date(Number(stakeData.startTime) * 1000);

    // Get random challenges for this stake
    const challengesCollection = await getCollection("challenges");
    const challenges = await challengesCollection
      .find({
        isActive: true,
        isPublished: true,
      })
      .limit(5)
      .toArray();

    // Create stake record in database
    const stakeRecord = {
      userId: new ObjectId(userId),
      amount: parseFloat(formattedAmount), // Use formatted amount
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

    const stakeResult_db = await stakesCollection.insertOne(stakeRecord);
    const stake = { ...stakeRecord, _id: stakeResult_db.insertedId };

    // Update user stats
    const userStatsCollection = await getCollection("userStats");
    await userStatsCollection.updateOne(
      { userId: new ObjectId(userId) },
      {
        $inc: { totalStaked: stake.amount },
        $set: { updatedAt: new Date() },
      }
    );

    return NextResponse.json({
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
    });
  } catch (error) {
    console.error("Staking error:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: "Staking failed" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
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
        { error: "Unauthorized. Please sign in to view your stake." },
        { status: 401 }
      );
    }

    // Get current stake
    const stakesCollection = await getCollection("stakes");
    const challengesCollection = await getCollection("challenges");
    const submissionsCollection = await getCollection("submissions");

    const stake = await stakesCollection.findOne({
      userId: new ObjectId(userId),
      status: "ACTIVE",
    });

    if (!stake) {
      return NextResponse.json({
        success: true,
        stake: null,
      });
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

    return NextResponse.json({
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
    });
  } catch (error) {
    console.error("Get stake error:", error);
    return NextResponse.json({ error: "Failed to get stake" }, { status: 500 });
  }
}
