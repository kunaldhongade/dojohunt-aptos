import { authOptions } from "@/lib/auth-options";
import { getUserIdFromRequest } from "@/lib/auth-utils";
import { getCollection } from "@/lib/mongodb";
import { AccountAddress } from "@aptos-labs/ts-sdk";
import { ObjectId } from "mongodb";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    // Get user ID from NextAuth session
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized. Please sign in." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { walletAddress } = body;

    if (!walletAddress || typeof walletAddress !== "string") {
      return NextResponse.json(
        { error: "Wallet address is required" },
        { status: 400 }
      );
    }

    // Validate Aptos address format
    try {
      AccountAddress.fromString(walletAddress);
    } catch (error) {
      return NextResponse.json(
        { error: "Invalid Aptos wallet address format" },
        { status: 400 }
      );
    }

    const usersCollection = await getCollection("users");

    // Find user by email
    const user = await usersCollection.findOne({
      email: session.user.email,
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if wallet address is already used by another user
    const existingUser = await usersCollection.findOne({
      walletAddress: walletAddress,
      _id: { $ne: user._id },
    });

    if (existingUser) {
      return NextResponse.json(
        {
          error:
            "This wallet address is already associated with another account",
        },
        { status: 409 }
      );
    }

    // Update wallet address
    await usersCollection.updateOne(
      { _id: user._id },
      {
        $set: {
          walletAddress: walletAddress,
          updatedAt: new Date(),
        },
      }
    );

    return NextResponse.json({
      success: true,
      message: "Wallet address updated successfully",
      walletAddress: walletAddress,
    });
  } catch (error) {
    console.error("Error updating wallet address:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
