"use client";

import { Footer } from "@/components/footer";
import { Navbar } from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles } from "lucide-react";
import { signIn } from "next-auth/react";

export default function SignInPage() {
    const handleGoogleSignIn = () => {
        signIn("google", { callbackUrl: "/dashboard" });
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
                            Sign in with your Google account to continue
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
                            <Button
                                type="button"
                                onClick={handleGoogleSignIn}
                                className="w-full h-14 glass-strong hover:glass border-border/50 hover:border-primary/30 rounded-xl transition-all duration-200 hover:scale-[1.02] text-base font-semibold"
                            >
                                <svg className="mr-3 h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                                </svg>
                                Continue with Google
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
            <Footer />
        </>
    );
}
