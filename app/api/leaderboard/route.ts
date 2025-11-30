import { getCollection } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const timeFilter = searchParams.get("timeFilter") || "all-time";
    const categoryFilter = searchParams.get("categoryFilter") || "score";
    const limit = parseInt(searchParams.get("limit") || "50");

    const usersCollection = await getCollection("users");
    const userStatsCollection = await getCollection("userStats");
    const submissionsCollection = await getCollection("submissions");
    const stakesCollection = await getCollection("stakes");

    // Get all users with their stats
    const users = await usersCollection.find({ isActive: true }).toArray();

    const usersWithStats = await Promise.all(
      users.map(async (user) => {
        let stats = await userStatsCollection.findOne({
          userId: user._id,
        });

        // ALWAYS get all-time staked data from stakes collection
        // This ensures we show correct all-time staking regardless of time filter
        // We sum all stakes ever made (ACTIVE, COMPLETED, CANCELLED) to get total all-time staked
        // Try both ObjectId and string userId to handle any type mismatches
        const allTimeStakes = await stakesCollection
          .find({
            $or: [
              { userId: user._id }, // ObjectId match
              { userId: user._id.toString() }, // String match (fallback)
            ],
            status: { $in: ["ACTIVE", "COMPLETED", "CANCELLED"] }, // Include all stake statuses
          })
          .toArray();

        // Log for debugging
        if (allTimeStakes.length > 0) {
          console.log(
            `User ${user._id} (${user.name}): Found ${allTimeStakes.length} stakes`,
            allTimeStakes.map((s) => ({ amount: s.amount, status: s.status }))
          );
        }

        // Calculate total staked from all stakes (all-time)
        let totalStakedFromStakes = 0;
        for (const stake of allTimeStakes) {
          let amount = 0;
          if (typeof stake.amount === "number") {
            amount = stake.amount;
          } else if (typeof stake.amount === "string") {
            amount = parseFloat(stake.amount) || 0;
          } else if (stake.amount != null) {
            amount = Number(stake.amount) || 0;
          }

          if (isNaN(amount) || amount < 0) {
            console.warn(
              `Invalid stake amount for user ${user._id}, stake ${stake._id}:`,
              stake.amount
            );
            amount = 0;
          }

          totalStakedFromStakes += amount;
        }
        totalStakedFromStakes = Math.round(totalStakedFromStakes * 100) / 100;

        // Calculate stats directly from source collections if userStats is missing or incorrect
        // This ensures we always show accurate data
        let totalChallengesCompleted = 0;
        let totalScore = 0;
        let totalRewards = 0;

        // Get all accepted submissions to calculate real stats
        // Try both ObjectId and string userId to handle any type mismatches
        const allSubmissions = await submissionsCollection
          .find({
            $or: [
              { userId: user._id }, // ObjectId match
              { userId: user._id.toString() }, // String match (fallback)
            ],
            status: "ACCEPTED",
          })
          .toArray();

        // Log for debugging
        if (allSubmissions.length > 0) {
          console.log(
            `User ${user._id} (${user.name}): Found ${allSubmissions.length} accepted submissions`,
            allSubmissions.map((s) => ({
              score: s.score,
              challengeId: s.challengeId,
            }))
          );
        }

        totalChallengesCompleted = allSubmissions.length;
        totalScore = allSubmissions.reduce((sum, sub) => {
          const score =
            typeof sub.score === "number"
              ? sub.score
              : parseFloat(sub.score || 0) || 0;
          return sum + (isNaN(score) ? 0 : score);
        }, 0);

        // Calculate total rewards from completed stakes
        const completedStakes = allTimeStakes.filter(
          (s) => s.status === "COMPLETED"
        );
        totalRewards = completedStakes.reduce((sum, stake) => {
          const reward =
            typeof stake.reward === "number"
              ? stake.reward
              : parseFloat(stake.reward || 0) || 0;
          return sum + (isNaN(reward) ? 0 : reward);
        }, 0);

        // Use calculated values from source collections as primary source
        // Only use userStats if it exists and matches (for performance)
        // But always prefer calculated values to ensure accuracy
        const calculatedStats = {
          totalChallengesCompleted,
          totalScore,
          totalStaked: totalStakedFromStakes,
          totalRewards,
          averageScore:
            totalChallengesCompleted > 0
              ? Math.round((totalScore / totalChallengesCompleted) * 100) / 100
              : 0,
          // Keep streaks from existing stats (not calculated from submissions)
          currentStreak: stats?.currentStreak || 0,
          longestStreak: stats?.longestStreak || 0,
        };

        // Store original stats for streaks before updating
        const originalStats = stats;

        // Always use calculated values from source collections (most accurate)
        // Update userStats to keep it in sync for future queries
        // Use upsert to create if doesn't exist, update if it does
        const needsUpdate =
          !stats ||
          Math.abs(
            (stats.totalChallengesCompleted || 0) - totalChallengesCompleted
          ) > 0 ||
          Math.abs((stats.totalScore || 0) - totalScore) > 0 ||
          Math.abs((stats.totalStaked || 0) - totalStakedFromStakes) > 0.01 ||
          Math.abs((stats.totalRewards || 0) - totalRewards) > 0.01;

        if (needsUpdate) {
          if (stats) {
            console.log(
              `Updating userStats for user ${user._id} (${user.name}):`,
              {
                old: {
                  challenges: stats.totalChallengesCompleted,
                  score: stats.totalScore,
                  staked: stats.totalStaked,
                  rewards: stats.totalRewards,
                },
                new: {
                  challenges: totalChallengesCompleted,
                  score: totalScore,
                  staked: totalStakedFromStakes,
                  rewards: totalRewards,
                },
              }
            );
          } else {
            console.log(
              `Creating userStats for user ${user._id} (${user.name}):`,
              calculatedStats
            );
          }

          // Use upsert to create or update
          await userStatsCollection.updateOne(
            { userId: user._id },
            {
              $set: {
                ...calculatedStats,
                updatedAt: new Date(),
                ...(stats
                  ? {}
                  : {
                      lastActiveAt: new Date(),
                      createdAt: new Date(),
                    }),
              },
            },
            { upsert: true } // Create if doesn't exist
          );
        }

        // Use calculated stats for display (from source collections)
        // We'll use calculatedStats directly in finalStats

        // Calculate recent activity based on time filter (only for submissions, not staking)
        let recentSubmissions = [];
        let recentScore = 0;
        let recentChallengesCompleted = 0;

        if (timeFilter !== "all-time") {
          const timeFilterDate = new Date();
          switch (timeFilter) {
            case "daily":
              timeFilterDate.setDate(timeFilterDate.getDate() - 1);
              break;
            case "weekly":
              timeFilterDate.setDate(timeFilterDate.getDate() - 7);
              break;
            case "monthly":
              timeFilterDate.setMonth(timeFilterDate.getMonth() - 1);
              break;
          }

          recentSubmissions = await submissionsCollection
            .find({
              $or: [
                { userId: user._id }, // ObjectId match
                { userId: user._id.toString() }, // String match (fallback)
              ],
              submittedAt: { $gte: timeFilterDate },
              status: "ACCEPTED",
            })
            .toArray();

          // Calculate recent stats for time-filtered view
          recentScore = recentSubmissions.reduce(
            (sum, sub) => sum + (sub.score || 0),
            0
          );
          recentChallengesCompleted = recentSubmissions.length;
        }

        // Always use calculated stats from source collections (most accurate)
        // Use original stats for streaks (not calculated from submissions)
        const finalStats = {
          totalChallengesCompleted:
            timeFilter !== "all-time"
              ? recentChallengesCompleted
              : totalChallengesCompleted,
          totalScore: timeFilter !== "all-time" ? recentScore : totalScore,
          averageScore:
            timeFilter !== "all-time" && recentChallengesCompleted > 0
              ? Math.round((recentScore / recentChallengesCompleted) * 100) /
                100
              : calculatedStats.averageScore,
          currentStreak: originalStats?.currentStreak || 0,
          longestStreak: originalStats?.longestStreak || 0,
          totalStaked: totalStakedFromStakes, // Always all-time from stakes collection
          totalRewards: totalRewards, // Always all-time from completed stakes
          rank: 999,
        };

        return {
          id: user._id.toString(),
          name: user.name || "Anonymous",
          username: user.username || `user_${user._id.toString().slice(-6)}`,
          avatar: user.image || null,
          email: user.email,
          walletAddress: user.walletAddress,
          role: user.role,
          stats: finalStats,
          recentSubmissions: recentSubmissions.length,
        };
      })
    );

    // Sort users based on category filter
    let sortedUsers = usersWithStats;
    switch (categoryFilter) {
      case "score":
        sortedUsers = usersWithStats.sort(
          (a, b) => b.stats.totalScore - a.stats.totalScore
        );
        break;
      case "challenges":
        sortedUsers = usersWithStats.sort(
          (a, b) =>
            b.stats.totalChallengesCompleted - a.stats.totalChallengesCompleted
        );
        break;
      case "success-rate":
        sortedUsers = usersWithStats.sort(
          (a, b) => b.stats.averageScore - a.stats.averageScore
        );
        break;
      case "dojo-earned":
        sortedUsers = usersWithStats.sort(
          (a, b) => b.stats.totalRewards - a.stats.totalRewards
        );
        break;
    }

    // Assign ranks
    const rankedUsers = sortedUsers.map((user, index) => ({
      ...user,
      rank: index + 1,
      tier: getTierFromScore(user.stats.totalScore),
    }));

    // Get current user (in real app, get from session/auth)
    const currentUser = null; // TODO: Implement proper user session handling

    // Calculate statistics
    const totalUsers = rankedUsers.length;
    const totalChallenges = await (
      await getCollection("challenges")
    ).countDocuments({ isActive: true });

    // Calculate total submissions based on time filter
    let totalSubmissions;
    if (timeFilter !== "all-time") {
      const timeFilterDate = new Date();
      switch (timeFilter) {
        case "daily":
          timeFilterDate.setDate(timeFilterDate.getDate() - 1);
          break;
        case "weekly":
          timeFilterDate.setDate(timeFilterDate.getDate() - 7);
          break;
        case "monthly":
          timeFilterDate.setMonth(timeFilterDate.getMonth() - 1);
          break;
      }
      totalSubmissions = await submissionsCollection.countDocuments({
        status: "ACCEPTED",
        submittedAt: { $gte: timeFilterDate },
      });
    } else {
      totalSubmissions = await submissionsCollection.countDocuments({
        status: "ACCEPTED",
      });
    }

    // ALWAYS calculate total staked from all stakes (all-time, regardless of time filter)
    const allStakes = await stakesCollection
      .find({
        status: { $in: ["ACTIVE", "COMPLETED", "CANCELLED"] },
      })
      .toArray();

    let totalStaked = 0;
    for (const stake of allStakes) {
      // Handle different data types (number, string, etc.)
      let amount = 0;
      if (typeof stake.amount === "number") {
        amount = stake.amount;
      } else if (typeof stake.amount === "string") {
        amount = parseFloat(stake.amount) || 0;
      } else if (stake.amount != null) {
        amount = Number(stake.amount) || 0;
      }

      // Ensure amount is valid and positive
      if (!isNaN(amount) && amount >= 0) {
        totalStaked += amount;
      }
    }

    // Round to 2 decimal places to avoid floating point issues
    totalStaked = Math.round(totalStaked * 100) / 100;

    return NextResponse.json({
      success: true,
      data: {
        users: rankedUsers.slice(0, limit),
        currentUser,
        stats: {
          totalUsers,
          totalChallenges,
          totalSubmissions,
          totalStaked,
          completionRate:
            totalSubmissions > 0
              ? Math.round(
                  (totalSubmissions / (totalUsers * totalChallenges)) * 100
                )
              : 0,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching leaderboard:", error);
    return NextResponse.json(
      { error: "Failed to fetch leaderboard data" },
      { status: 500 }
    );
  }
}

function getTierFromScore(score: number): string {
  if (score >= 8000) return "Diamond";
  if (score >= 6000) return "Platinum";
  if (score >= 4000) return "Gold";
  if (score >= 2000) return "Silver";
  return "Bronze";
}
