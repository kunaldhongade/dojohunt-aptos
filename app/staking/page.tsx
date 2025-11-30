"use client";

import { Footer } from "@/components/footer";
import { Navbar } from "@/components/navbar";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getAptosClient } from "@/lib/blockchain";
import {
  getStakingContractAddress,
  getTokenBalanceClient,
  getTokenInfoClient,
  stakeTokensClient,
  unstakeTokensClient,
} from "@/lib/contract-helpers";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { AlertCircle, CheckCircle2, Coins, Info, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

interface Stake {
  id: string;
  amount: number;
  startTime: string;
  endTime: string;
  challengesRequired: number;
  challengesCompleted: number;
  status: string;
  timeRemaining?: number;
  challenges?: Array<{
    id: string;
    title: string;
    difficulty: string;
    category: string;
  }>;
  completedChallenges?: string[];
}

export default function Staking() {
  const { account, connected, connect, wallet, signAndSubmitTransaction, wallets } = useWallet();
  const [stakeAmount, setStakeAmount] = useState("0");
  const [stakingPeriod, setStakingPeriod] = useState("5");
  const [isStaking, setIsStaking] = useState(false);
  const [isUnstaking, setIsUnstaking] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [stake, setStake] = useState<Stake | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stakeError, setStakeError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("stake");

  // Token info
  const [tokenBalance, setTokenBalance] = useState<string>("0");
  const [tokenSymbol, setTokenSymbol] = useState<string>("TSKULL");

  const walletAddress = account?.address?.toString();

  useEffect(() => {
    fetchStakeData();
  }, []);

  // Update active tab when stake changes
  useEffect(() => {
    if (stake) {
      setActiveTab("unstake");
    } else {
      setActiveTab("stake");
    }
  }, [stake]);

  useEffect(() => {
    if (connected && walletAddress) {
      fetchTokenInfo();
    }
  }, [connected, walletAddress]);

  const fetchTokenInfo = async () => {
    if (!walletAddress) return;

    try {
      const aptos = getAptosClient();

      // Get token info (with fallback) - run in parallel with balance
      const tokenInfoPromise = getTokenInfoClient(aptos).catch((err) => {
        // Only log unexpected errors
        const errorMsg = err?.message || String(err || "");
        if (!errorMsg.includes("not found") && !errorMsg.includes("split")) {
          console.error("Error fetching token info:", errorMsg);
        }
        return { symbol: "TSKULL", name: "TSKULL", decimals: 8 }; // Fallback with correct decimals
      });

      // Get token balance using balance.ts (works for fungible assets)
      const balancePromise = getTokenBalanceClient(aptos, walletAddress).catch((err) => {
        // Only log unexpected errors
        const errorMsg = err?.message || String(err || "");
        if (!errorMsg.includes("not found") && !errorMsg.includes("split")) {
          console.error("Error fetching token balance:", errorMsg);
        }
        return { balance: "0", rawBalance: "0" }; // Fallback
      });

      // Wait for both to complete
      const [tokenInfo, balance] = await Promise.all([tokenInfoPromise, balancePromise]);

      // Update state
      setTokenSymbol(tokenInfo.symbol);
      setTokenBalance(balance.balance);
    } catch (err) {
      console.error("Error in fetchTokenInfo:", err);
      // Set fallback values
      setTokenSymbol("TSKULL");
      setTokenBalance("0");
    }
  };

  const fetchStakeData = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      // Add cache-busting parameter to ensure fresh data
      const cacheBuster = isRefresh ? `?t=${Date.now()}` : "";
      const response = await fetch(`/api/staking/stake${cacheBuster}`, {
        method: "GET",
        credentials: "include", // Include cookies for session
        cache: "no-store", // Prevent caching
      });

      if (response.ok) {
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          try {
            const data = await response.json();
            // Explicitly set stake to null if API returns null
            setStake(data.stake || null);
            setError(null); // Clear any previous errors

            // Log for debugging
            if (isRefresh) {
              console.log("Stake data refreshed:", data.stake ? "Active stake found" : "No active stake");
            }
          } catch (parseError) {
            console.error("Error parsing stake data response:", parseError);
            setError("Failed to parse stake data");
            setStake(null);
          }
        } else {
          const text = await response.text();
          console.error("Non-JSON response from stake API:", text);
          setError("Invalid response from server");
          setStake(null);
        }
      } else if (response.status === 401) {
        setError("Please sign in to view your stake information");
        setStake(null);
      } else {
        // Try to get error message from JSON response
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          try {
            const errorData = await response.json();
            setError(errorData.error || "Failed to load stake data");
          } catch {
            setError("Failed to load stake data");
          }
        } else {
          setError("Failed to load stake data");
        }
        setStake(null);
      }
    } catch (err) {
      console.error("Error fetching stake data:", err);
      setError("Failed to load stake data");
      setStake(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleStake = async () => {
    if (!connected || !account || !wallet) {
      setStakeError("Please connect your wallet first");
      if (wallet) {
        connect(wallet.name);
      }
      return;
    }

    if (stake) {
      setStakeError(
        "You already have an active stake. Please complete it or wait for it to expire."
      );
      return;
    }

    const stakeAmountNum = Number.parseFloat(stakeAmount);
    const periodDaysNum = Number.parseInt(stakingPeriod, 10);

    if (stakeAmountNum <= 0) {
      setStakeError(`Stake amount must be greater than 0`);
      return;
    }

    // Check balance with more precision
    const balanceNum = Number.parseFloat(tokenBalance);
    if (isNaN(balanceNum) || balanceNum < stakeAmountNum) {
      setStakeError(
        `Insufficient token balance. You have ${tokenBalance} ${tokenSymbol}, but trying to stake ${stakeAmount} ${tokenSymbol}`
      );
      return;
    }

    // Additional check: ensure we have at least a small buffer for gas
    if (balanceNum < stakeAmountNum + 0.01) {
      console.warn("Balance is very close to staking amount, might fail due to gas fees");
    }

    // Validate staking period (1-90 days)
    if (periodDaysNum < 1 || periodDaysNum > 90) {
      setStakeError(`Staking period must be between 1 and 90 days`);
      return;
    }

    setIsStaking(true);
    setStakeError(null);
    setIsSuccess(false);

    try {
      if (!signAndSubmitTransaction || !walletAddress) {
        setStakeError("Wallet not available");
        return;
      }

      // Use wallet adapter's signAndSubmitTransaction
      const tx = await stakeTokensClient(
        signAndSubmitTransaction,
        walletAddress,
        stakeAmount,
        periodDaysNum
      );

      // Wait for transaction
      const receipt = await tx.wait();

      if (receipt.success) {
        // Transaction successful, now verify with backend
        const response = await fetch("/api/staking/stake", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            transactionHash: receipt.hash,
            walletAddress: walletAddress,
          }),
        });

        if (response.ok) {
          const contentType = response.headers.get("content-type");
          if (contentType && contentType.includes("application/json")) {
            const data = await response.json();
            setStake(data.stake);
            setIsSuccess(true);
            // Refresh stake data
            await fetchStakeData();
          } else {
            const text = await response.text();
            console.error("Non-JSON response from staking API:", text);
            setStakeError("Invalid response from server. Please try again.");
          }
        } else {
          // Try to parse JSON error, but handle HTML errors gracefully
          const contentType = response.headers.get("content-type");
          if (contentType && contentType.includes("application/json")) {
            try {
              const errorData = await response.json();
              setStakeError(
                errorData.error || "Failed to verify staking transaction"
              );
            } catch (parseError) {
              console.error("Error parsing JSON error response:", parseError);
              setStakeError(`Staking failed: ${response.status} ${response.statusText}`);
            }
          } else {
            const text = await response.text();
            console.error("Non-JSON error response:", text);
            setStakeError(`Staking failed: ${response.status} ${response.statusText}`);
          }
        }
      } else {
        setStakeError("Transaction failed");
      }
    } catch (err: any) {
      console.error("Staking error:", err);
      const errorMessage = err?.message || String(err || "");

      if (errorMessage.includes("rejected") || errorMessage.includes("User rejected")) {
        setStakeError("Transaction was rejected");
      } else if (errorMessage.includes("insufficient")) {
        setStakeError(errorMessage || "Insufficient token balance");
      } else {
        setStakeError(
          errorMessage || "Failed to stake tokens. Please try again."
        );
      }
    } finally {
      setIsStaking(false);
    }
  };

  // This function is kept for compatibility but does nothing
  const handleApprove = async () => {
    setStakeError("Aptos doesn't require token approval. You can stake directly.");
  };

  const handleUnstake = async () => {
    if (!connected || !account || !wallet) {
      setStakeError("Please connect your wallet first");
      return;
    }

    if (!stake) {
      setStakeError("No active stake to unstake");
      return;
    }

    setIsUnstaking(true);
    setStakeError(null);

    try {
      if (!signAndSubmitTransaction || !walletAddress) {
        setStakeError("Wallet not available");
        return;
      }

      // Use wallet adapter's signAndSubmitTransaction
      const tx = await unstakeTokensClient(
        signAndSubmitTransaction,
        walletAddress
      );

      // Wait for transaction
      const receipt = await tx.wait();

      if (receipt && receipt.success !== false) {
        // Verify and update unstake transaction on backend
        const response = await fetch("/api/staking/unstake", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            transactionHash: tx.hash,
            walletAddress: walletAddress,
          }),
        });

        // Check content-type before parsing
        const contentType = response.headers.get("content-type");

        if (response.ok) {
          if (contentType && contentType.includes("application/json")) {
            try {
              const responseData = await response.json();
              console.log("Unstake response:", responseData);

              // Transaction successful - clear stake immediately
              setIsSuccess(true);
              setStake(null);
              setActiveTab("stake"); // Switch to stake tab

              // Wait a bit for database to update, then refresh multiple times to ensure sync
              await new Promise(resolve => setTimeout(resolve, 500));

              // Force refresh stake data (bypass cache) - try multiple times
              await fetchStakeData(true);

              // Double-check after another delay
              await new Promise(resolve => setTimeout(resolve, 1000));
              await fetchStakeData(true);

              // Refresh token balance
              await fetchTokenInfo();
            } catch (parseError) {
              console.error("Error parsing unstake response:", parseError);
              setStakeError("Invalid response from server. Please refresh the page.");
            }
          } else {
            const text = await response.text();
            console.error("Non-JSON response from unstake API:", text);
            setStakeError("Invalid response from server. Please try again.");
          }
        } else {
          // Handle error response
          if (contentType && contentType.includes("application/json")) {
            try {
              const errorData = await response.json();
              setStakeError(
                errorData.error || "Failed to verify unstaking transaction"
              );
            } catch (parseError) {
              console.error("Error parsing JSON error response:", parseError);
              setStakeError(`Unstaking failed: ${response.status} ${response.statusText}`);
            }
          } else {
            const text = await response.text();
            console.error("Non-JSON error response:", text);
            setStakeError(`Unstaking failed: ${response.status} ${response.statusText}`);
          }
        }
      } else {
        setStakeError("Transaction failed");
      }
    } catch (err: any) {
      console.error("Unstaking error:", err);
      if (err.message?.includes("rejected") || err.message?.includes("User rejected")) {
        setStakeError("Transaction was rejected");
      } else {
        setStakeError(
          err.message || "Failed to unstake tokens. Please try again."
        );
      }
    } finally {
      setIsUnstaking(false);
    }
  };

  const getTimeRemaining = (endTime: string | number) => {
    const now = new Date();
    const end =
      typeof endTime === "string" ? new Date(endTime) : new Date(endTime);
    const diff = end.getTime() - now.getTime();

    if (diff <= 0) return "Expired";

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) {
      return `${days} day${days !== 1 ? "s" : ""} ${hours} hour${hours !== 1 ? "s" : ""
        }`;
    } else if (hours > 0) {
      return `${hours} hour${hours !== 1 ? "s" : ""} ${minutes} minute${minutes !== 1 ? "s" : ""
        }`;
    } else {
      return `${minutes} minute${minutes !== 1 ? "s" : ""}`;
    }
  };

  const getStakingPeriodDays = (startTime: string, endTime: string) => {
    const start = new Date(startTime);
    const end = new Date(endTime);
    const diff = end.getTime() - start.getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen pt-20 flex items-center justify-center">
          <div className="flex flex-col items-center space-y-4">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <span className="text-foreground/70">Loading stake information...</span>
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
        <div className="relative py-12 px-4 sm:px-6 lg:px-8 mb-8">
          <div className="container mx-auto max-w-7xl">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 animate-fade-in-up">
              <div>
                <h1 className="text-4xl md:text-5xl font-display font-bold mb-3">
                  <span className="text-gradient">Stake & Earn</span>
                </h1>
                <p className="text-lg text-foreground/70">
                  Stake your tokens to unlock coding challenges and earn rewards
                </p>
              </div>
              <Button
                variant="outline"
                onClick={() => fetchStakeData(true)}
                disabled={refreshing || loading}
                className="glass-strong border-border/50 hover:border-border/70 rounded-xl"
              >
                {refreshing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Refreshing...
                  </>
                ) : (
                  "Refresh"
                )}
              </Button>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">

          {error && (
            <Alert className="mb-6 glass-strong border-red-500/30 bg-red-500/10 text-red-400 animate-fade-in">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="grid gap-8 lg:grid-cols-3">
            {/* How It Works Section */}
            <div className="lg:col-span-1 space-y-6">
              <Card className="glass-strong border-border/50 animate-fade-in-up">
                <CardHeader>
                  <CardTitle className="text-xl font-display font-semibold">How Staking Works</CardTitle>
                  <CardDescription className="text-foreground/70">
                    Learn about our unique staking mechanism
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-6">
                  <div className="flex gap-4 items-start group">
                    <div className="p-3 bg-gradient-to-br from-purple-500/20 to-purple-600/10 rounded-xl group-hover:scale-110 transition-transform">
                      <Coins className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">Stake Your Tokens</h3>
                      <p className="text-sm text-foreground/70">
                        Stake TSKULL tokens for a customizable period (1-90 days) to unlock a
                        set of 5 coding challenges.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-4 items-start group">
                    <div className="p-3 bg-gradient-to-br from-green-500/20 to-green-600/10 rounded-xl group-hover:scale-110 transition-transform">
                      <CheckCircle2 className="h-6 w-6 text-green-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">Complete Challenges</h3>
                      <p className="text-sm text-foreground/70">
                        Successfully complete all 5 challenges within the
                        staking period to meet the requirements.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-4 items-start group">
                    <div className="p-3 bg-gradient-to-br from-yellow-500/20 to-yellow-600/10 rounded-xl group-hover:scale-110 transition-transform">
                      <Coins className="h-6 w-6 text-yellow-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">Unstake Your Tokens</h3>
                      <p className="text-sm text-foreground/70">
                        If you complete all challenges, you can unstake your
                        tokens without any fee. If not, a small fee will be
                        applied.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Alert className="glass-light border-border/50 bg-purple-500/5">
                <Info className="h-4 w-4 text-primary" />
                <AlertTitle className="text-foreground">Important Information</AlertTitle>
                <AlertDescription className="text-foreground/70">
                  Make sure your wallet is connected and has sufficient TSKULL tokens
                  balance before staking. The staking contract is audited and
                  secure.
                </AlertDescription>
              </Alert>
            </div>

            {/* Staking Tabs */}
            <div className="lg:col-span-2">
              <Tabs
                value={activeTab}
                onValueChange={setActiveTab}
                className="w-full"
              >
                <TabsList className="glass-strong border-border/50 rounded-xl p-1 mb-6">
                  <TabsTrigger
                    value="stake"
                    className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-6 py-2 transition-all"
                  >
                    Stake
                  </TabsTrigger>
                  <TabsTrigger
                    value="unstake"
                    className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-6 py-2 transition-all"
                  >
                    Unstake
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="stake" className="mt-0">
                  <Card className="glass-strong border-border/50 animate-fade-in-up">
                    <CardHeader>
                      <CardTitle className="text-2xl font-display font-semibold">Stake Tokens</CardTitle>
                      <CardDescription className="text-foreground/70">
                        Stake your tokens to unlock coding challenges
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-4">
                      {stake ? (
                        <Alert className="glass-light border-blue-500/30 bg-blue-500/10 text-blue-400">
                          <Info className="h-4 w-4" />
                          <AlertTitle>Active Stake Detected</AlertTitle>
                          <AlertDescription>
                            You already have an active stake. Please complete
                            your challenges or wait for the stake period to
                            expire before creating a new one.
                          </AlertDescription>
                        </Alert>
                      ) : (
                        <>
                          {!connected && (
                            <Alert className="glass-light border-blue-500/30 bg-blue-500/10 text-blue-400">
                              <Info className="h-4 w-4" />
                              <AlertTitle>Connect Wallet</AlertTitle>
                              <AlertDescription>
                                Please connect your Aptos wallet to stake tokens.
                              </AlertDescription>
                              <Button
                                className="mt-3 gradient-purple hover:opacity-90 rounded-xl shadow-lg shadow-primary/30"
                                onClick={async () => {
                                  const availableWallet = wallet || wallets.find((w: any) => w.readyState === "Installed") || wallets[0];
                                  if (availableWallet) {
                                    await connect(availableWallet.name);
                                  } else {
                                    alert("No wallet detected. Please install an Aptos wallet extension.");
                                  }
                                }}
                                size="sm"
                              >
                                Connect Wallet
                              </Button>
                            </Alert>
                          )}

                          {connected && walletAddress && (
                            <>
                              <Alert className="glass-light border-green-500/30 bg-green-500/10 text-green-400">
                                <CheckCircle2 className="h-4 w-4" />
                                <AlertTitle>Wallet Connected</AlertTitle>
                                <AlertDescription className="font-mono">
                                  {walletAddress.slice(0, 6)}...
                                  {walletAddress.slice(-4)}
                                </AlertDescription>
                              </Alert>
                              <div className="glass-light border-border/30 p-4 rounded-xl">
                                <div className="flex justify-between items-center mb-3">
                                  <span className="text-sm font-semibold text-foreground/80">
                                    Token Balance:
                                  </span>
                                  <span className="text-sm font-mono font-semibold text-primary">
                                    {tokenBalance} {tokenSymbol}
                                  </span>
                                </div>
                              </div>
                            </>
                          )}

                          <div className="grid gap-4">
                            <div className="grid gap-2">
                              <Label htmlFor="stake-amount" className="text-foreground/80 font-semibold">
                                Stake Amount ({tokenSymbol})
                              </Label>
                              <Input
                                id="stake-amount"
                                type="number"
                                value={stakeAmount}
                                onChange={(e) => {
                                  setStakeAmount(e.target.value);
                                  // Aptos doesn't require approval - tokens are transferred directly
                                }}
                                min="0"
                                step="0.000000000000000001"
                                disabled={!!stake || !connected}
                                className="glass-light border-border/30 rounded-xl h-12 focus:border-primary"
                              />
                              <p className="text-xs text-foreground/60">
                                Enter any amount greater than 0
                              </p>
                            </div>
                            <div className="grid gap-2">
                              <Label htmlFor="staking-period" className="text-foreground/80 font-semibold">
                                Staking Period (Days)
                              </Label>
                              <Input
                                id="staking-period"
                                type="number"
                                value={stakingPeriod}
                                onChange={(e) => setStakingPeriod(e.target.value)}
                                min="1"
                                max="90"
                                step="1"
                                disabled={!!stake}
                                className="glass-light border-border/30 rounded-xl h-12 focus:border-primary"
                              />
                              <p className="text-xs text-foreground/60">
                                Period range: 1-90 days (you can choose any period within this range)
                              </p>
                            </div>
                            <div className="glass-light border-border/30 p-4 rounded-xl">
                              <h4 className="font-semibold mb-3 text-foreground/90">
                                Staking Summary
                              </h4>
                              <div className="grid gap-3 text-sm">
                                <div className="flex justify-between items-center">
                                  <span className="text-foreground/70">Amount to Stake:</span>
                                  <span className="font-semibold text-primary">
                                    {stakeAmount} {tokenSymbol}
                                  </span>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className="text-foreground/70">Staking Period:</span>
                                  <span className="font-semibold">
                                    {stakingPeriod} days
                                  </span>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className="text-foreground/70">Challenges to Complete:</span>
                                  <span className="font-semibold">5</span>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className="text-foreground/70">Fee if Incomplete:</span>
                                  <span className="font-semibold text-red-400">5% of stake</span>
                                </div>
                                <div className="flex justify-between items-center pt-2 border-t border-border/30">
                                  <span className="text-foreground/70">Network:</span>
                                  <span className="font-semibold text-blue-400">
                                    Aptos {process.env.NEXT_PUBLIC_APTOS_NETWORK || "testnet"}
                                  </span>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className="text-foreground/70">Token:</span>
                                  <span className="font-semibold text-blue-400">
                                    {tokenSymbol}
                                  </span>
                                </div>
                              </div>
                            </div>
                            {stakeError && (
                              <Alert className="glass-light border-red-500/30 bg-red-500/10 text-red-400">
                                <AlertCircle className="h-4 w-4" />
                                <AlertTitle>Error</AlertTitle>
                                <AlertDescription>{stakeError}</AlertDescription>
                              </Alert>
                            )}
                          </div>
                        </>
                      )}
                    </CardContent>
                    <CardFooter className="pt-6">
                      {stake ? (
                        <Button className="w-full h-12 glass-light border-border/50 rounded-xl" variant="outline" disabled>
                          Active Stake in Progress
                        </Button>
                      ) : isSuccess ? (
                        <Alert className="w-full glass-light border-green-500/30 bg-green-500/10 text-green-400">
                          <CheckCircle2 className="h-4 w-4" />
                          <AlertTitle>Success!</AlertTitle>
                          <AlertDescription>
                            Your tokens have been staked successfully. You can
                            now access the challenges.
                          </AlertDescription>
                        </Alert>
                      ) : (
                        <Button
                          className="w-full h-12 gradient-purple hover:opacity-90 rounded-xl shadow-lg shadow-primary/30 font-semibold"
                          onClick={handleStake}
                          disabled={
                            !connected ||
                            !account ||
                            isStaking ||
                            Number.parseFloat(stakeAmount) <= 0 ||
                            !!stake
                          }
                        >
                          {isStaking ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Staking...
                            </>
                          ) : (
                            `Stake ${tokenSymbol} Tokens`
                          )}
                        </Button>
                      )}
                    </CardFooter>
                  </Card>
                </TabsContent>
                <TabsContent value="unstake" className="mt-0">
                  <Card className="glass-strong border-border/50 animate-fade-in-up">
                    <CardHeader>
                      <CardTitle className="text-2xl font-display font-semibold">Unstake Tokens</CardTitle>
                      <CardDescription className="text-foreground/70">
                        Unstake your tokens after completing challenges
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-4">
                      {loading && !stake ? (
                        <div className="flex items-center justify-center py-12">
                          <Loader2 className="h-8 w-8 animate-spin text-primary" />
                          <span className="ml-3 text-foreground/70">
                            Loading stake data...
                          </span>
                        </div>
                      ) : error ? (
                        <Alert className="glass-light border-red-500/30 bg-red-500/10 text-red-400">
                          <AlertCircle className="h-4 w-4" />
                          <AlertTitle>Error</AlertTitle>
                          <AlertDescription>{error}</AlertDescription>
                        </Alert>
                      ) : !stake ? (
                        <Alert className="glass-light border-blue-500/30 bg-blue-500/10 text-blue-400">
                          <Info className="h-4 w-4" />
                          <AlertTitle>No Active Stake</AlertTitle>
                          <AlertDescription>
                            You don't have an active stake. Create a new stake
                            to get started.
                          </AlertDescription>
                        </Alert>
                      ) : (
                        <>
                          <Alert className="glass-light border-amber-500/30 bg-amber-500/10 text-amber-400 mb-4">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Challenge Requirements</AlertTitle>
                            <AlertDescription>
                              You need to complete {stake.challengesRequired}{" "}
                              challenges before unstaking to avoid fees. You've
                              completed {stake.challengesCompleted} of{" "}
                              {stake.challengesRequired} challenges.
                            </AlertDescription>
                          </Alert>

                          {/* Progress Bar */}
                          <div className="mb-4">
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-sm font-semibold text-foreground/80">
                                Progress
                              </span>
                              <span className="text-sm font-semibold text-primary">
                                {stake.challengesCompleted}/{stake.challengesRequired}
                              </span>
                            </div>
                            <Progress
                              value={(stake.challengesCompleted / stake.challengesRequired) * 100}
                              className="h-3 bg-purple-500/20"
                            />
                          </div>

                          <div className="glass-light border-border/30 p-4 rounded-xl mb-4">
                            <h4 className="font-semibold mb-4 text-foreground/90">Current Stake</h4>
                            <div className="grid gap-3 text-sm">
                              <div className="flex justify-between items-center">
                                <span className="text-foreground/70">Staked Amount:</span>
                                <span className="font-semibold text-primary">
                                  {stake.amount} {tokenSymbol}
                                </span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-foreground/70">Staking Period:</span>
                                <span className="font-semibold">
                                  {getStakingPeriodDays(
                                    stake.startTime,
                                    stake.endTime
                                  )}{" "}
                                  days
                                  {stake.endTime && (
                                    <span className="ml-2 text-foreground/60">
                                      ({getTimeRemaining(stake.endTime)}{" "}
                                      remaining)
                                    </span>
                                  )}
                                </span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-foreground/70">Challenges Completed:</span>
                                <span className="font-semibold">
                                  {stake.challengesCompleted}/
                                  {stake.challengesRequired}
                                </span>
                              </div>
                              <div className="flex justify-between items-center pt-2 border-t border-border/30">
                                <span className="text-foreground/70">Status:</span>
                                <span
                                  className={`font-semibold ${stake.status === "ACTIVE"
                                    ? stake.challengesCompleted ===
                                      stake.challengesRequired
                                      ? "text-green-400"
                                      : "text-amber-400"
                                    : "text-foreground/60"
                                    }`}
                                >
                                  {stake.status === "ACTIVE"
                                    ? stake.challengesCompleted ===
                                      stake.challengesRequired
                                      ? "Completed - Ready to Unstake"
                                      : "In Progress"
                                    : stake.status}
                                </span>
                              </div>
                              {stake.challenges &&
                                stake.challenges.length > 0 && (
                                  <div className="mt-4 pt-4 border-t border-border/30">
                                    <span className="text-xs font-semibold text-foreground/70 mb-2 block">
                                      Challenges:
                                    </span>
                                    <ul className="space-y-2">
                                      {stake.challenges.map((challenge) => (
                                        <li
                                          key={challenge.id}
                                          className="text-sm flex items-center gap-2 p-2 glass rounded-lg"
                                        >
                                          {stake.completedChallenges?.includes(
                                            challenge.id
                                          ) ? (
                                            <CheckCircle2 className="h-4 w-4 text-green-400" />
                                          ) : (
                                            <AlertCircle className="h-4 w-4 text-foreground/40" />
                                          )}
                                          <span
                                            className={
                                              stake.completedChallenges?.includes(
                                                challenge.id
                                              )
                                                ? "line-through text-foreground/60"
                                                : "text-foreground/90"
                                            }
                                          >
                                            {challenge.title}
                                          </span>
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                            </div>
                          </div>
                        </>
                      )}
                    </CardContent>
                    <CardFooter className="pt-6">
                      {stake ? (
                        <Button
                          className={`w-full h-12 rounded-xl font-semibold shadow-lg transition-all ${stake.challengesCompleted ===
                            stake.challengesRequired
                            ? "gradient-purple hover:opacity-90 shadow-primary/30"
                            : "bg-red-500/20 hover:bg-red-500/30 text-red-400 border-red-500/30 border"
                            }`}
                          onClick={handleUnstake}
                          disabled={!connected || !account || isUnstaking}
                        >
                          {isUnstaking ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Unstaking...
                            </>
                          ) : stake.challengesCompleted ===
                            stake.challengesRequired ? (
                            "Unstake (No Fee)"
                          ) : (
                            `Unstake Early (5% Fee)`
                          )}
                        </Button>
                      ) : (
                        <Button className="w-full h-12 glass-light border-border/50 rounded-xl" variant="outline" disabled>
                          No Active Stake
                        </Button>
                      )}
                    </CardFooter>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
