"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Coins, Loader2, CheckCircle2, Wallet, X } from "lucide-react";
import { ConnectWallet } from "@/components/connect-wallet";

export function WelcomeTokensPopup() {
  const { data: session, update } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [hasClaimed, setHasClaimed] = useState(false);
  const [hasWallet, setHasWallet] = useState(false);
  const [transactionHash, setTransactionHash] = useState("");

  // Check if user has claimed welcome tokens
  useEffect(() => {
    const checkStatus = async () => {
      if (!session?.user?.id) return;

      try {
        const response = await fetch("/api/tokens/claim-welcome");
        if (response.ok) {
          const data = await response.json();
          setHasClaimed(data.hasClaimed);
          setHasWallet(data.hasWallet);

          // Show popup if user hasn't claimed (show for all new users)
          if (!data.hasClaimed) {
            // Small delay to ensure page is loaded
            setTimeout(() => {
              setIsOpen(true);
            }, 1000);
          }
        } else {
          // If API returns error, log it but don't block popup
          console.error("Error checking welcome tokens status:", response.status);
        }
      } catch (err) {
        console.error("Error checking welcome tokens status:", err);
        // Even if API fails, we can still show the popup
        // The user can try to claim and we'll handle errors there
      }
    };

    checkStatus();
  }, [session]);

  const handleClaim = async () => {
    if (!hasWallet) {
      setError("Please connect your wallet first to receive tokens");
      return;
    }

    setIsLoading(true);
    setError("");
    setSuccess(false);

    try {
      const response = await fetch("/api/tokens/claim-welcome", {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to claim tokens");
      }

      setSuccess(true);
      setHasClaimed(true);
      setTransactionHash(data.transactionHash || "");
      
      // Update session
      await update();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleWalletConnected = () => {
    setHasWallet(true);
    setError("");
  };

  const handleWalletDisconnected = () => {
    setHasWallet(false);
  };

  // Don't show if user has already claimed
  if (hasClaimed) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="glass-strong border-border/50 shadow-2xl max-w-md">
        <DialogHeader className="text-center space-y-3">
          <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-purple-500/20 to-purple-600/10 flex items-center justify-center mb-2">
            <Coins className="h-8 w-8 text-primary" />
          </div>
          <DialogTitle className="text-2xl font-display font-bold text-gradient">
            Welcome to DojoHunt! 🎉
          </DialogTitle>
          <DialogDescription className="text-foreground/70 text-base">
            Get started with <span className="font-semibold text-primary">10 free TSKULL tokens</span> to begin your coding journey!
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {error && (
            <Alert className="glass-light border-red-500/30 bg-red-500/10 text-red-400 rounded-xl">
              <AlertDescription className="font-medium">{error}</AlertDescription>
            </Alert>
          )}

          {success ? (
            <div className="space-y-4">
              <Alert className="glass-light border-green-500/30 bg-green-500/10 text-green-400 rounded-xl">
                <CheckCircle2 className="h-4 w-4 mr-2" />
                <AlertDescription className="font-medium">
                  Successfully claimed 10 TSKULL tokens!
                  {transactionHash && (
                    <div className="mt-2 text-xs opacity-80">
                      Transaction: {transactionHash.slice(0, 10)}...
                    </div>
                  )}
                </AlertDescription>
              </Alert>
              <Button
                onClick={() => setIsOpen(false)}
                className="w-full gradient-purple hover:opacity-90 rounded-xl font-semibold"
              >
                Get Started
              </Button>
            </div>
          ) : (
            <>
              {!hasWallet ? (
                <div className="space-y-3">
                  <p className="text-sm text-foreground/70 text-center">
                    Connect your Aptos wallet to receive your welcome tokens
                  </p>
                  <ConnectWallet
                    onWalletConnected={handleWalletConnected}
                    onWalletDisconnected={handleWalletDisconnected}
                    variant="default"
                    className="w-full"
                  />
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="glass-light rounded-xl p-4 border border-primary/20">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-foreground/90">
                        Tokens to receive:
                      </span>
                      <span className="text-lg font-bold text-primary">10 TSKULL</span>
                    </div>
                    <p className="text-xs text-foreground/60 mt-2">
                      These tokens will be sent directly to your connected wallet
                    </p>
                  </div>

                  <Button
                    onClick={handleClaim}
                    disabled={isLoading}
                    className="w-full gradient-purple hover:opacity-90 rounded-xl font-semibold shadow-lg shadow-primary/30 hover:shadow-primary/50 transition-all duration-300"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Claiming Tokens...
                      </>
                    ) : (
                      <>
                        <Coins className="mr-2 h-4 w-4" />
                        Claim 10 Free Tokens
                      </>
                    )}
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}


