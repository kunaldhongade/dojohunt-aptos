import { getCollection } from "@/lib/mongodb";
import { hash } from "bcryptjs";
import { ObjectId } from "mongodb";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { name, email, username, password, walletAddress } =
      await request.json();

    // Validate required fields
    if (!name || !email || !username || !password) {
      return NextResponse.json(
        { error: "Name, email, username, and password are required" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Please enter a valid email address" },
        { status: 400 }
      );
    }

    // Validate username format
    if (username.length < 3) {
      return NextResponse.json(
        { error: "Username must be at least 3 characters long" },
        { status: 400 }
      );
    }

    // Validate password strength
    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters long" },
        { status: 400 }
      );
    }

    // Validate wallet address if provided
    if (walletAddress && !/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
      return NextResponse.json(
        { error: "Please enter a valid Ethereum wallet address" },
        { status: 400 }
      );
    }

    const usersCollection = await getCollection("users");
    const userStatsCollection = await getCollection("userStats");

    // Check if user already exists
    const existingUser = await usersCollection.findOne({
      $or: [
        { email: email.toLowerCase() },
        { username: username.toLowerCase() },
        ...(walletAddress ? [{ walletAddress }] : []),
      ],
    });

    if (existingUser) {
      if (existingUser.email === email.toLowerCase()) {
        return NextResponse.json(
          { error: "An account with this email already exists" },
          { status: 409 }
        );
      }
      if (existingUser.username === username.toLowerCase()) {
        return NextResponse.json(
          { error: "This username is already taken" },
          { status: 409 }
        );
      }
      if (existingUser.walletAddress === walletAddress) {
        return NextResponse.json(
          { error: "This wallet address is already registered" },
          { status: 409 }
        );
      }
    }

    // Hash password
    const hashedPassword = await hash(password, 12);

    // Create user
    const userData = {
      name: name.trim(),
      email: email.toLowerCase().trim(),
      username: username.toLowerCase().trim(),
      password: hashedPassword,
      role: "USER",
      isActive: true,
      ...(walletAddress && { walletAddress }),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const userResult = await usersCollection.insertOne(userData);
    const userId = userResult.insertedId;

    // Create user stats
    const userStatsData = {
      userId,
      totalChallengesCompleted: 0,
      totalScore: 0,
      averageScore: 0,
      currentStreak: 0,
      longestStreak: 0,
      totalStaked: 0,
      totalRewards: 0,
      rank: 999,
      lastActiveAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await userStatsCollection.insertOne(userStatsData);

    // Return success (don't include password)
    const { password: _, ...userWithoutPassword } = userData;
    return NextResponse.json({
      success: true,
      message: "Account created successfully",
      user: {
        id: userId.toString(),
        ...userWithoutPassword,
      },
    });
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Failed to create account. Please try again." },
      { status: 500 }
    );
  }
}
