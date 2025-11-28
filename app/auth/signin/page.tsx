"use client";

import { Footer } from "@/components/footer";
import { Navbar } from "@/components/navbar";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Github, Loader2, Lock, Mail, Sparkles } from "lucide-react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function SignInPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const router = useRouter();

    const handleCredentialsSignIn = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");

        try {
            const result = await signIn("credentials", {
                email,
                password,
                redirect: false,
            });

            if (result?.ok) {
                router.push("/dashboard");
            } else {
                setError("Invalid email or password. Please try again.");
            }
        } catch (error) {
            console.error("Sign in error:", error);
            setError("An error occurred during sign in. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleOAuthSignIn = (provider: string) => {
        signIn(provider, { callbackUrl: "/dashboard" });
    };

    return (
        <>
            <Navbar />
            <div className="min-h-screen pt-24 pb-16 flex items-center justify-center px-4 sm:px-6 lg:px-8">
                <div className="w-full max-w-md">
                    {/* Hero Section */}
                    <div className="text-center mb-10 animate-fade-in-up">
                        <div className="inline-flex items-center justify-center gap-2 px-4 py-2 glass-strong rounded-full border border-primary/30 mb-6 hover:border-primary/50 transition-all duration-300">
                            <Sparkles className="h-4 w-4 text-primary" />
                            <span className="text-sm font-medium text-primary">Welcome Back</span>
                        </div>
                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold mb-4">
                            <span className="text-gradient">Sign In</span>
                        </h1>
                        <p className="text-lg md:text-xl text-foreground/70 max-w-xl mx-auto">
                            Enter your credentials to access your account
                        </p>
                    </div>

                    <Card className="glass-strong border-border/50 shadow-2xl animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
                        <CardHeader className="space-y-3 pb-6">
                            <CardTitle className="text-2xl md:text-3xl font-display font-semibold text-center">
                                Account Access
                            </CardTitle>
                            <CardDescription className="text-center text-foreground/70 text-base">
                                Sign in to continue your coding journey
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {error && (
                                <Alert className="glass-light border-red-500/30 bg-red-500/10 text-red-400 rounded-xl">
                                    <AlertDescription className="font-medium">{error}</AlertDescription>
                                </Alert>
                            )}

                            <form onSubmit={handleCredentialsSignIn} className="space-y-6">
                                <div className="space-y-3">
                                    <Label htmlFor="email" className="text-foreground/90 font-semibold text-sm">Email</Label>
                                    <div className="relative">
                                        <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-foreground/40" />
                                        <Input
                                            id="email"
                                            type="email"
                                            placeholder="Enter your email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="pl-12 h-12 glass-light border-border/30 rounded-xl focus:border-primary/50 transition-all"
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <Label htmlFor="password" className="text-foreground/90 font-semibold text-sm">Password</Label>
                                    <div className="relative">
                                        <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-foreground/40" />
                                        <Input
                                            id="password"
                                            type="password"
                                            placeholder="Enter your password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="pl-12 h-12 glass-light border-border/30 rounded-xl focus:border-primary/50 transition-all"
                                            required
                                        />
                                    </div>
                                </div>
                                <Button
                                    type="submit"
                                    className="w-full h-12 gradient-purple hover:opacity-90 rounded-xl font-semibold shadow-lg shadow-primary/30 hover:shadow-primary/50 transition-all duration-300 hover:scale-[1.02]"
                                    disabled={isLoading}
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Signing in...
                                        </>
                                    ) : (
                                        <>
                                            <Lock className="mr-2 h-4 w-4" />
                                            Sign In
                                        </>
                                    )}
                                </Button>
                            </form>

                            <div className="relative py-2">
                                <div className="absolute inset-0 flex items-center">
                                    <Separator className="w-full border-border/30" />
                                </div>
                                <div className="relative flex justify-center text-xs uppercase">
                                    <span className="bg-card px-4 text-foreground/50 font-medium">
                                        Or continue with
                                    </span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => handleOAuthSignIn("google")}
                                    className="h-12 glass-strong hover:glass border-border/50 hover:border-primary/30 rounded-xl transition-all duration-200 hover:scale-[1.02]"
                                >
                                    <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                                    </svg>
                                    Google
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => handleOAuthSignIn("github")}
                                    className="h-12 glass-strong hover:glass border-border/50 hover:border-primary/30 rounded-xl transition-all duration-200 hover:scale-[1.02]"
                                >
                                    <Github className="mr-2 h-4 w-4" />
                                    GitHub
                                </Button>
                            </div>

                            <div className="text-center text-sm pt-4 border-t border-border/30">
                                <span className="text-foreground/60">Don't have an account? </span>
                                <Link
                                    href="/auth/signup"
                                    className="text-primary hover:text-primary/80 font-semibold hover:underline transition-colors"
                                >
                                    Sign up
                                </Link>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
            <Footer />
        </>
    );
}
