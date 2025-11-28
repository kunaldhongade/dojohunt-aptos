"use client";

import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Lock, Mail, User, Loader2, Sparkles, CheckCircle2 } from "lucide-react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ConnectWallet } from "@/components/connect-wallet";

export default function SignUp() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    username: "",
    password: "",
    confirmPassword: "",
    walletAddress: "",
    agreeToTerms: false,
  });
  const [walletConnected, setWalletConnected] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const router = useRouter();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      setError("Name is required");
      return false;
    }
    if (!formData.email.trim()) {
      setError("Email is required");
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError("Please enter a valid email address");
      return false;
    }
    if (!formData.username.trim()) {
      setError("Username is required");
      return false;
    }
    if (formData.username.length < 3) {
      setError("Username must be at least 3 characters long");
      return false;
    }
    if (!formData.password) {
      setError("Password is required");
      return false;
    }
    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters long");
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return false;
    }
    // Wallet address validation is now handled by ConnectWallet component
    // No need to validate here as it's optional and automatically validated when connected
    if (!formData.agreeToTerms) {
      setError("You must agree to the Terms of Service and Privacy Policy");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      // Create user account
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          username: formData.username,
          password: formData.password,
          walletAddress: formData.walletAddress || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create account");
      }

      setSuccess("Account created successfully! Redirecting to sign in...");

      // Auto sign in after successful registration
      setTimeout(async () => {
        const signInResult = await signIn("credentials", {
          email: formData.email,
          password: formData.password,
          redirect: false,
        });

        if (signInResult?.ok) {
          router.push("/dashboard");
        } else {
          router.push("/auth/signin");
        }
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create account");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="min-h-screen pt-24 pb-16 flex items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-2xl">
          {/* Hero Section */}
          <div className="text-center mb-10 animate-fade-in-up">
            <div className="inline-flex items-center justify-center gap-2 px-4 py-2 glass-strong rounded-full border border-primary/30 mb-6 hover:border-primary/50 transition-all duration-300">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-primary">Join DojoHunt</span>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold mb-4">
              <span className="text-gradient">Create Account</span>
            </h1>
            <p className="text-lg md:text-xl text-foreground/70 max-w-xl mx-auto">
              Start your coding journey with Ethereum staking
            </p>
          </div>

          <Card className="glass-strong border-border/50 shadow-2xl animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
            <CardHeader className="space-y-3 pb-6">
              <CardTitle className="text-2xl md:text-3xl font-display font-semibold text-center">
                Get Started
              </CardTitle>
              <CardDescription className="text-center text-foreground/70 text-base">
                Fill in your details to create your account
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <Alert className="glass-light border-red-500/30 bg-red-500/10 text-red-400 rounded-xl">
                    <AlertDescription className="font-medium">{error}</AlertDescription>
                  </Alert>
                )}
                {success && (
                  <Alert className="glass-light border-green-500/30 bg-green-500/10 text-green-400 rounded-xl">
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    <AlertDescription className="font-medium">{success}</AlertDescription>
                  </Alert>
                )}

                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-3">
                    <Label htmlFor="name" className="text-foreground/90 font-semibold text-sm">Full Name</Label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-foreground/40" />
                      <Input
                        id="name"
                        name="name"
                        type="text"
                        placeholder="Enter your full name"
                        value={formData.name}
                        onChange={handleInputChange}
                        className="pl-12 h-12 glass-light border-border/30 rounded-xl focus:border-primary/50 transition-all"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="email" className="text-foreground/90 font-semibold text-sm">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-foreground/40" />
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="Enter your email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className="pl-12 h-12 glass-light border-border/30 rounded-xl focus:border-primary/50 transition-all"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <Label htmlFor="username" className="text-foreground/90 font-semibold text-sm">Username</Label>
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
                    />
                  </div>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-3">
                    <Label htmlFor="password" className="text-foreground/90 font-semibold text-sm">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-foreground/40" />
                      <Input
                        id="password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Create a password"
                        value={formData.password}
                        onChange={handleInputChange}
                        className="pl-12 pr-12 h-12 glass-light border-border/30 rounded-xl focus:border-primary/50 transition-all"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-foreground/40 hover:text-foreground/70 transition-colors"
                      >
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="confirmPassword" className="text-foreground/90 font-semibold text-sm">Confirm Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-foreground/40" />
                      <Input
                        id="confirmPassword"
                        name="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Confirm your password"
                        value={formData.confirmPassword}
                        onChange={handleInputChange}
                        className="pl-12 pr-12 h-12 glass-light border-border/30 rounded-xl focus:border-primary/50 transition-all"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-foreground/40 hover:text-foreground/70 transition-colors"
                      >
                        {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>
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
                  <p className="text-xs text-foreground/60 mt-2">
                    Connect your wallet to enable staking features. You can also connect it later in settings.
                  </p>
                </div>

                <div className="flex items-start gap-3 p-4 glass-light border border-border/30 rounded-xl">
                  <Checkbox
                    id="agreeToTerms"
                    name="agreeToTerms"
                    checked={formData.agreeToTerms}
                    onCheckedChange={(checked) =>
                      setFormData((prev) => ({
                        ...prev,
                        agreeToTerms: !!checked,
                      }))
                    }
                    className="mt-0.5"
                  />
                  <Label htmlFor="agreeToTerms" className="text-sm text-foreground/70 leading-relaxed cursor-pointer flex-1">
                    I agree to the{" "}
                    <Link href="/terms" className="text-primary hover:text-primary/80 font-semibold hover:underline transition-colors">
                      Terms of Service
                    </Link>{" "}
                    and{" "}
                    <Link
                      href="/privacy"
                      className="text-primary hover:text-primary/80 font-semibold hover:underline transition-colors"
                    >
                      Privacy Policy
                    </Link>
                  </Label>
                </div>

                <Button 
                  type="submit" 
                  className="w-full h-12 gradient-purple hover:opacity-90 rounded-xl font-semibold shadow-lg shadow-primary/30 hover:shadow-primary/50 transition-all duration-300 hover:scale-[1.02]" 
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating Account...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Create Account
                    </>
                  )}
                </Button>
              </form>

              <div className="text-center text-sm pt-6 border-t border-border/30">
                <span className="text-foreground/60">
                  Already have an account?{" "}
                </span>
                <Link
                  href="/auth/signin"
                  className="text-primary hover:text-primary/80 font-semibold hover:underline transition-colors"
                >
                  Sign in
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
