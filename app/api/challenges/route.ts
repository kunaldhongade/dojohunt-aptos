import { getUserIdFromRequest } from "@/lib/auth-utils";
import { getCollection } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const querySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  difficulty: z.string().optional(),
  category: z.string().optional(),
  search: z.string().optional(),
  admin: z.coerce.boolean().optional(), // Admin mode: show all challenges including unpublished
});

interface ChallengeWithStats {
  _id?: any;
  id: string; // Add id field for frontend compatibility
  title: string;
  description: string;
  problem: string;
  difficulty: string;
  category: string;
  constraints: string[];
  examples: any[];
  testCases: any[];
  starterCode: string;
  solutionCode: string;
  timeLimit: number;
  memoryLimit: number;
  points: number;
  tags: string[];
  isActive: boolean;
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
  completionRate?: number;
  isCompleted?: boolean;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = querySchema.parse({
      page: searchParams.get("page") || "1",
      limit: searchParams.get("limit") || "10",
      difficulty: searchParams.get("difficulty") || undefined,
      category: searchParams.get("category") || undefined,
      search: searchParams.get("search") || undefined,
      admin: searchParams.get("admin") || undefined,
    });

    const challengesCollection = await getCollection("challenges");

    // Build filter object
    // Admin mode: show all challenges (including unpublished/inactive)
    // Regular mode: only show published and active challenges
    const filter: any = query.admin
      ? {} // Admin sees everything
      : {
          isActive: true,
          isPublished: true,
        };

    if (query.difficulty) {
      filter.difficulty = query.difficulty;
    }

    if (query.category) {
      filter.category = query.category;
    }

    if (query.search) {
      filter.$or = [
        { title: { $regex: query.search, $options: "i" } },
        { description: { $regex: query.search, $options: "i" } },
        { tags: { $in: [new RegExp(query.search, "i")] } },
      ];
    }

    // Get total count
    const total = await challengesCollection.countDocuments(filter);

    // Get paginated results
    const skip = (query.page - 1) * query.limit;
    const challenges = await challengesCollection
      .find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(query.limit)
      .toArray();

    // Get user ID to check completion status
    let userId: string | null = null;
    try {
      userId = await getUserIdFromRequest(request);
    } catch (error) {
      // User not authenticated, continue without completion status
    }

    // Get completion status for user if authenticated
    let completedChallengeIds = new Set<string>();
    if (userId) {
      try {
        const submissionsCollection = await getCollection("submissions");
        const completedSubmissions = await submissionsCollection
          .find({
            userId: new ObjectId(userId),
            status: "ACCEPTED",
          })
          .project({ challengeId: 1 })
          .toArray();

        completedChallengeIds = new Set(
          completedSubmissions.map((sub) => sub.challengeId.toString())
        );
      } catch (error) {
        console.warn("Error fetching completion status:", error);
      }
    }

    // Calculate completion rates (mock for now - in real app, calculate from submissions)
    const challengesWithStats: ChallengeWithStats[] = challenges.map(
      (challenge) => {
        const challengeId = challenge._id.toString();
        return {
          ...challenge,
          id: challengeId, // Add id field for frontend compatibility
          completionRate: Math.floor(Math.random() * 50) + 20, // 20-70%
          isCompleted: userId ? completedChallengeIds.has(challengeId) : false,
        } as ChallengeWithStats & { isCompleted?: boolean };
      }
    );

    return NextResponse.json({
      success: true,
      data: {
        items: challengesWithStats,
        pagination: {
          page: query.page,
          limit: query.limit,
          total,
          totalPages: Math.ceil(total / query.limit),
          hasNext: query.page * query.limit < total,
          hasPrev: query.page > 1,
        },
      },
    });
  } catch (error) {
    console.error("Get challenges error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }

    // Return proper error response instead of fallback data
    return NextResponse.json(
      {
        error: "Failed to fetch challenges from database",
        message: "Database connection failed. Please try again later.",
      },
      { status: 500 }
    );
  }
}

const createChallengeSchema = z.object({
  title: z.string().min(1, "Title is required"),
  problem: z.string().min(1, "Problem statement is required"),
  difficulty: z.enum(["EASY", "MEDIUM", "HARD"]),
  category: z.string().min(1, "Category is required"),
  constraints: z
    .array(z.string())
    .min(1, "At least one constraint is required"),
  testCases: z
    .array(
      z.object({
        variables: z.record(z.any()), // Record<string, any> for variable inputs
        output: z.string(),
        explanation: z.string().optional(),
      })
    )
    .min(1, "At least one test case is required"),
  starterCode: z.string().min(1, "Starter code is required"),
  solutionCode: z.string().min(1, "Solution code is required"),
  timeLimit: z.number().min(100).max(10000),
  memoryLimit: z.number().min(64).max(512),
  points: z.number().min(10).max(1000),
  tags: z.array(z.string()).min(1, "At least one tag is required"),
  // Allow admin to control publish status
  isPublished: z.boolean().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const challengeData = createChallengeSchema.parse(body);

    const challengesCollection = await getCollection("challenges");

    const newChallenge = {
      ...challengeData,
      isActive: true,
      // Use provided value or default to draft
      isPublished: challengeData.isPublished ?? false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await challengesCollection.insertOne(newChallenge);

    return NextResponse.json({
      success: true,
      data: {
        id: result.insertedId.toString(),
        ...newChallenge,
      },
    });
  } catch (error) {
    console.error("Create challenge error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to create challenge" },
      { status: 500 }
    );
  }
}
