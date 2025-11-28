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

    // Get all users with their stats
    const users = await usersCollection.find({ isActive: true }).toArray();

    const usersWithStats = await Promise.all(
      users.map(async (user) => {
        const stats = await userStatsCollection.findOne({
          userId: user._id,
        });

        // Calculate recent activity based on time filter
        let recentSubmissions = [];
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
              userId: user._id,
              submittedAt: { $gte: timeFilterDate },
              status: "ACCEPTED",
            })
            .toArray();
        }

        return {
          id: user._id.toString(),
          name: user.name || "Anonymous",
          username: user.username || `user_${user._id.toString().slice(-6)}`,
          avatar: user.image || null,
          email: user.email,
          walletAddress: user.walletAddress,
          role: user.role,
          stats: stats || {
            totalChallengesCompleted: 0,
            totalScore: 0,
            averageScore: 0,
            currentStreak: 0,
            longestStreak: 0,
            totalStaked: 0,
            totalRewards: 0,
            rank: 999,
          },
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
      case "eth-earned":
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
    const totalSubmissions = await submissionsCollection.countDocuments({
      status: "ACCEPTED",
    });
    const totalStaked = rankedUsers.reduce(
      (sum, user) => sum + user.stats.totalStaked,
      0
    );

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
