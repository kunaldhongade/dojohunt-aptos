"use client";

import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  BookOpen,
  PlayCircle,
  Code,
  Coins,
  Trophy,
  ArrowRight,
  CheckCircle2,
  Clock,
  Zap,
  Target,
  Rocket
} from "lucide-react";
import Link from "next/link";

export default function TutorialsPage() {
  const tutorials = [
    {
      id: 1,
      title: "Getting Started with DojoHunt",
      description: "Learn the basics of DojoHunt, from creating an account to your first challenge.",
      duration: "5 min",
      level: "Beginner",
      icon: Rocket,
      gradient: "from-purple-500/20 to-purple-600/10",
      steps: [
        "Create your account or connect wallet",
        "Navigate the dashboard",
        "Understand the challenge system",
        "Complete your first challenge"
      ]
    },
    {
      id: 2,
      title: "Staking Your First Tokens",
      description: "A complete guide to staking tokens on Aptos and unlocking challenges.",
      duration: "8 min",
      level: "Beginner",
      icon: Coins,
      gradient: "from-yellow-500/20 to-purple-500/10",
      steps: [
        "Connect your wallet",
        "Approve token spending",
        "Stake your ETH",
        "Verify your stake"
      ]
    },
    {
      id: 3,
      title: "Solving Coding Challenges",
      description: "Master the art of solving challenges efficiently with our code editor.",
      duration: "10 min",
      level: "Intermediate",
      icon: Code,
      gradient: "from-blue-500/20 to-purple-500/10",
      steps: [
        "Understanding the problem",
        "Using the Monaco editor",
        "Testing your solution",
        "Submitting and reviewing"
      ]
    },
    {
      id: 4,
      title: "Optimizing Your Solutions",
      description: "Learn advanced techniques to write efficient and elegant code solutions.",
      duration: "15 min",
      level: "Advanced",
      icon: Zap,
      gradient: "from-green-500/20 to-purple-500/10",
      steps: [
        "Time complexity analysis",
        "Space optimization",
        "Best practices",
        "Code review tips"
      ]
    },
    {
      id: 5,
      title: "Climbing the Leaderboard",
      description: "Strategies to improve your ranking and compete with top developers.",
      duration: "12 min",
      level: "Intermediate",
      icon: Trophy,
      gradient: "from-pink-500/20 to-purple-500/10",
      steps: [
        "Understanding scoring",
        "Consistent participation",
        "Quality over quantity",
        "Community engagement"
      ]
    },
    {
      id: 6,
      title: "Unstaking and Withdrawing",
      description: "Complete challenges and unlock your staked tokens without fees.",
      duration: "6 min",
      level: "Beginner",
      icon: Target,
      gradient: "from-cyan-500/20 to-purple-500/10",
      steps: [
        "Complete required challenges",
        "Initiate unstaking process",
        "Verify completion",
        "Withdraw your tokens"
      ]
    }
  ];

  return (
    <>
      <Navbar />
      <div className="min-h-screen pt-20 pb-12">
        {/* Hero Section */}
        <div className="relative py-16 px-4 sm:px-6 lg:px-8 mb-16">
          <div className="container mx-auto max-w-7xl">
            <div className="text-center space-y-6 animate-fade-in-up">
              <div className="inline-flex items-center justify-center gap-2 px-4 py-2 glass-strong rounded-full border border-primary/20 mb-4">
                <BookOpen className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium text-primary">Tutorials</span>
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold">
                <span className="text-gradient">Learn & Master</span>
                <br />
                <span className="text-gradient">DojoHunt</span>
              </h1>
              <p className="text-lg md:text-xl text-foreground/70 max-w-2xl mx-auto">
                Step-by-step tutorials to help you become a DojoHunt expert and maximize your rewards
              </p>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          {/* Tutorials Grid */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-16">
            {tutorials.map((tutorial, index) => {
              const Icon = tutorial.icon;
              return (
                <Card
                  key={tutorial.id}
                  className="glass-strong border-border/50 hover:border-primary/30 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-black/20 group animate-fade-in-up"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <CardHeader className="pb-4">
                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${tutorial.gradient} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                      <Icon className="h-7 w-7 text-primary" />
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className="glass-light border-border/30 text-xs">
                        {tutorial.level}
                      </Badge>
                      <div className="flex items-center gap-1 text-xs text-foreground/60">
                        <Clock className="h-3 w-3" />
                        {tutorial.duration}
                      </div>
                    </div>
                    <CardTitle className="text-xl font-display font-semibold mb-2">
                      {tutorial.title}
                    </CardTitle>
                    <CardDescription className="text-foreground/70">
                      {tutorial.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 mb-4">
                      {tutorial.steps.map((step, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-foreground/70">
                          <CheckCircle2 className="h-4 w-4 text-green-400 flex-shrink-0 mt-0.5" />
                          <span>{step}</span>
                        </li>
                      ))}
                    </ul>
                    <Button
                      variant="outline"
                      className="w-full glass-strong hover:glass border-border/50 hover:border-primary/30 rounded-lg group/btn"
                    >
                      Start Tutorial
                      <ArrowRight className="ml-2 h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Quick Start Section */}
          <Card className="glass-strong border-border/50 mb-16">
            <CardHeader>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-purple-600/10 flex items-center justify-center">
                  <PlayCircle className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-2xl font-display font-semibold">
                    Quick Start Guide
                  </CardTitle>
                  <CardDescription>
                    Get up and running in 5 minutes
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-4 gap-4">
                {[
                  { step: "1", title: "Sign Up", desc: "Create account or connect wallet" },
                  { step: "2", title: "Stake ETH", desc: "Lock tokens to unlock challenges" },
                  { step: "3", title: "Solve", desc: "Complete coding challenges" },
                  { step: "4", title: "Earn", desc: "Unstake and claim rewards" },
                ].map((item, i) => (
                  <div key={i} className="text-center space-y-2">
                    <div className="w-12 h-12 mx-auto rounded-full bg-gradient-to-br from-purple-500/20 to-purple-600/10 flex items-center justify-center text-lg font-bold text-primary">
                      {item.step}
                    </div>
                    <h3 className="font-semibold text-sm">{item.title}</h3>
                    <p className="text-xs text-foreground/60">{item.desc}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* CTA Section */}
          <div className="text-center">
            <Card className="glass-strong border-border/50 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-primary/5 to-transparent" />
              <CardContent className="p-12 relative z-10">
                <div className="space-y-6">
                  <h2 className="text-3xl md:text-4xl font-display font-bold">
                    <span className="text-gradient">Ready to Start Learning?</span>
                  </h2>
                  <p className="text-lg text-foreground/70 max-w-xl mx-auto">
                    Begin your journey with our comprehensive tutorials and start earning rewards today.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Link href="/challenges">
                      <Button 
                        size="lg" 
                        className="gradient-purple hover:opacity-90 rounded-xl px-8 py-6 text-base font-semibold shadow-lg shadow-primary/30"
                      >
                        Browse Challenges
                        <ArrowRight className="ml-2 h-5 w-5" />
                      </Button>
                    </Link>
                    <Link href="/docs">
                      <Button 
                        size="lg" 
                        variant="outline"
                        className="glass-strong hover:glass rounded-xl px-8 py-6 text-base font-semibold border-border/50 hover:border-primary/30"
                      >
                        View Documentation
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}

