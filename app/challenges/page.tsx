"use client";

import { Footer } from "@/components/footer";
import { Navbar } from "@/components/navbar";
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
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowRight,
  CheckCircle2,
  Code as CodeIcon,
  Loader2,
  Search,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

interface Challenge {
  id: string;
  title: string;
  description: string;
  difficulty: string;
  category: string;
  points: number;
  isActive: boolean;
  isPublished: boolean;
  completionRate?: number;
  isCompleted?: boolean;
}

export default function Challenges() {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");

  useEffect(() => {
    fetchChallenges();
  }, []);

  const fetchChallenges = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/challenges");

      if (!response.ok) {
        throw new Error("Failed to fetch challenges");
      }

      const data = await response.json();
      setChallenges(data.data?.items || data.challenges || []);
    } catch (err) {
      console.error("Error fetching challenges:", err);
      setError("Failed to load challenges. Please try again later.");
      setChallenges([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredChallenges = challenges.filter((challenge) => {
    const matchesSearch =
      (challenge.title?.toLowerCase() || "").includes(
        searchQuery.toLowerCase()
      ) ||
      (challenge.description?.toLowerCase() || "").includes(
        searchQuery.toLowerCase()
      );
    const matchesDifficulty =
      difficultyFilter === "all" ||
      (challenge.difficulty?.toLowerCase() || "") ===
        difficultyFilter.toLowerCase();
    const matchesCategory =
      categoryFilter === "all" ||
      (challenge.category?.toLowerCase() || "") ===
        categoryFilter.toLowerCase();

    return matchesSearch && matchesDifficulty && matchesCategory;
  });

  const getDifficultyColor = (difficulty: string) => {
    if (!difficulty) {
      return "bg-white/10 text-white border-white/20";
    }
    switch (difficulty.toLowerCase()) {
      case "easy":
        return "bg-green-500/20 text-green-400 border-green-500/30";
      case "medium":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      case "hard":
        return "bg-red-500/20 text-red-400 border-red-500/30";
      default:
        return "bg-white/10 text-white border-white/20";
    }
  };

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
                <Sparkles className="h-4 w-4 text-white" />
                <span className="text-sm font-medium text-white font-montserrat">
                  Coding Challenges
                </span>
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-montserrat font-bold uppercase">
                <span className="block bg-gradient-to-r from-white via-white/95 to-white/85 bg-clip-text text-transparent">
                  Master Your Skills
                </span>
                <br />
                <span className="block bg-gradient-to-r from-white via-white/95 to-white/85 bg-clip-text text-transparent">
                  One Challenge at a Time
                </span>
              </h1>
              <p className="text-lg md:text-xl text-white/70 max-w-2xl mx-auto font-montserrat">
                Solve coding challenges while staking tokens. Complete
                challenges to earn rewards and climb the leaderboard.
              </p>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl pb-12">
          {/* Filters */}
          <div
            className="rounded-2xl border border-white/10 p-6 mb-8 animate-fade-in-up bg-white/5"
            style={{ animationDelay: "0.2s" }}
          >
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-white/40" />
                <Input
                  type="search"
                  placeholder="Search challenges..."
                  className="w-full pl-12 h-12 bg-white/5 border-white/10 rounded-xl focus:border-white/30 text-white placeholder:text-white/50"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Select
                value={difficultyFilter}
                onValueChange={setDifficultyFilter}
              >
                <SelectTrigger className="w-full md:w-48 h-12 bg-white/5 border-white/10 rounded-xl text-white">
                  <SelectValue placeholder="Difficulty" />
                </SelectTrigger>
                <SelectContent className="bg-white/5 border-white/10">
                  <SelectItem value="all">All Difficulties</SelectItem>
                  <SelectItem value="easy">Easy</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="hard">Hard</SelectItem>
                </SelectContent>
              </Select>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full md:w-48 h-12 bg-white/5 border-white/10 rounded-xl text-white">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent className="bg-white/5 border-white/10">
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="arrays">Arrays</SelectItem>
                  <SelectItem value="strings">Strings</SelectItem>
                  <SelectItem value="dynamic programming">
                    Dynamic Programming
                  </SelectItem>
                  <SelectItem value="stack">Stack</SelectItem>
                  <SelectItem value="trees">Trees</SelectItem>
                  <SelectItem value="graphs">Graphs</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {error && (
            <div className="border border-red-500/30 p-4 text-red-400 rounded-xl mb-6 animate-fade-in bg-white/5">
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-24">
              <div className="flex flex-col items-center space-y-4">
                <Loader2 className="h-10 w-10 animate-spin text-white" />
                <span className="text-white/70 font-montserrat">
                  Loading challenges...
                </span>
              </div>
            </div>
          ) : (
            <>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filteredChallenges.map((challenge, index) => (
                  <Card
                    key={challenge.id}
                    className={`${
                      challenge.isCompleted
                        ? "border-green-500/30 bg-green-500/5 hover:border-green-500/50"
                        : "border-white/10 hover:border-white/30"
                    } bg-white/5 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-black/20 group animate-fade-in-up`}
                    style={{ animationDelay: `${0.3 + index * 0.05}s` }}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex items-start gap-2 flex-1">
                          {challenge.isCompleted && (
                            <CheckCircle2 className="h-5 w-5 text-green-400 mt-0.5 shrink-0" />
                          )}
                          <CardTitle className="text-lg font-montserrat font-semibold text-white transition-colors line-clamp-2 flex-1">
                            {challenge.title}
                          </CardTitle>
                        </div>
                        <Badge
                          className={`${getDifficultyColor(
                            challenge.difficulty
                          )} text-xs font-medium border shrink-0 bg-white/10 border-white/20 text-white`}
                        >
                          {challenge.difficulty}
                        </Badge>
                      </div>
                      <CardDescription className="text-sm text-white/70 line-clamp-2 font-montserrat">
                        {challenge.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pb-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-white/60 font-medium font-montserrat">
                          {challenge.category}
                        </span>
                        <span className="text-white font-semibold font-montserrat">
                          {challenge.points} pts
                        </span>
                      </div>
                      {challenge.completionRate && (
                        <div className="mt-3 flex items-center justify-between text-xs">
                          <span className="text-white/50 font-montserrat">
                            Completion Rate
                          </span>
                          <span className="text-green-400 font-medium font-montserrat">
                            {challenge.completionRate}%
                          </span>
                        </div>
                      )}
                    </CardContent>
                    <CardFooter className="pt-0">
                      <Link
                        href={`/challenges/${challenge.id}`}
                        className="w-full"
                      >
                        <Button className="w-full bg-white text-gray-900 hover:bg-white/90 rounded-xl font-semibold font-montserrat shadow-lg transition-all duration-200 group-hover:scale-105">
                          <CodeIcon className="mr-2 h-4 w-4" />
                          Solve Challenge
                          <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                        </Button>
                      </Link>
                    </CardFooter>
                  </Card>
                ))}
              </div>

              {!loading && filteredChallenges.length === 0 && (
                <Card className="border-dashed border-2 border-white/10 animate-fade-in-up mt-8 bg-white/5">
                  <CardContent className="py-16 text-center">
                    <div className="flex flex-col items-center space-y-4">
                      <div className="p-4 bg-gradient-to-br from-purple-500/20 to-purple-600/10 rounded-2xl">
                        <Search className="h-10 w-10 text-white" />
                      </div>
                      <div className="space-y-2">
                        <h3 className="text-lg font-semibold font-montserrat uppercase bg-gradient-to-r from-white via-white/95 to-white/85 bg-clip-text text-transparent">
                          No challenges found
                        </h3>
                        <p className="text-white/70 max-w-md font-montserrat">
                          Try adjusting your search or filter criteria to find
                          more challenges.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>

        <Footer />
      </div>
    </>
  );
}
