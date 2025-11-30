"use client";

import { Footer } from "@/components/footer";
import { Navbar } from "@/components/navbar";
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
  ArrowRight,
  CheckCircle2,
  Code,
  Coins,
  FileCode,
  Lock,
  PlayCircle,
  Rocket,
  Shield,
  Sparkles,
  Terminal,
  TrendingUp,
  Trophy,
  Unlock,
  Users,
  Zap,
} from "lucide-react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useEffect, useState } from "react";

interface HomeStats {
  totalUsers: number;
  totalChallenges: number;
  totalSubmissions: number;
  totalStaked: number;
}

export default function Home() {
  const { data: session, status } = useSession();
  const [stats, setStats] = useState<HomeStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch("/api/leaderboard");
        if (response.ok) {
          const data = await response.json();
          setStats(data.data.stats);
        }
      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const isAuthenticated = status === "authenticated";

  return (
    <div
      className="min-h-screen relative overflow-hidden"
      style={{ backgroundColor: "#0B0121" }}
    >
      <Navbar />

      {/* Hero Section */}
      <section
        className="relative min-h-screen flex items-center justify-center pt-24 pb-16 px-4 sm:px-6 lg:px-8 overflow-hidden bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: "url('/hero-background.svg')",
          backgroundPosition: "center",
        }}
      >
        {/* Overlay for better text readability */}
        <div className="absolute inset-0 -z-10 bg-background/40" />

        <div className="container mx-auto mt-10 max-w-7xl text-center relative z-10">
          <div className="space-y-6 sm:space-y-8 md:space-y-10 lg:space-y-12 animate-fade-in-up">
            {/* Tagline Badge */}
            <div className="inline-flex items-center justify-center">
              <Badge className="glass-strong border-white/20 text-white/90 px-4 py-1.5 text-xs sm:text-sm font-medium bg-transparent">
                learn coding and stay consistent
              </Badge>
            </div>

            {/* Main Headline with Gradient */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-montserrat font-bold leading-[1.1] max-w-5xl mx-auto px-4">
              <span className="block bg-gradient-to-r from-white via-white/95 to-white/85 bg-clip-text text-transparent">
                Unleash Your Coding Power
              </span>
            </h1>

            <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-white/70 max-w-3xl mx-auto leading-relaxed px-4">
              DojoHunt is a next-generation coding challenge platform delivering
              real-time execution, blockchain rewards, and competitive
              leaderboards. All in one.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center pt-4 px-4">
              {isAuthenticated ? (
                <>
                  <Link href="/challenges">
                    <Button
                      size="lg"
                      className="bg-white text-gray-900 hover:bg-white/90 rounded-xl px-6 sm:px-8 py-5 sm:py-6 text-base sm:text-lg font-semibold font-montserrat shadow-lg transition-all duration-300 hover:scale-105"
                    >
                      start coding
                      <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
                    </Button>
                  </Link>
                  <Link href="/dashboard">
                    <Button
                      size="lg"
                      variant="outline"
                      className="bg-transparent border-white/30 text-white hover:bg-white/10 hover:border-white/50 rounded-xl px-6 sm:px-8 py-5 sm:py-6 text-base sm:text-lg font-semibold font-montserrat backdrop-blur-sm"
                    >
                      View Dashboard
                    </Button>
                  </Link>
                </>
              ) : (
                <>
                  <Link href="/auth/signin">
                    <Button
                      size="lg"
                      className="bg-white text-gray-900 hover:bg-white/90 rounded-xl px-6 sm:px-8 py-5 sm:py-6 text-base sm:text-lg font-semibold font-montserrat shadow-lg transition-all duration-300 hover:scale-105"
                    >
                      start coding
                      <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
                    </Button>
                  </Link>
                  <Link href="/challenges">
                    <Button
                      size="lg"
                      variant="outline"
                      className="bg-transparent border-white/30 text-white hover:bg-white/10 hover:border-white/50 rounded-xl px-6 sm:px-8 py-5 sm:py-6 text-base sm:text-lg font-semibold font-montserrat backdrop-blur-sm"
                    >
                      View Dashboard
                    </Button>
                  </Link>
                </>
              )}
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 sm:gap-6 md:gap-8 pt-12 sm:pt-16 max-w-5xl mx-auto px-4">
              <div className="text-center space-y-1 sm:space-y-2">
                <div className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white font-montserrat">
                  {loading
                    ? "..."
                    : (stats?.totalChallenges || 0).toLocaleString()}
                  +
                </div>
                <div className="text-xs sm:text-sm md:text-base text-white/60 font-montserrat">
                  challenges
                </div>
              </div>
              <div className="text-center space-y-1 sm:space-y-2">
                <div className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white font-montserrat">
                  {loading ? "..." : (stats?.totalUsers || 0).toLocaleString()}+
                </div>
                <div className="text-xs sm:text-sm md:text-base text-white/60 font-montserrat">
                  challenges
                </div>
              </div>
              <div className="text-center space-y-1 sm:space-y-2">
                <div className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white font-montserrat">
                  100%
                </div>
                <div className="text-xs sm:text-sm md:text-base text-white/60 font-montserrat">
                  challenges
                </div>
              </div>
              <div className="text-center space-y-1 sm:space-y-2">
                <div className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white font-montserrat">
                  &lt;1s
                </div>
                <div className="text-xs sm:text-sm md:text-base text-white/60 font-montserrat">
                  challenges
                </div>
              </div>
              <div className="text-center space-y-1 sm:space-y-2 col-span-2 sm:col-span-1">
                <div className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white font-montserrat">
                  0%
                </div>
                <div className="text-xs sm:text-sm md:text-base text-white/60 font-montserrat">
                  challenges
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* A new benchmark section */}
      <section className="relative py-24 md:py-32 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-16 md:mb-20">
            <h2
              className="text-4xl md:text-5xl lg:text-6xl font-display font-bold mb-6 uppercase"
              style={{ color: "#ECECEC" }}
            >
              <span>A NEW BENCHMARK</span>
              <br />
              <span>FOR CODING.</span>
            </h2>
          </div>

          {/* Three Column Features */}
          <div className="grid md:grid-cols-3 gap-8 md:gap-12">
            <div className="space-y-4 text-center animate-fade-in-up">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/10 flex items-center justify-center mb-4">
                <Zap className="h-8 w-8 text-primary" />
              </div>
              <h3
                className="text-2xl md:text-3xl font-display font-bold"
                style={{ color: "#ECECEC" }}
              >
                Fast, familiar, frictionless
              </h3>
              <p
                className="text-lg leading-relaxed"
                style={{ color: "#ECECEC" }}
              >
                No more waiting or high fees. Code instantly, get immediate
                feedback, and work with tools you already know.
              </p>
            </div>

            <div
              className="space-y-4 text-center animate-fade-in-up"
              style={{ animationDelay: "0.1s" }}
            >
              <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-purple-500/20 to-purple-600/10 flex items-center justify-center mb-4">
                <Shield className="h-8 w-8 text-primary" />
              </div>
              <h3
                className="text-2xl md:text-3xl font-display font-bold"
                style={{ color: "#ECECEC" }}
              >
                Decentralized by design
              </h3>
              <p
                className="text-lg leading-relaxed"
                style={{ color: "#ECECEC" }}
              >
                Your TSKULL tokens are locked in audited smart contracts. Complete
                challenges to unlock—no middlemen, no fees.
              </p>
            </div>

            <div
              className="space-y-4 text-center animate-fade-in-up"
              style={{ animationDelay: "0.2s" }}
            >
              <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-yellow-500/20 to-purple-500/10 flex items-center justify-center mb-4">
                <Users className="h-8 w-8 text-primary" />
              </div>
              <h3
                className="text-2xl md:text-3xl font-display font-bold"
                style={{ color: "#ECECEC" }}
              >
                Community at its core
              </h3>
              <p
                className="text-lg leading-relaxed"
                style={{ color: "#ECECEC" }}
              >
                Compete on leaderboards, compare solutions, and grow with
                developers worldwide.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Fast, familiar, frictionless - Detailed */}
      <section className="relative py-24 md:py-32 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-7xl">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div className="space-y-6 animate-fade-in-up">
              <Badge className="glass-strong border-primary/30 text-primary px-4 py-1.5 mb-4">
                Fast, familiar, frictionless
              </Badge>
              <h2
                className="text-4xl md:text-5xl lg:text-6xl font-display font-bold uppercase"
                style={{ color: "#ECECEC" }}
              >
                <span>NO MORE HIGH FEES</span>
                <br />
                <span>OR LONG WAITS.</span>
              </h2>
              <p
                className="text-xl md:text-2xl leading-relaxed"
                style={{ color: "#ECECEC" }}
              >
                Apps on DojoHunt feel instant, cost pennies, and work with the
                wallets and tools you already know and love.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Link href="/docs">
                  <Button
                    variant="outline"
                    className="glass-strong hover:glass rounded-xl px-6 py-6 text-base border-white/30 text-white hover:bg-white/10"
                    style={{ color: "#ECECEC" }}
                  >
                    Read the documentation
                  </Button>
                </Link>
                <Link href="/leaderboard">
                  <Button
                    variant="outline"
                    className="glass-strong hover:glass rounded-xl px-6 py-6 text-base border-white/30 text-white hover:bg-white/10"
                    style={{ color: "#ECECEC" }}
                  >
                    View Leaderboard
                  </Button>
                </Link>
              </div>
            </div>
            <div
              className="bg-white/5 rounded-2xl p-8 border border-white/10 hover:border-white/30 transition-all duration-300 hover:shadow-xl hover:shadow-black/20 animate-fade-in-up"
              style={{ animationDelay: "0.2s" }}
            >
              <div className="space-y-4">
                {[
                  {
                    icon: Terminal,
                    title: "Real-Time Execution",
                    desc: "Instant code feedback",
                  },
                  {
                    icon: Code,
                    title: "Monaco Editor",
                    desc: "Professional IDE experience",
                  },
                  {
                    icon: CheckCircle2,
                    title: "Test Validation",
                    desc: "Automatic test case checking",
                  },
                  {
                    icon: Zap,
                    title: "Zero Fees",
                    desc: "Complete challenges, unlock stake",
                  },
                ].map((item, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-4 p-4 bg-white/5 rounded-xl border border-white/10"
                  >
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-blue-500/10 flex items-center justify-center">
                      <item.icon className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <div
                        className="font-semibold"
                        style={{ color: "#ECECEC" }}
                      >
                        {item.title}
                      </div>
                      <div
                        className="text-sm"
                        style={{ color: "#ECECEC", opacity: 0.7 }}
                      >
                        {item.desc}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Build beyond limits */}
      <section className="relative py-24 md:py-32 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-16 md:mb-20">
            <h2
              className="text-4xl md:text-5xl lg:text-6xl font-display font-bold mb-6 uppercase"
              style={{ color: "#ECECEC" }}
            >
              <span>BUILD BEYOND LIMITS.</span>
              <br />
              <span>
                SCALE <em>WITHOUT</em> COMPROMISE.
              </span>
            </h2>
            <p
              className="text-xl md:text-2xl max-w-3xl mx-auto"
              style={{ color: "#ECECEC" }}
            >
              DojoHunt unlocks a new era of coding challenges, enabling products
              the coding platform has never seen before.
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12 max-w-5xl mx-auto mb-16">
            <div className="text-center space-y-2">
              <div
                className="text-5xl md:text-6xl lg:text-7xl font-bold"
                style={{ color: "#ECECEC" }}
              >
                {loading
                  ? "..."
                  : (stats?.totalChallenges || 0).toLocaleString()}
                +
              </div>
              <div
                className="text-base md:text-lg"
                style={{ color: "#ECECEC", opacity: 0.7 }}
              >
                Coding Challenges
              </div>
            </div>
            <div className="text-center space-y-2">
              <div
                className="text-5xl md:text-6xl lg:text-7xl font-bold"
                style={{ color: "#ECECEC" }}
              >
                100%
              </div>
              <div
                className="text-base md:text-lg"
                style={{ color: "#ECECEC", opacity: 0.7 }}
              >
                EVM-Compatible
              </div>
            </div>
            <div className="text-center space-y-2">
              <div
                className="text-5xl md:text-6xl lg:text-7xl font-bold"
                style={{ color: "#ECECEC" }}
              >
                &lt;1s
              </div>
              <div
                className="text-base md:text-lg"
                style={{ color: "#ECECEC", opacity: 0.7 }}
              >
                Finality
              </div>
            </div>
            <div className="text-center space-y-2">
              <div
                className="text-5xl md:text-6xl lg:text-7xl font-bold"
                style={{ color: "#ECECEC" }}
              >
                0%
              </div>
              <div
                className="text-base md:text-lg"
                style={{ color: "#ECECEC", opacity: 0.7 }}
              >
                Fees
              </div>
            </div>
          </div>

          <div className="text-center">
            <Link href="/challenges">
              <Button
                size="lg"
                variant="outline"
                className="glass-strong hover:glass rounded-xl px-8 py-6 text-lg border-white/30 text-white hover:bg-white/10"
                style={{ color: "#ECECEC" }}
              >
                Learn about DojoHunt's performance
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Plug and play */}
      <section className="relative py-24 md:py-32 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-7xl">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div className="bg-white/5 rounded-2xl p-8 border border-white/10 hover:border-white/30 transition-all duration-300 hover:shadow-xl hover:shadow-black/20 order-2 lg:order-1 animate-fade-in-up">
              <div className="space-y-6">
                <div className="flex items-center gap-4 p-4 bg-white/5 rounded-xl border border-white/10">
                  <Code className="h-8 w-8 text-white" />
                  <div>
                    <div
                      className="font-semibold text-lg"
                      style={{ color: "#ECECEC" }}
                    >
                      JavaScript Support
                    </div>
                    <div
                      className="text-sm"
                      style={{ color: "#ECECEC", opacity: 0.7 }}
                    >
                      Write code in familiar syntax
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4 p-4 bg-white/5 rounded-xl border border-white/10">
                  <Terminal className="h-8 w-8 text-white" />
                  <div>
                    <div
                      className="font-semibold text-lg"
                      style={{ color: "#ECECEC" }}
                    >
                      Monaco Editor
                    </div>
                    <div
                      className="text-sm"
                      style={{ color: "#ECECEC", opacity: 0.7 }}
                    >
                      VS Code-like experience
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4 p-4 bg-white/5 rounded-xl border border-white/10">
                  <PlayCircle className="h-8 w-8 text-white" />
                  <div>
                    <div
                      className="font-semibold text-lg"
                      style={{ color: "#ECECEC" }}
                    >
                      Instant Execution
                    </div>
                    <div
                      className="text-sm"
                      style={{ color: "#ECECEC", opacity: 0.7 }}
                    >
                      Run and test immediately
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4 p-4 bg-white/5 rounded-xl border border-white/10">
                  <Coins className="h-8 w-8 text-white" />
                  <div>
                    <div
                      className="font-semibold text-lg"
                      style={{ color: "#ECECEC" }}
                    >
                      Blockchain Integration
                    </div>
                    <div
                      className="text-sm"
                      style={{ color: "#ECECEC", opacity: 0.7 }}
                    >
                      Stake TSKULL tokens, unlock rewards
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div
              className="space-y-6 order-1 lg:order-2 animate-fade-in-up"
              style={{ animationDelay: "0.2s" }}
            >
              <Badge className="glass-strong border-primary/30 text-primary px-4 py-1.5 mb-4">
                Plug and play
              </Badge>
              <h2
                className="text-4xl md:text-5xl lg:text-6xl font-display font-bold uppercase"
                style={{ color: "#ECECEC" }}
              >
                <span>FOCUS ON BUILDING</span>
                <br />
                <span>GREAT PRODUCTS.</span>
              </h2>
              <p
                className="text-xl md:text-2xl leading-relaxed"
                style={{ color: "#ECECEC" }}
              >
                DojoHunt works with the tools you already know. No new stack to
                learn—just start coding and earning.
              </p>
              <div className="pt-4">
                <Link href="/docs">
                  <Button
                    variant="outline"
                    className="glass-strong hover:glass rounded-xl px-6 py-6 text-base border-white/30 text-white hover:bg-white/10"
                    style={{ color: "#ECECEC" }}
                  >
                    Check the Developer Guide
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Run challenges, join the network */}
      <section className="relative py-24 md:py-32 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-7xl">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div className="space-y-6 animate-fade-in-up">
              <Badge className="glass-strong border-primary/30 text-primary px-4 py-1.5 mb-4">
                True Decentralization
              </Badge>
              <h2
                className="text-4xl md:text-5xl lg:text-6xl font-display font-bold uppercase"
                style={{ color: "#ECECEC" }}
              >
                <span>SOLVE CHALLENGES.</span>
                <br />
                <span>JOIN THE NETWORK.</span>
              </h2>
              <p
                className="text-xl md:text-2xl leading-relaxed"
                style={{ color: "#ECECEC" }}
              >
                DojoHunt's smart contracts and low barriers allow developers to
                participate from anywhere. That's real decentralization from day
                one—with a global network ready to scale as demand grows.
              </p>
              <div className="pt-4">
                <Link href="/staking">
                  <Button
                    variant="outline"
                    className="glass-strong hover:glass rounded-xl px-6 py-6 text-base border-white/30 text-white hover:bg-white/10"
                    style={{ color: "#ECECEC" }}
                  >
                    Learn about staking
                  </Button>
                </Link>
              </div>
            </div>
            <div
              className="bg-white/5 rounded-2xl p-8 border border-white/10 hover:border-white/30 transition-all duration-300 hover:shadow-xl hover:shadow-black/20 animate-fade-in-up"
              style={{ animationDelay: "0.2s" }}
            >
              <div className="space-y-4">
                {[
                  {
                    icon: Lock,
                    title: "Audited Contracts",
                    desc: "Secure smart contracts",
                  },
                  {
                    icon: Users,
                    title: "Global Network",
                    desc: "Developers worldwide",
                  },
                  {
                    icon: TrendingUp,
                    title: "Scalable Platform",
                    desc: "Grows with demand",
                  },
                  {
                    icon: Shield,
                    title: "Self-Custody",
                    desc: "You control your funds",
                  },
                ].map((item, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-4 p-4 bg-white/5 rounded-xl border border-white/10"
                  >
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500/20 to-purple-500/10 flex items-center justify-center">
                      <item.icon className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <div
                        className="font-semibold"
                        style={{ color: "#ECECEC" }}
                      >
                        {item.title}
                      </div>
                      <div
                        className="text-sm"
                        style={{ color: "#ECECEC", opacity: 0.7 }}
                      >
                        {item.desc}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* The Trilemma */}
      <section className="relative py-24 md:py-32 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-16 md:mb-20">
            <p
              className="text-lg md:text-xl mb-6"
              style={{ color: "#ECECEC", opacity: 0.7 }}
            >
              Legacy platforms are forced to choose between performance,
              security, and rewards.
            </p>
            <h2
              className="text-4xl md:text-5xl lg:text-6xl font-display font-bold mb-6 uppercase"
              style={{ color: "#ECECEC" }}
            >
              <span>
                DOJOHUNT <em>REWRITES</em> THE RULES.
              </span>
            </h2>
            <p
              className="text-2xl md:text-3xl font-bold"
              style={{ color: "#ECECEC" }}
            >
              ALL IN ONE.
            </p>
          </div>
        </div>
      </section>

      {/* Explore the Onchain World */}
      <section className="relative py-24 md:py-32 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-16 md:mb-20">
            <h2
              className="text-4xl md:text-5xl lg:text-6xl font-display font-bold mb-6 uppercase"
              style={{ color: "#ECECEC" }}
            >
              <span>EXPLORE THE CODING WORLD</span>
              <br />
              <span>ON DOJOHUNT</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <Card className="bg-white/5 border-white/10 hover:border-white/30 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-black/20 group">
              <CardHeader>
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500/20 to-blue-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Code className="h-8 w-8 text-white" />
                </div>
                <CardTitle
                  className="text-2xl font-display font-bold mb-2"
                  style={{ color: "#ECECEC" }}
                >
                  Explore the Ecosystem
                </CardTitle>
                <CardDescription
                  className="text-base"
                  style={{ color: "#ECECEC", opacity: 0.7 }}
                >
                  Discover challenges already live on DojoHunt—designed for
                  speed, built for scale, and completely decentralized.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/challenges">
                  <Button
                    variant="outline"
                    className="w-full bg-transparent border-white/30 text-white hover:bg-white/10 hover:border-white/50 rounded-xl"
                    style={{ color: "#ECECEC" }}
                  >
                    Browse Challenges
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="bg-white/5 border-white/10 hover:border-white/30 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-black/20 group">
              <CardHeader>
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Rocket className="h-8 w-8 text-white" />
                </div>
                <CardTitle
                  className="text-2xl font-display font-bold mb-2"
                  style={{ color: "#ECECEC" }}
                >
                  Start Building
                </CardTitle>
                <CardDescription
                  className="text-base"
                  style={{ color: "#ECECEC", opacity: 0.7 }}
                >
                  Explore programs, resources, and a world-class community for
                  developers building on DojoHunt.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/docs">
                  <Button
                    variant="outline"
                    className="w-full bg-transparent border-white/30 text-white hover:bg-white/10 hover:border-white/50 rounded-xl"
                    style={{ color: "#ECECEC" }}
                  >
                    View Documentation
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative py-24 md:py-32 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-4xl text-center">
          <h2
            className="text-4xl md:text-5xl lg:text-6xl font-display font-bold mb-6 uppercase"
            style={{ color: "#ECECEC" }}
          >
            <span>READY TO START?</span>
          </h2>
          <p
            className="text-xl md:text-2xl mb-8 max-w-2xl mx-auto"
            style={{ color: "#ECECEC" }}
          >
            Join developers building skills and earning rewards on DojoHunt.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {isAuthenticated ? (
              <Link href="/challenges">
                <Button
                  size="lg"
                  className="bg-white text-gray-900 hover:bg-white/90 rounded-xl px-12 py-8 text-lg md:text-xl font-semibold shadow-xl transition-all duration-300 hover:scale-105"
                >
                  Start Coding
                  <ArrowRight className="ml-2 h-5 w-5 md:h-6 md:w-6" />
                </Button>
              </Link>
            ) : (
              <Link href="/auth/signin">
                <Button
                  size="lg"
                  className="bg-white text-gray-900 hover:bg-white/90 rounded-xl px-12 py-8 text-lg md:text-xl font-semibold shadow-xl transition-all duration-300 hover:scale-105"
                >
                  Get Started
                  <ArrowRight className="ml-2 h-5 w-5 md:h-6 md:w-6" />
                </Button>
              </Link>
            )}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
