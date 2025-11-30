import { getUserIdFromJWT, getUserIdFromRequest } from "@/lib/auth-utils";
import { CodeExecutor } from "@/lib/code-executor";
import { getCollection } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const submissionSchema = z.object({
  code: z.string().min(1, "Code is required"),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Get user ID from NextAuth session or JWT token
    // Try NextAuth session first (from cookies)
    let userId = await getUserIdFromRequest(request);

    // Fallback to JWT token from Authorization header (for backward compatibility)
    if (!userId) {
      const authHeader = request.headers.get("authorization");
      userId = getUserIdFromJWT(authHeader);
    }

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized. Please sign in to submit solutions." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { code } = submissionSchema.parse(body);

    // Get challenge
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

    // Validate code for security
    const validation = CodeExecutor.validateCode(code, "javascript");
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    // Check if user has already submitted this challenge successfully
    const submissionsCollection = await getCollection("submissions");
    const existingSubmission = await submissionsCollection.findOne({
      userId: new ObjectId(userId),
      challengeId: new ObjectId(id),
      status: "ACCEPTED",
    });

    if (existingSubmission) {
      return NextResponse.json(
        { error: "Challenge already completed" },
        { status: 400 }
      );
    }

    // Create submission record
    const submissionData = {
      userId: new ObjectId(userId),
      challengeId: new ObjectId(id),
      language: "JAVASCRIPT",
      code,
      status: "PENDING",
      testResults: [],
      submittedAt: new Date(),
    };

    const submissionResult = await submissionsCollection.insertOne(
      submissionData
    );
    const submission = { ...submissionData, _id: submissionResult.insertedId };

    // Log submission creation
    console.log("📝 [SUBMISSION] Creating submission record:", {
      userId: userId,
      userObjectId: new ObjectId(userId).toString(),
      challengeId: id,
      challengeObjectId: new ObjectId(id).toString(),
      submissionId: submissionResult.insertedId.toString(),
      status: "PENDING",
    });

    try {
      // Execute code
      const testCases = challenge.testCases as any[];
      const executionResult = await CodeExecutor.executeJavaScript(
        code,
        testCases
      );

      const submissionTestResults =
        executionResult.testResults?.map((result) => ({
          ...result,
          passed:
            "status" in result
              ? result.status === "passed"
              : Boolean((result as any).passed),
        })) ?? [];

      // Update submission with results
      const status = executionResult.success ? "ACCEPTED" : "WRONG_ANSWER";
      const score = executionResult.success ? 100 : 0;

      await submissionsCollection.updateOne(
        { _id: submission._id },
        {
          $set: {
            status,
            score,
            executionTime: executionResult.executionTime,
            testResults: submissionTestResults,
            completedAt: new Date(),
          },
        }
      );

      // If successful, update user stats and check stake completion
      if (executionResult.success) {
        console.log("✅ [SUBMISSION] Submission accepted:", {
          userId: userId,
          userObjectId: new ObjectId(userId).toString(),
          challengeId: id,
          challengeObjectId: new ObjectId(id).toString(),
          submissionId: submission._id.toString(),
          score: score,
          points: challenge.points,
        });
        await handleSuccessfulSubmission(userId, id, challenge.points);
      } else {
        console.log("❌ [SUBMISSION] Submission rejected:", {
          userId: userId,
          challengeId: id,
          submissionId: submission._id.toString(),
          status: status,
        });
      }

      return NextResponse.json({
        success: true,
        data: {
          submissionId: submission._id.toString(),
          status,
          executionTime: executionResult.executionTime,
          testResults: submissionTestResults,
          score,
          completedAt: new Date(),
        },
      });
    } catch (error) {
      // Update submission with error
      await submissionsCollection.updateOne(
        { _id: submission._id },
        {
          $set: {
            status: "RUNTIME_ERROR",
            errorMessage:
              error instanceof Error ? error.message : "Execution failed",
            completedAt: new Date(),
          },
        }
      );

      return NextResponse.json({
        success: false,
        error: "Code execution failed",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
  } catch (error) {
    console.error("Submission error:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: "Submission failed" }, { status: 500 });
  }
}

async function handleSuccessfulSubmission(
  userId: string,
  challengeId: string,
  points: number
) {
  const userStatsCollection = await getCollection("userStats");
  const userIdObj = new ObjectId(userId);

  // Update user stats
  const statsUpdateResult = await userStatsCollection.updateOne(
    { userId: userIdObj },
    {
      $inc: {
        totalChallengesCompleted: 1,
        totalScore: points,
      },
      $set: {
        lastActiveAt: new Date(),
        updatedAt: new Date(),
      },
    },
    { upsert: true } // Create if doesn't exist
  );

  console.log("📊 [SUBMISSION] Updated userStats:", {
    userId: userId,
    userObjectId: userIdObj.toString(),
    challengeId: challengeId,
    pointsAdded: points,
    matchedCount: statsUpdateResult.matchedCount,
    modifiedCount: statsUpdateResult.modifiedCount,
    upsertedId: statsUpdateResult.upsertedId?.toString(),
  });

  // Recalculate average score
  const userStats = await userStatsCollection.findOne({
    userId: userIdObj,
  });

  if (userStats) {
    const averageScore =
      userStats.totalScore / userStats.totalChallengesCompleted;
    await userStatsCollection.updateOne(
      { userId: userIdObj },
      {
        $set: {
          averageScore,
          updatedAt: new Date(),
        },
      }
    );
  }

  // Check if user has an active stake
  const stakesCollection = await getCollection("stakes");
  const challengesCollection = await getCollection("challenges");
  const submissionsCollection = await getCollection("submissions");

  const activeStake = await stakesCollection.findOne({
    userId: userIdObj,
    status: "ACTIVE",
  });

  if (!activeStake) return;

  // Get challenges for this stake
  const challenges = await challengesCollection
    .find({
      _id: { $in: activeStake.challengeIds },
    })
    .toArray();

  // Get completed submissions for this stake
  const submissions = await submissionsCollection
    .find({
      stakeId: activeStake._id,
      status: "ACCEPTED",
    })
    .toArray();

  // Check if this challenge is part of the stake
  const challengeIdObj = new ObjectId(challengeId);
  const isStakeChallenge = challenges.some((challenge) =>
    challenge._id.equals(challengeIdObj)
  );

  if (isStakeChallenge) {
    // Check if this is a new completion for this stake
    const isNewCompletion = !submissions.some((submission) =>
      submission.challengeId.equals(challengeIdObj)
    );

    if (isNewCompletion) {
      // Update stake progress
      await stakesCollection.updateOne(
        { _id: activeStake._id },
        {
          $inc: { challengesCompleted: 1 },
          $set: { updatedAt: new Date() },
        }
      );

      // Check if all challenges are completed
      const updatedStake = await stakesCollection.findOne({
        _id: activeStake._id,
      });

      if (
        updatedStake &&
        updatedStake.challengesCompleted >= updatedStake.challengesRequired
      ) {
        // Mark stake as completed
        await stakesCollection.updateOne(
          { _id: activeStake._id },
          {
            $set: {
              status: "COMPLETED",
              updatedAt: new Date(),
            },
          }
        );

        // TODO: Trigger unstaking process on blockchain
        // This would involve calling the smart contract to allow fee-free unstaking
      }
    }
  }

  // Create achievement if applicable
  await checkAndCreateAchievements(userId);
}

async function checkAndCreateAchievements(userId: string) {
  const userStatsCollection = await getCollection("userStats");
  const achievementsCollection = await getCollection("achievements");

  const userStats = await userStatsCollection.findOne({
    userId: new ObjectId(userId),
  });

  if (!userStats) return;

  const achievements = [];

  // First challenge completion
  if (userStats.totalChallengesCompleted === 1) {
    achievements.push({
      type: "FIRST_CHALLENGE",
      title: "First Steps",
      description: "Completed your first coding challenge",
      icon: "🎯",
    });
  }

  // 10 challenges completed
  if (userStats.totalChallengesCompleted === 10) {
    achievements.push({
      type: "TEN_CHALLENGES",
      title: "Getting Started",
      description: "Completed 10 coding challenges",
      icon: "🚀",
    });
  }

  // 50 challenges completed
  if (userStats.totalChallengesCompleted === 50) {
    achievements.push({
      type: "FIFTY_CHALLENGES",
      title: "Coding Warrior",
      description: "Completed 50 coding challenges",
      icon: "⚔️",
    });
  }

  // Perfect score achievement
  if (userStats.averageScore >= 95) {
    achievements.push({
      type: "PERFECT_SCORER",
      title: "Perfect Scorer",
      description: "Maintained an average score of 95% or higher",
      icon: "🏆",
    });
  }

  // Create achievements
  for (const achievement of achievements) {
    const existingAchievement = await achievementsCollection.findOne({
      userId: new ObjectId(userId),
      type: achievement.type,
    });

    if (!existingAchievement) {
      await achievementsCollection.insertOne({
        userId: new ObjectId(userId),
        ...achievement,
        earnedAt: new Date(),
      });
    }
  }
}
