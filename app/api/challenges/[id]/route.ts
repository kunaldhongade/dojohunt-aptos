import { getCollection } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const challengesCollection = await getCollection("challenges");
    const challenge = await challengesCollection.findOne({
      _id: new ObjectId(id),
    });

    if (!challenge) {
      return NextResponse.json(
        { error: "Challenge not found" },
        { status: 404 }
      );
    }

    // Calculate completion rate (mock for now)
    const completionRate = Math.floor(Math.random() * 50) + 20; // 20-70%

    return NextResponse.json({
      success: true,
      challenge: {
        ...challenge,
        id: challenge._id.toString(),
        completionRate,
      },
    });
  } catch (error) {
    console.error("Error fetching challenge:", error);

    // Return proper error response instead of fallback data
    return NextResponse.json(
      {
        error: "Failed to fetch challenge from database",
        message: "Database connection failed. Please try again later.",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Validate ObjectId format
    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Invalid challenge ID format" },
        { status: 400 }
      );
    }

    const challengesCollection = await getCollection("challenges");
    const objectId = new ObjectId(id);

    // Check if challenge exists
    const challenge = await challengesCollection.findOne({ _id: objectId });
    if (!challenge) {
      return NextResponse.json(
        { error: "Challenge not found" },
        { status: 404 }
      );
    }

    // Permanently delete the challenge from database
    const result = await challengesCollection.deleteOne({ _id: objectId });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: "Failed to delete challenge" },
        { status: 500 }
      );
    }

    // Also delete related submissions if they exist
    try {
      const submissionsCollection = await getCollection("submissions");
      await submissionsCollection.deleteMany({ challengeId: id });
    } catch (submissionError) {
      // Log but don't fail if submissions collection doesn't exist or has issues
      console.warn("Could not delete related submissions:", submissionError);
    }

    return NextResponse.json({
      success: true,
      message: "Challenge permanently deleted from database",
      deletedId: id,
    });
  } catch (error) {
    console.error("Error deleting challenge:", error);
    return NextResponse.json(
      {
        error: "Failed to delete challenge from database",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
