"use client";

import { Footer } from "@/components/footer";
import { Navbar } from "@/components/navbar";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserAvatar } from "@/components/user-avatar";
import {
  Award,
  CheckCircle2,
  Clock,
  Code,
  Coins,
  Loader2,
  Medal,
  Search,
  Star,
  Trophy,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";

interface UserStats {
  totalChallengesCompleted: number;
  totalScore: number;
  averageScore: number;
  currentStreak: number;
  longestStreak: number;
  totalStaked: number;
  totalRewards: number;
  rank: number;
}

interface LeaderboardUser {
  id: string;
  name: string;
  username: string;
  avatar: string;
  rank: number;
  tier: string;
  stats: UserStats;
  badges?: string[];
  isCurrentUser?: boolean;
}

interface LeaderboardData {
  users: LeaderboardUser[];
  currentUser: LeaderboardUser | null;
  stats: {
    totalUsers: number;
    totalChallenges: number;
    totalSubmissions: number;
    totalStaked: number;
    completionRate: number;
  };
}

export default function Leaderboard() {
  const [leaderboardData, setLeaderboardData] =
    useState<LeaderboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [timeFilter, setTimeFilter] = useState("all-time");
  const [categoryFilter, setCategoryFilter] = useState("score");

  useEffect(() => {
    fetchLeaderboardData();
  }, [timeFilter, categoryFilter]);

  const fetchLeaderboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        timeFilter,
        categoryFilter,
        limit: "50",
      });

      const response = await fetch(`/api/leaderboard?${params}`);
      const data = await response.json();

      if (response.ok) {
        setLeaderboardData(data.data);
      } else {
        throw new Error(data.error || "Failed to fetch leaderboard data");
      }
    } catch (err) {
      console.error("Error fetching leaderboard:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch data");
      setLeaderboardData(null);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers =
    leaderboardData?.users.filter(
      (user) =>
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.username.toLowerCase().includes(searchQuery.toLowerCase())
    ) || [];

  const getTierColor = (tier: string) => {
    switch (tier.toLowerCase()) {
      case "diamond":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      case "platinum":
        return "bg-gray-500/20 text-gray-400 border-gray-500/30";
      case "gold":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      case "silver":
        return "bg-gray-400/20 text-gray-400 border-gray-400/30";
      case "bronze":
        return "bg-orange-500/20 text-orange-400 border-orange-500/30";
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div
          className="min-h-screen pt-20 flex items-center justify-center"
          style={{ backgroundColor: "#0B0121" }}
        >
          <div className="flex flex-col items-center space-y-4">
            <Loader2 className="h-10 w-10 animate-spin text-white" />
            <span className="text-white/70 font-montserrat">
              Loading leaderboard...
            </span>
          </div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Navbar />
        <div
          className="min-h-screen pt-20 flex items-center justify-center px-4"
          style={{ backgroundColor: "#0B0121" }}
        >
          <Card className="border border-red-500/30 max-w-md text-center animate-fade-in-up bg-white/5">
            <CardContent className="p-8">
              <Trophy className="h-16 w-16 text-red-400 mx-auto mb-4" />
              <h2 className="text-2xl font-montserrat font-bold mb-2 text-red-400 uppercase">
                Error Loading Leaderboard
              </h2>
              <p className="text-white/70 mb-4 font-montserrat">{error}</p>
              <button
                onClick={fetchLeaderboardData}
                className="bg-white text-gray-900 hover:bg-white/90 rounded-xl px-6 py-2 text-sm font-semibold font-montserrat shadow-lg transition-all duration-300 hover:scale-105"
              >
                Try Again
              </button>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  if (!leaderboardData) {
    return (
      <>
        <Navbar />
        <div
          className="min-h-screen pt-20 flex items-center justify-center px-4"
          style={{ backgroundColor: "#0B0121" }}
        >
          <Card className="border border-white/10 max-w-md text-center animate-fade-in-up bg-white/5">
            <CardContent className="p-8">
              <Trophy className="h-16 w-16 text-white mx-auto mb-4" />
              <h2 className="text-2xl font-montserrat font-bold mb-2 text-white uppercase">
                No Leaderboard Data
              </h2>
              <p className="text-white/70 font-montserrat">
                No leaderboard data available. Please try again later.
              </p>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div
        className="min-h-screen pt-20"
        style={{ backgroundColor: "#0B0121" }}
      >
        {/* Hero Section */}
        <div className="relative py-12 px-4 sm:px-6 lg:px-8 mb-8">
          <div className="container mx-auto max-w-7xl">
            <div className="text-center space-y-4 animate-fade-in-up">
              <div className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full border border-white/20 mb-4 bg-white/10">
                <Trophy className="h-4 w-4 text-white" />
                <span className="text-sm font-medium text-white font-montserrat">
                  Leaderboard
                </span>
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-montserrat font-bold uppercase leading-[1.1]">
                <span className="block bg-gradient-to-r from-white via-white/95 to-white/85 bg-clip-text text-transparent">
                  Compete & Climb
                </span>
                <br />
                <span className="block bg-gradient-to-r from-white via-white/95 to-white/85 bg-clip-text text-transparent">
                  The Ranks
                </span>
              </h1>
              <p className="text-lg md:text-xl text-white/70 max-w-2xl mx-auto font-montserrat">
                See how you rank against other developers. Complete challenges
                to earn points and climb the leaderboard.
              </p>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl pb-12">
          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="border border-blue-500/30 hover:border-blue-500/50 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-blue-500/10 animate-fade-in-up group bg-white/5">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-gradient-to-br from-blue-500/20 to-blue-600/10 rounded-xl group-hover:scale-110 transition-transform">
                    <Users className="h-6 w-6 text-blue-400" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-white/60 font-montserrat">
                      Total Users
                    </p>
                    <p className="text-2xl font-bold text-blue-400 font-montserrat">
                      {leaderboardData.stats.totalUsers}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card
              className="border border-green-500/30 hover:border-green-500/50 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-green-500/10 animate-fade-in-up group bg-white/5"
              style={{ animationDelay: "0.1s" }}
            >
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-gradient-to-br from-green-500/20 to-green-600/10 rounded-xl group-hover:scale-110 transition-transform">
                    <Code className="h-6 w-6 text-green-400" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-white/60 font-montserrat">
                      Total Challenges
                    </p>
                    <p className="text-2xl font-bold text-green-400 font-montserrat">
                      {leaderboardData.stats.totalChallenges}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card
              className="border border-white/10 hover:border-white/30 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-black/20 animate-fade-in-up group bg-white/5"
              style={{ animationDelay: "0.2s" }}
            >
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-gradient-to-br from-purple-500/20 to-purple-600/10 rounded-xl group-hover:scale-110 transition-transform">
                    <CheckCircle2 className="h-6 w-6 text-white" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-white/60 font-montserrat">
                      Total Submissions
                    </p>
                    <p className="text-2xl font-bold text-white font-montserrat">
                      {leaderboardData.stats.totalSubmissions}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card
              className="border border-yellow-500/30 hover:border-yellow-500/50 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-yellow-500/10 animate-fade-in-up group bg-white/5"
              style={{ animationDelay: "0.3s" }}
            >
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-gradient-to-br from-yellow-500/20 to-yellow-600/10 rounded-xl group-hover:scale-110 transition-transform">
                    <Coins className="h-6 w-6 text-yellow-400" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-white/60 font-montserrat">
                      Total Staked
                    </p>
                    <p className="text-2xl font-bold text-yellow-400 font-montserrat">
                      {leaderboardData.stats.totalStaked.toFixed(2)} ETH
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <div
            className="rounded-2xl border border-white/10 p-6 mb-8 animate-fade-in-up bg-white/5"
            style={{ animationDelay: "0.4s" }}
          >
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-white/40" />
                <Input
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 h-12 bg-white/5 border-white/10 rounded-xl focus:border-white/30 text-white placeholder:text-white/50"
                />
              </div>
              <Select value={timeFilter} onValueChange={setTimeFilter}>
                <SelectTrigger className="w-full sm:w-48 h-12 bg-white/5 border-white/10 rounded-xl text-white">
                  <SelectValue placeholder="Time Period" />
                </SelectTrigger>
                <SelectContent className="bg-white/5 border-white/10">
                  <SelectItem value="all-time">All Time</SelectItem>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full sm:w-48 h-12 bg-white/5 border-white/10 rounded-xl text-white">
                  <SelectValue placeholder="Sort By" />
                </SelectTrigger>
                <SelectContent className="bg-white/5 border-white/10">
                  <SelectItem value="score">Score</SelectItem>
                  <SelectItem value="challenges">Challenges</SelectItem>
                  <SelectItem value="success-rate">Success Rate</SelectItem>
                  <SelectItem value="eth-earned">ETH Earned</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Leaderboard Table */}
          <Card
            className="border border-white/10 animate-fade-in-up bg-white/5"
            style={{ animationDelay: "0.5s" }}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-2xl font-montserrat font-bold uppercase text-white">
                <Trophy className="h-6 w-6 text-white" />
                Top Performers
              </CardTitle>
              <CardDescription className="text-white/70 font-montserrat">
                Rankings based on {categoryFilter.replace("-", " ")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredUsers.length === 0 ? (
                <div className="text-center py-16">
                  <Trophy className="h-16 w-16 mx-auto mb-4 text-white/40" />
                  <h3 className="text-lg font-semibold mb-2 font-montserrat uppercase bg-gradient-to-r from-white via-white/95 to-white/85 bg-clip-text text-transparent">
                    No Users Found
                  </h3>
                  <p className="text-white/70 font-montserrat">
                    {searchQuery
                      ? "Try adjusting your search terms"
                      : "No users available"}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-white/10 hover:bg-white/5">
                        <TableHead className="font-semibold text-white font-montserrat">
                          Rank
                        </TableHead>
                        <TableHead className="font-semibold text-white font-montserrat">
                          User
                        </TableHead>
                        <TableHead className="font-semibold text-white font-montserrat">
                          Tier
                        </TableHead>
                        <TableHead className="font-semibold text-white font-montserrat">
                          Score
                        </TableHead>
                        <TableHead className="font-semibold text-white font-montserrat">
                          Challenges
                        </TableHead>
                        <TableHead className="font-semibold text-white font-montserrat">
                          Success Rate
                        </TableHead>
                        <TableHead className="font-semibold text-white font-montserrat">
                          ETH Staked
                        </TableHead>
                        <TableHead className="font-semibold text-white font-montserrat">
                          ETH Earned
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredUsers.map((user, index) => (
                        <TableRow
                          key={user.id}
                          className={`border-white/10 hover:bg-white/5 transition-colors ${
                            user.isCurrentUser
                              ? "bg-white/10 border-white/20"
                              : ""
                          } animate-fade-in-up`}
                          style={{ animationDelay: `${0.6 + index * 0.02}s` }}
                        >
                          <TableCell className="font-semibold text-white font-montserrat">
                            <div className="flex items-center gap-2">
                              {user.rank <= 3 && (
                                <Medal
                                  className={`h-5 w-5 ${
                                    user.rank === 1
                                      ? "text-yellow-400"
                                      : user.rank === 2
                                      ? "text-gray-400"
                                      : "text-orange-400"
                                  }`}
                                />
                              )}
                              <span
                                className={
                                  user.rank <= 3
                                    ? "bg-gradient-to-r from-white via-white/95 to-white/85 bg-clip-text text-transparent font-bold"
                                    : "text-white"
                                }
                              >
                                {user.rank}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <UserAvatar
                                name={user.name}
                                src={user.avatar}
                                size="sm"
                              />
                              <div>
                                <p className="font-medium text-white font-montserrat">
                                  {user.name}
                                </p>
                                <p className="text-sm text-white/60 font-montserrat">
                                  @{user.username}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge
                              className={`${getTierColor(
                                user.tier
                              )} border bg-white/10 border-white/20 text-white`}
                            >
                              {user.tier}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-semibold text-white font-montserrat">
                            {user.stats.totalScore.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-white font-montserrat">
                            {user.stats.totalChallengesCompleted}
                          </TableCell>
                          <TableCell className="text-white font-montserrat">
                            {user.stats.averageScore}%
                          </TableCell>
                          <TableCell className="font-mono text-white font-montserrat">
                            {user.stats.totalStaked.toFixed(2)} ETH
                          </TableCell>
                          <TableCell className="font-mono text-green-400 font-montserrat">
                            {user.stats.totalRewards.toFixed(2)} ETH
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        <Footer />
      </div>
    </>
  );
}
