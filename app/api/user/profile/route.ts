import { getCollection } from "@/lib/mongodb";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const usersCollection = await getCollection("users");

    const user = await usersCollection.findOne({
      email: session.user.email,
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        username: user.username,
        walletAddress: user.walletAddress || "",
        bio: user.bio || "",
        role: user.role,
        profileComplete: !!user.username,
      },
    });
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { username, bio, walletAddress } = body;

    if (!username || username.trim().length < 3) {
      return NextResponse.json(
        { error: "Username is required and must be at least 3 characters" },
        { status: 400 }
      );
    }

    // Validate username format
    if (!/^[a-zA-Z0-9_]+$/.test(username.trim())) {
      return NextResponse.json(
        { error: "Username can only contain letters, numbers, and underscores" },
        { status: 400 }
      );
    }

    const usersCollection = await getCollection("users");

    // Check if username is already taken
    const existingUser = await usersCollection.findOne({
      username: username.trim(),
      email: { $ne: session.user.email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Username is already taken" },
        { status: 400 }
      );
    }

    // Update user profile
    const updateData: any = {
      username: username.trim(),
      profileComplete: true,
      updatedAt: new Date(),
    };

    if (bio !== undefined) {
      updateData.bio = bio.trim() || null;
    }

    if (walletAddress) {
      // Check if wallet address is already taken by another user
      const walletUser = await usersCollection.findOne({
        walletAddress: walletAddress,
        email: { $ne: session.user.email },
      });

      if (walletUser) {
        return NextResponse.json(
          { error: "Wallet address is already associated with another account" },
          { status: 400 }
        );
      }

      updateData.walletAddress = walletAddress;
    }

    const result = await usersCollection.updateOne(
      { email: session.user.email },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Create user stats if they don't exist
    const userStatsCollection = await getCollection("userStats");
    const user = await usersCollection.findOne({ email: session.user.email });
    
    if (user) {
      const existingStats = await userStatsCollection.findOne({ userId: user._id });
      if (!existingStats) {
        await userStatsCollection.insertOne({
          userId: user._id,
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
      }
    }

    return NextResponse.json({
      success: true,
      message: "Profile updated successfully",
    });
  } catch (error) {
    console.error("Error updating user profile:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

