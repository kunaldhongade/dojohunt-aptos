"use client";

import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { WelcomeTokensPopup } from "@/components/welcome-tokens-popup";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ConnectWallet } from "@/components/connect-wallet";
import { User, Loader2, Sparkles, CheckCircle2 } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { update } from "next-auth/react";

export default function CompleteProfilePage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [formData, setFormData] = useState({
        username: "",
        bio: "",
        walletAddress: "",
    });
    const [walletConnected, setWalletConnected] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [isChecking, setIsChecking] = useState(true);

    // Check if user is authenticated and if profile is already complete
    useEffect(() => {
        if (status === "loading") return;
        
        if (!session) {
            router.push("/auth/signin");
            return;
        }

        // Check if profile is already complete
        const checkProfile = async () => {
            try {
                const response = await fetch("/api/user/profile");
                if (response.ok) {
                    const data = await response.json();
                    if (data.user?.username) {
                        // Profile already complete, redirect to dashboard
                        router.push("/dashboard");
                        return;
                    }
                }
            } catch (error) {
                console.error("Error checking profile:", error);
            } finally {
                setIsChecking(false);
            }
        };

        checkProfile();
    }, [session, status, router]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const validateForm = () => {
        if (!formData.username.trim()) {
            setError("Username is required");
            return false;
        }
        if (formData.username.length < 3) {
            setError("Username must be at least 3 characters long");
            return false;
        }
        if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
            setError("Username can only contain letters, numbers, and underscores");
            return false;
        }
        return true;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (!validateForm()) {
            return;
        }

        setIsLoading(true);

        try {
            const response = await fetch("/api/user/profile", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    username: formData.username.trim(),
                    bio: formData.bio.trim() || undefined,
                    walletAddress: formData.walletAddress || undefined,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Failed to update profile");
            }

            // Update the session to reflect profile completion
            await update();

            // Profile updated successfully, redirect to dashboard
            router.push("/dashboard");
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to update profile");
        } finally {
            setIsLoading(false);
        }
    };

    if (status === "loading" || isChecking) {
        return (
            <>
                <Navbar />
                <div className="min-h-screen pt-24 pb-16 flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
                <Footer />
            </>
        );
    }

    if (!session) {
        return null;
    }

    return (
        <>
            <Navbar />
            <div className="min-h-screen pt-24 pb-16 flex items-center justify-center px-4 sm:px-6 lg:px-8">
                <div className="w-full max-w-2xl">
                    {/* Hero Section */}
                    <div className="text-center mb-10 animate-fade-in-up">
                        <div className="inline-flex items-center justify-center gap-2 px-4 py-2 glass-strong rounded-full border border-primary/30 mb-6 hover:border-primary/50 transition-all duration-300">
                            <Sparkles className="h-4 w-4 text-primary" />
                            <span className="text-sm font-medium text-primary">Complete Your Profile</span>
                        </div>
                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold mb-4">
                            <span className="text-gradient">Welcome to DojoHunt!</span>
                        </h1>
                        <p className="text-lg md:text-xl text-foreground/70 max-w-xl mx-auto">
                            Let's set up your profile to get started
                        </p>
                    </div>

                    <Card className="glass-strong border-border/50 shadow-2xl animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
                        <CardHeader className="space-y-3 pb-6">
                            <CardTitle className="text-2xl md:text-3xl font-display font-semibold text-center">
                                Profile Setup
                            </CardTitle>
                            <CardDescription className="text-center text-foreground/70 text-base">
                                Add a few details to personalize your account
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <form onSubmit={handleSubmit} className="space-y-6">
                                {error && (
                                    <Alert className="glass-light border-red-500/30 bg-red-500/10 text-red-400 rounded-xl">
                                        <AlertDescription className="font-medium">{error}</AlertDescription>
                                    </Alert>
                                )}

                                <div className="space-y-3">
                                    <Label htmlFor="username" className="text-foreground/90 font-semibold text-sm">
                                        Username <span className="text-red-400">*</span>
                                    </Label>
                                    <div className="relative">
                                        <User className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-foreground/40" />
                                        <Input
                                            id="username"
                                            name="username"
                                            type="text"
                                            placeholder="Choose a username"
                                            value={formData.username}
                                            onChange={handleInputChange}
                                            className="pl-12 h-12 glass-light border-border/30 rounded-xl focus:border-primary/50 transition-all"
                                            required
                                            minLength={3}
                                            pattern="[a-zA-Z0-9_]+"
                                        />
                                    </div>
                                    <p className="text-xs text-foreground/60">
                                        Username must be at least 3 characters and can only contain letters, numbers, and underscores
                                    </p>
                                </div>

                                <div className="space-y-3">
                                    <Label htmlFor="bio" className="text-foreground/90 font-semibold text-sm">
                                        Bio <span className="text-foreground/50 text-xs font-normal">(Optional)</span>
                                    </Label>
                                    <Textarea
                                        id="bio"
                                        name="bio"
                                        placeholder="Tell us about yourself..."
                                        value={formData.bio}
                                        onChange={handleInputChange}
                                        className="min-h-[100px] glass-light border-border/30 rounded-xl focus:border-primary/50 resize-none"
                                        maxLength={200}
                                    />
                                    <p className="text-xs text-foreground/60">
                                        {formData.bio.length}/200 characters
                                    </p>
                                </div>

                                <div className="space-y-3">
                                    <Label className="text-foreground/90 font-semibold text-sm">
                                        Wallet Address <span className="text-foreground/50 text-xs font-normal">(Optional)</span>
                                    </Label>
                                    <ConnectWallet
                                        onWalletConnected={(address) => {
                                            setFormData({
                                                ...formData,
                                                walletAddress: address,
                                            });
                                            setWalletConnected(true);
                                        }}
                                        onWalletDisconnected={() => {
                                            setFormData({
                                                ...formData,
                                                walletAddress: "",
                                            });
                                            setWalletConnected(false);
                                        }}
                                        showAddress={true}
                                        variant="outline"
                                        className="w-full justify-start h-12 rounded-xl"
                                    />
                                    <p className="text-xs text-foreground/60">
                                        Connect your Aptos wallet to enable staking features. You can also connect it later in settings.
                                    </p>
                                </div>

                                <Button 
                                    type="submit" 
                                    className="w-full h-12 gradient-purple hover:opacity-90 rounded-xl font-semibold shadow-lg shadow-primary/30 hover:shadow-primary/50 transition-all duration-300 hover:scale-[1.02]" 
                                    disabled={isLoading}
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Saving Profile...
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle2 className="mr-2 h-4 w-4" />
                                            Complete Profile
                                        </>
                                    )}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            </div>
            <Footer />
            <WelcomeTokensPopup />
        </>
    );
}

