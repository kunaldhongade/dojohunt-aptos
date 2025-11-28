import { createWalletMessage, verifyWalletSignature } from "@/lib/blockchain";
import { getCollection } from "@/lib/mongodb";
import { randomBytes } from "crypto";
import { sign } from "jsonwebtoken";
import { ObjectId } from "mongodb";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { walletAddress, signature, message } = await request.json();

    if (!walletAddress || !signature || !message) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Verify the signature
    const isValidSignature = verifyWalletSignature(
      message,
      signature,
      walletAddress
    );
    if (!isValidSignature) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    // Find or create user
    const usersCollection = await getCollection("users");
    const userStatsCollection = await getCollection("userStats");

    let user = await usersCollection.findOne({ walletAddress });

    if (!user) {
      // Create new user
      const newUser = {
        walletAddress,
        name: `User_${walletAddress.slice(0, 6)}`,
        username: `user_${walletAddress.slice(0, 6)}`,
        role: "USER",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const userResult = await usersCollection.insertOne(newUser);
      const userId = userResult.insertedId;

      // Create user stats
      await userStatsCollection.insertOne({
        userId,
        totalChallengesCompleted: 0,
        totalScore: 0,
        averageScore: 0,
        currentStreak: 0,
        longestStreak: 0,
        totalStaked: 0,
        totalRewards: 0,
        lastActiveAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      user = { ...newUser, _id: userId };
    }

    // Get user stats
    const userStats = await userStatsCollection.findOne({ userId: user._id });

    // Generate JWT token
    const token = sign(
      {
        userId: user._id.toString(),
        walletAddress: user.walletAddress,
        role: user.role,
      },
      process.env.JWT_SECRET!,
      { expiresIn: "7d" }
    );

    return NextResponse.json({
      success: true,
      token,
      user: {
        id: user._id.toString(),
        walletAddress: user.walletAddress,
        name: user.name,
        username: user.username,
        role: user.role,
        stats: userStats,
      },
    });
  } catch (error) {
    console.error("Wallet authentication error:", error);
    return NextResponse.json(
      { error: "Authentication failed" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const walletAddress = searchParams.get("walletAddress");

    if (!walletAddress) {
      return NextResponse.json(
        { error: "Wallet address required" },
        { status: 400 }
      );
    }

    // Generate nonce for signature
    const nonce = randomBytes(32).toString("hex");
    const message = createWalletMessage(nonce);

    return NextResponse.json({
      success: true,
      message,
      nonce,
    });
  } catch (error) {
    console.error("Get wallet message error:", error);
    return NextResponse.json(
      { error: "Failed to generate message" },
      { status: 500 }
    );
  }
}
