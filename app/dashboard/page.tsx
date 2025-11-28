"use client";

import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Activity,
  ArrowRight,
  Award,
  CheckCircle2,
  Clock,
  Code,
  Coins,
  ExternalLink,
  Loader2,
  Star,
  Target,
  TrendingUp,
  Trophy,
  Zap,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

interface Stake {
  id: string;
  amount: number;
  startTime: string;
  endTime: string;
  challengesRequired: number;
  challengesCompleted: number;
  status: string;
  challenges: Challenge[];
}

interface Challenge {
  id: string;
  title: string;
  description: string;
  difficulty: string;
  category: string;
  points: number;
}

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

export default function Dashboard() {
  const [stake, setStake] = useState<Stake | null>(null);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch current stake
      const stakeResponse = await fetch("/api/staking/stake", {
        credentials: "include",
      });

      if (stakeResponse.ok) {
        const stakeData = await stakeResponse.json();
        setStake(stakeData.stake);
      }

      // Set user stats to null if no real data available
      setUserStats(null);
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
      setError("Failed to load dashboard data");
      setStake(null);
    } finally {
      setLoading(false);
    }
  };

  const getTimeRemaining = (endTime: string) => {
    const now = new Date();
    const end = new Date(endTime);
    const diff = end.getTime() - now.getTime();

    if (diff <= 0) return "Expired";

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    return `${days}d ${hours}h ${minutes}m`;
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case "easy":
        return "bg-green-500/20 text-green-400 border-green-500/30";
      case "medium":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      case "hard":
        return "bg-red-500/20 text-red-400 border-red-500/30";
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen pt-20 pb-12">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-center py-24">
              <div className="flex flex-col items-center space-y-4">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <span className="text-foreground/70">Loading your dashboard...</span>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen pt-20 pb-12">
        {/* Hero Section */}
        <div className="relative py-12 px-4 sm:px-6 lg:px-8">
          <div className="container mx-auto max-w-7xl">
            <div className="flex flex-col space-y-6 animate-fade-in-up">
              <div className="flex items-center space-x-4">
                <div className="p-3 glass-strong rounded-2xl border-border/50">
                  <Trophy className="h-7 w-7 text-primary" />
                </div>
                <div>
                  <h1 className="text-4xl md:text-5xl font-display font-bold">
                    <span className="text-gradient">Welcome back,</span>
                    <br />
                    <span className="text-gradient">Coder!</span>
                  </h1>
                  <p className="text-foreground/70 mt-2 text-lg">
                    Ready to tackle your next challenge?
                  </p>
                </div>
              </div>

              {error && (
                <div className="glass-strong border-red-500/30 p-4 text-red-400 rounded-xl animate-fade-in">
                  {error}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          {/* Stats Overview */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
            <Card className="glass-strong border-border/50 hover:border-border/70 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-black/20 animate-fade-in-up group">
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <CardTitle className="text-sm font-semibold text-primary">
                  Current Stake
                </CardTitle>
                <div className="p-2 bg-gradient-to-br from-purple-500/20 to-purple-600/10 rounded-lg group-hover:scale-110 transition-transform">
                  <Coins className="h-5 w-5 text-primary" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gradient mb-2">
                  {stake ? `${stake.amount} ETH` : "0 ETH"}
                </div>
                <p className="text-xs text-foreground/60">
                  {stake
                    ? `Staked for ${stake.challengesRequired} days`
                    : "Start a new stake to begin"}
                </p>
                {stake && (
                  <div className="mt-4 flex items-center space-x-2 text-xs text-primary">
                    <Activity className="h-3 w-3" />
                    <span>Active Staking</span>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="glass-strong border-green-500/30 hover:border-green-500/50 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-green-500/10 animate-fade-in-up group" style={{ animationDelay: "0.1s" }}>
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <CardTitle className="text-sm font-semibold text-green-400">
                  Challenge Progress
                </CardTitle>
                <div className="p-2 bg-gradient-to-br from-green-500/20 to-green-600/10 rounded-lg group-hover:scale-110 transition-transform">
                  <Target className="h-5 w-5 text-green-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-400 mb-2">
                  {stake
                    ? `${stake.challengesCompleted}/${stake.challengesRequired}`
                    : "0/0"}
                </div>
                <p className="text-xs text-foreground/60 mb-3">
                  Challenges completed
                </p>
                {stake && (
                  <div className="space-y-2">
                    <Progress
                      value={
                        (stake.challengesCompleted / stake.challengesRequired) * 100
                      }
                      className="h-2 bg-green-500/20"
                    />
                    <p className="text-xs text-green-400 font-semibold">
                      {Math.round(
                        (stake.challengesCompleted / stake.challengesRequired) * 100
                      )}
                      % Complete
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="glass-strong border-orange-500/30 hover:border-orange-500/50 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-orange-500/10 animate-fade-in-up group" style={{ animationDelay: "0.2s" }}>
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <CardTitle className="text-sm font-semibold text-orange-400">
                  Time Remaining
                </CardTitle>
                <div className="p-2 bg-gradient-to-br from-orange-500/20 to-orange-600/10 rounded-lg group-hover:scale-110 transition-transform">
                  <Clock className="h-5 w-5 text-orange-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-orange-400 mb-2">
                  {stake ? getTimeRemaining(stake.endTime) : "N/A"}
                </div>
                <p className="text-xs text-foreground/60">
                  {stake && stake.challengesCompleted < stake.challengesRequired
                    ? `Complete ${
                        stake.challengesRequired - stake.challengesCompleted
                      } more challenges`
                    : "All challenges completed!"}
                </p>
              </CardContent>
            </Card>

            <Card className="glass-strong border-border/50 hover:border-border/70 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-black/20 animate-fade-in-up group" style={{ animationDelay: "0.3s" }}>
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <CardTitle className="text-sm font-semibold text-primary">
                  Your Rank
                </CardTitle>
                <div className="p-2 bg-gradient-to-br from-purple-500/20 to-purple-600/10 rounded-lg group-hover:scale-110 transition-transform">
                  <TrendingUp className="h-5 w-5 text-primary" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gradient mb-2">
                  #{userStats?.rank || "N/A"}
                </div>
                <p className="text-xs text-foreground/60 mb-3">
                  {userStats?.totalScore || 0} total points
                </p>
                <div className="flex items-center space-x-2 text-xs text-primary">
                  <Star className="h-3 w-3" />
                  <span>{userStats?.currentStreak || 0} day streak</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <div className="mb-8 animate-fade-in-up" style={{ animationDelay: "0.4s" }}>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/challenges" className="flex-1">
                <Button className="w-full h-14 gradient-purple hover:opacity-90 rounded-xl text-base font-semibold shadow-lg shadow-primary/30 hover:shadow-primary/50 transition-all duration-200 hover:scale-105">
                  <Code className="mr-2 h-5 w-5" />
                  Browse All Challenges
                </Button>
              </Link>
              <Link href="/staking" className="flex-1">
                <Button
                  variant="outline"
                  className="w-full h-14 glass-strong hover:glass border-border/50 hover:border-border/70 rounded-xl transition-all duration-200 hover:scale-105"
                >
                  <Coins className="mr-2 h-5 w-5" />
                  Start New Stake
                </Button>
              </Link>
              <Link href="/leaderboard" className="flex-1">
                <Button
                  variant="outline"
                  className="w-full h-14 glass-strong hover:glass border-border/50 hover:border-border/70 rounded-xl transition-all duration-200 hover:scale-105"
                >
                  <Trophy className="mr-2 h-5 w-5" />
                  View Leaderboard
                </Button>
              </Link>
            </div>
          </div>

          {/* Challenges Section */}
          <Tabs defaultValue="active" className="w-full">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4 animate-fade-in-up" style={{ animationDelay: "0.5s" }}>
              <h2 className="text-2xl md:text-3xl font-display font-bold text-gradient">
                Your Challenges
              </h2>
              <TabsList className="glass-strong border-border/50 rounded-xl p-1">
                <TabsTrigger 
                  value="active" 
                  className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-4 py-2 transition-all"
                >
                  <Zap className="h-4 w-4 mr-2" />
                  Active
                </TabsTrigger>
                <TabsTrigger
                  value="completed"
                  className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-4 py-2 transition-all"
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Completed
                </TabsTrigger>
                <TabsTrigger
                  value="history"
                  className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-4 py-2 transition-all"
                >
                  <Award className="h-4 w-4 mr-2" />
                  History
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="active" className="mt-6 space-y-4">
              {stake && stake.challenges.length > 0 ? (
                stake.challenges.map((challenge, index) => (
                  <Card
                    key={challenge.id}
                    className="glass-strong border-border/50 hover:border-border/70 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-black/20 group animate-fade-in-up"
                    style={{ animationDelay: `${0.6 + index * 0.1}s` }}
                  >
                    <CardHeader className="pb-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2 flex-1">
                          <CardTitle className="text-xl font-display font-semibold group-hover:text-primary transition-colors">
                            {challenge.title}
                          </CardTitle>
                          <CardDescription className="text-base text-foreground/70">
                            {challenge.description}
                          </CardDescription>
                        </div>
                        <div className="flex flex-col items-end space-y-2 ml-4">
                          <Badge
                            className={`${getDifficultyColor(
                              challenge.difficulty
                            )} text-xs font-medium border`}
                          >
                            {challenge.difficulty}
                          </Badge>
                          <div className="text-right">
                            <div className="text-sm font-semibold text-primary">
                              {challenge.points} pts
                            </div>
                            <div className="text-xs text-foreground/60">
                              {challenge.category}
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardFooter className="pt-0">
                      <Link
                        href={`/challenges/${challenge.id}`}
                        className="w-full"
                      >
                        <Button className="w-full h-12 gradient-purple hover:opacity-90 rounded-xl font-semibold shadow-lg shadow-primary/30 group-hover:shadow-primary/50 transition-all duration-200">
                          <Code className="mr-2 h-4 w-4" />
                          Solve Challenge
                          <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                        </Button>
                      </Link>
                    </CardFooter>
                  </Card>
                ))
              ) : (
                <Card className="glass-strong border-dashed border-2 border-border/50 animate-fade-in-up">
                  <CardContent className="py-16 text-center">
                    <div className="flex flex-col items-center space-y-4">
                      <div className="p-4 bg-gradient-to-br from-purple-500/20 to-purple-600/10 rounded-2xl">
                        <Code className="h-10 w-10 text-primary" />
                      </div>
                      <div className="space-y-2">
                        <h3 className="text-lg font-semibold text-gradient">
                          {stake
                            ? "No active challenges assigned"
                            : "No active stake"}
                        </h3>
                        <p className="text-foreground/70 max-w-md">
                          {stake
                            ? "Your challenges will appear here once they're assigned to your stake."
                            : "Start a new stake to get personalized coding challenges and earn rewards."}
                        </p>
                      </div>
                      {!stake && (
                        <Link href="/staking">
                          <Button className="mt-4 gradient-purple hover:opacity-90 rounded-xl px-6 shadow-lg shadow-primary/30">
                            <Coins className="mr-2 h-4 w-4" />
                            Start Staking
                          </Button>
                        </Link>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="completed" className="mt-6 space-y-4">
              <Card className="glass-strong border-green-500/30 hover:border-green-500/50 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-green-500/10 group animate-fade-in-up">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2 flex-1">
                      <CardTitle className="text-xl font-display font-semibold group-hover:text-green-400 transition-colors">
                        Two Sum
                      </CardTitle>
                      <CardDescription className="text-base text-foreground/70">
                        Find two numbers that add up to a target
                      </CardDescription>
                    </div>
                    <div className="flex flex-col items-end space-y-2 ml-4">
                      <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs font-medium">
                        <CheckCircle2 className="mr-1 h-3 w-3" />
                        Completed
                      </Badge>
                      <div className="text-right">
                        <div className="text-sm font-semibold text-green-400">
                          150 pts
                        </div>
                        <div className="text-xs text-foreground/60">
                          Arrays
                        </div>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardFooter className="pt-0">
                  <Link href="/challenges/two-sum" className="w-full">
                    <Button
                      variant="outline"
                      className="w-full h-12 glass-strong border-green-500/30 hover:border-green-500/50 rounded-xl transition-all duration-200"
                    >
                      <ExternalLink className="mr-2 h-4 w-4" />
                      View Solution
                      <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            </TabsContent>

            <TabsContent value="history" className="mt-6 space-y-4">
              <Card className="glass-strong border-green-500/30 hover:border-green-500/50 transition-all duration-300 hover:scale-[1.02] animate-fade-in-up">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 flex-1">
                      <CardTitle className="text-xl font-display font-semibold text-green-400">
                        Successful Staking Period
                      </CardTitle>
                      <CardDescription className="text-base">
                        April 1 - April 6, 2023
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2 text-green-400">
                      <CheckCircle2 className="h-5 w-5" />
                      <span className="font-semibold">Completed</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-foreground/60">
                          Amount Staked
                        </span>
                        <span className="font-semibold text-primary">5.0 ETH</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-foreground/60">
                          Challenges
                        </span>
                        <span className="font-semibold text-green-400">5/5</span>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-foreground/60">
                          Tokens Returned
                        </span>
                        <span className="font-semibold text-primary">5.0 ETH</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-foreground/60">Fee</span>
                        <span className="font-semibold text-green-400">0 ETH</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
      <Footer />
    </>
  );
}
