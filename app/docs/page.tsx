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
import { Separator } from "@/components/ui/separator";
import {
  ArrowRight,
  BookOpen,
  Code,
  Database,
  FileText,
  Github,
  Shield,
  Sparkles,
  Zap,
} from "lucide-react";
import Link from "next/link";

export default function DocsPage() {
  return (
    <>
      <Navbar />
      <div
        className="min-h-screen pt-20"
        style={{ backgroundColor: "#0B0121" }}
      >
        {/* Hero Section */}
        <div className="relative py-12 px-4 sm:px-6 lg:px-8 mb-12">
          <div className="container mx-auto max-w-7xl">
            <div className="text-center space-y-4 animate-fade-in-up">
              <div className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full border border-white/20 mb-4 bg-white/10">
                <FileText className="h-4 w-4 text-white" />
                <span className="text-sm font-medium text-white font-montserrat">
                  Documentation
                </span>
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-montserrat font-bold uppercase">
                <span className="block bg-gradient-to-r from-white via-white/95 to-white/85 bg-clip-text text-transparent">
                  DojoHunt
                </span>
                <br />
                <span className="block bg-gradient-to-r from-white via-white/95 to-white/85 bg-clip-text text-transparent">
                  Documentation
                </span>
              </h1>
              <p className="text-lg md:text-xl text-white/70 max-w-2xl mx-auto font-montserrat">
                Learn how to use DojoHunt to improve your coding skills while
                earning rewards
              </p>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl pb-12">
          <div className="grid gap-8 md:grid-cols-2 mb-12">
            <Card className="border border-white/10 hover:border-white/30 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-black/20 group animate-fade-in-up bg-white/5">
              <CardHeader>
                <div className="p-3 bg-gradient-to-br from-purple-500/20 to-purple-600/10 rounded-xl w-fit mb-4 group-hover:scale-110 transition-transform">
                  <BookOpen className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-xl font-montserrat font-semibold text-white">
                  Getting Started
                </CardTitle>
                <CardDescription className="text-white/70 font-montserrat">
                  Learn the basics of DojoHunt and how to get started
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 text-sm text-white/70 font-montserrat">
                  <li className="flex items-start gap-3">
                    <span className="text-white mt-1">•</span>
                    <span>Create an account or connect your wallet</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-white mt-1">•</span>
                    <span>Stake 5 TSKULL tokens for 5 days</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-white mt-1">•</span>
                    <span>Complete 5 assigned challenges</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-white mt-1">•</span>
                    <span>Unstake without fees upon completion</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card
              className="border border-white/10 hover:border-white/30 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-black/20 group animate-fade-in-up bg-white/5"
              style={{ animationDelay: "0.1s" }}
            >
              <CardHeader>
                <div className="p-3 bg-gradient-to-br from-blue-500/20 to-purple-500/10 rounded-xl w-fit mb-4 group-hover:scale-110 transition-transform">
                  <Code className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-xl font-montserrat font-semibold text-white">
                  Coding Challenges
                </CardTitle>
                <CardDescription className="text-white/70 font-montserrat">
                  Understand how challenges work and how to solve them
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 text-sm text-white/70 font-montserrat">
                  <li className="flex items-start gap-3">
                    <span className="text-white mt-1">•</span>
                    <span>JavaScript/TypeScript support</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-white mt-1">•</span>
                    <span>Real-time code execution and testing</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-white mt-1">•</span>
                    <span>Automated test case validation</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-white mt-1">•</span>
                    <span>Progress tracking and scoring</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card
              className="border border-white/10 hover:border-white/30 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-black/20 group animate-fade-in-up bg-white/5"
              style={{ animationDelay: "0.2s" }}
            >
              <CardHeader>
                <div className="p-3 bg-gradient-to-br from-yellow-500/20 to-purple-500/10 rounded-xl w-fit mb-4 group-hover:scale-110 transition-transform">
                  <Database className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-xl font-montserrat font-semibold text-white">
                  Staking System
                </CardTitle>
                <CardDescription className="text-white/70 font-montserrat">
                  Learn about the Aptos staking mechanism
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 text-sm text-white/70 font-montserrat">
                  <li className="flex items-start gap-3">
                    <span className="text-white mt-1">•</span>
                    <span>Smart contract-based staking</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-white mt-1">•</span>
                    <span>Automatic challenge assignment</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-white mt-1">•</span>
                    <span>Fee-free unstaking on completion</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-white mt-1">•</span>
                    <span>5% fee if challenges not completed</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card
              className="border border-white/10 hover:border-white/30 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-black/20 group animate-fade-in-up bg-white/5"
              style={{ animationDelay: "0.3s" }}
            >
              <CardHeader>
                <div className="p-3 bg-gradient-to-br from-green-500/20 to-purple-500/10 rounded-xl w-fit mb-4 group-hover:scale-110 transition-transform">
                  <Shield className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-xl font-montserrat font-semibold text-white">
                  Security
                </CardTitle>
                <CardDescription className="text-white/70 font-montserrat">
                  Security features and best practices
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 text-sm text-white/70 font-montserrat">
                  <li className="flex items-start gap-3">
                    <span className="text-white mt-1">•</span>
                    <span>Wallet signature verification</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-white mt-1">•</span>
                    <span>Secure code execution sandbox</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-white mt-1">•</span>
                    <span>Input validation and sanitization</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-white mt-1">•</span>
                    <span>Rate limiting and CORS protection</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>

          <Separator className="my-12 border-white/10" />

          <div className="space-y-12">
            <div
              className="animate-fade-in-up"
              style={{ animationDelay: "0.4s" }}
            >
              <h2 className="text-3xl md:text-4xl font-montserrat font-bold mb-6 uppercase">
                <span className="bg-gradient-to-r from-white via-white/95 to-white/85 bg-clip-text text-transparent">
                  API Reference
                </span>
              </h2>
              <p className="text-white/70 mb-8 text-lg font-montserrat">
                DojoHunt provides a RESTful API for programmatic access to
                challenges, staking, and user data.
              </p>

              <div className="grid gap-6 md:grid-cols-2">
                <Card className="border border-white/10 hover:border-white/30 transition-all duration-300 bg-white/5">
                  <CardHeader>
                    <CardTitle className="text-lg font-montserrat font-semibold text-white">
                      Authentication
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 text-sm">
                      <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
                        <Badge className="bg-white/10 border-white/20 text-white">
                          POST
                        </Badge>
                        <code className="text-white/90 font-mono">
                          /api/auth/wallet
                        </code>
                      </div>
                      <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
                        <Badge className="bg-white/10 border-white/20 text-white">
                          GET
                        </Badge>
                        <code className="text-white/90 font-mono">
                          /api/auth/wallet
                        </code>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border border-white/10 hover:border-white/30 transition-all duration-300 bg-white/5">
                  <CardHeader>
                    <CardTitle className="text-lg font-montserrat font-semibold text-white">
                      Challenges
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 text-sm">
                      <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
                        <Badge className="bg-white/10 border-white/20 text-white">
                          GET
                        </Badge>
                        <code className="text-white/90 font-mono">
                          /api/challenges
                        </code>
                      </div>
                      <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
                        <Badge className="bg-white/10 border-white/20 text-white">
                          POST
                        </Badge>
                        <code className="text-white/90 font-mono">
                          /api/challenges/[id]/submit
                        </code>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border border-white/10 hover:border-white/30 transition-all duration-300 bg-white/5">
                  <CardHeader>
                    <CardTitle className="text-lg font-montserrat font-semibold text-white">
                      Staking
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 text-sm">
                      <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
                        <Badge className="bg-white/10 border-white/20 text-white">
                          POST
                        </Badge>
                        <code className="text-white/90 font-mono">
                          /api/staking/stake
                        </code>
                      </div>
                      <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
                        <Badge className="bg-white/10 border-white/20 text-white">
                          GET
                        </Badge>
                        <code className="text-white/90 font-mono">
                          /api/staking/stake
                        </code>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border border-white/10 hover:border-white/30 transition-all duration-300 bg-white/5">
                  <CardHeader>
                    <CardTitle className="text-lg font-montserrat font-semibold text-white">
                      Admin
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 text-sm">
                      <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
                        <Badge className="bg-white/10 border-white/20 text-white">
                          POST
                        </Badge>
                        <code className="text-white/90 font-mono">
                          /api/challenges
                        </code>
                      </div>
                      <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
                        <Badge className="bg-white/10 border-white/20 text-white">
                          GET
                        </Badge>
                        <code className="text-white/90 font-mono">
                          /api/admin/stats
                        </code>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            <div
              className="animate-fade-in-up"
              style={{ animationDelay: "0.5s" }}
            >
              <h2 className="text-3xl md:text-4xl font-montserrat font-bold mb-6 uppercase">
                <span className="bg-gradient-to-r from-white via-white/95 to-white/85 bg-clip-text text-transparent">
                  Supported Language
                </span>
              </h2>
              <div className="max-w-2xl">
                <Card className="border border-white/10 bg-white/5">
                  <CardHeader>
                    <CardTitle className="text-xl font-montserrat font-semibold flex items-center gap-2 text-white">
                      <Code className="h-5 w-5 text-white" />
                      JavaScript
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-white/70 leading-relaxed font-montserrat">
                      Node.js runtime with ES6+ features and common libraries.
                      The platform currently supports JavaScript/TypeScript for
                      coding challenges.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>

            <div
              className="animate-fade-in-up"
              style={{ animationDelay: "0.6s" }}
            >
              <h2 className="text-3xl md:text-4xl font-montserrat font-bold mb-6 uppercase">
                <span className="bg-gradient-to-r from-white via-white/95 to-white/85 bg-clip-text text-transparent">
                  Need Help?
                </span>
              </h2>
              <div className="grid gap-6 md:grid-cols-2">
                <Card className="border border-white/10 hover:border-white/30 transition-all duration-300 hover:scale-105 bg-white/5">
                  <CardHeader>
                    <CardTitle className="text-xl font-montserrat font-semibold flex items-center gap-2 text-white">
                      <Zap className="h-5 w-5 text-white" />
                      Community Support
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-white/70 mb-4 leading-relaxed font-montserrat">
                      Join our community for help, discussions, and updates.
                    </p>
                    <Button
                      variant="outline"
                      className="bg-transparent border-white/30 text-white hover:bg-white/10 hover:border-white/50 rounded-xl font-montserrat"
                    >
                      Join Discord
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>

                <Card className="border border-white/10 hover:border-white/30 transition-all duration-300 hover:scale-105 bg-white/5">
                  <CardHeader>
                    <CardTitle className="text-xl font-montserrat font-semibold flex items-center gap-2 text-white">
                      <Github className="h-5 w-5 text-white" />
                      Technical Issues
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-white/70 mb-4 leading-relaxed font-montserrat">
                      Report bugs or technical issues with our platform.
                    </p>
                    <Button
                      variant="outline"
                      className="bg-transparent border-white/30 text-white hover:bg-white/10 hover:border-white/50 rounded-xl font-montserrat"
                    >
                      Report Issue
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    </>
  );
}
