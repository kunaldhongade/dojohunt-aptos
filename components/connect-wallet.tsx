"use client";

import { Button } from "@/components/ui/button";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { Wallet, CheckCircle2, Loader2 } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface ConnectWalletProps {
  onWalletConnected?: (address: string) => void;
  onWalletDisconnected?: () => void;
  className?: string;
  variant?: "default" | "outline" | "ghost";
  showAddress?: boolean;
  disabled?: boolean;
}

export function ConnectWallet({
  onWalletConnected,
  onWalletDisconnected,
  className,
  variant = "default",
  showAddress = true,
  disabled = false,
}: ConnectWalletProps) {
  const { 
    connect, 
    disconnect, 
    account, 
    connected, 
    connecting, 
    wallet,
    wallets
  } = useWallet();
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const walletAddress = account?.address?.toString();

  // Use refs to store callbacks to avoid dependency issues
  const onWalletConnectedRef = useRef(onWalletConnected);
  const onWalletDisconnectedRef = useRef(onWalletDisconnected);
  const previousWalletAddressRef = useRef<string | undefined>(undefined);
  const previousConnectedRef = useRef<boolean | undefined>(undefined);
  const isInitialMountRef = useRef(true);

  // Update refs when callbacks change
  useEffect(() => {
    onWalletConnectedRef.current = onWalletConnected;
    onWalletDisconnectedRef.current = onWalletDisconnected;
  }, [onWalletConnected, onWalletDisconnected]);

  // Update wallet address in backend
  const updateWalletAddress = async (address: string) => {
    setIsUpdating(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/update-wallet", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ walletAddress: address }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update wallet address");
      }

      // Update the ref and call callback only if address changed
      if (previousWalletAddressRef.current !== address) {
        previousWalletAddressRef.current = address;
        onWalletConnectedRef.current?.(address);
      }
    } catch (err) {
      console.error("Error updating wallet address:", err);
      setError(err instanceof Error ? err.message : "Failed to update wallet");
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle wallet update after connection
  useEffect(() => {
    if (connected && walletAddress && !isUpdating) {
      updateWalletAddress(walletAddress);
    }
  }, [connected, walletAddress, isUpdating]);

  // Notify parent component of wallet state changes
  useEffect(() => {
    // Skip on initial mount to avoid unnecessary callbacks
    if (isInitialMountRef.current) {
      isInitialMountRef.current = false;
      previousConnectedRef.current = connected;
      previousWalletAddressRef.current = walletAddress;
      return;
    }

    const wasConnected = previousConnectedRef.current === true;
    const previousAddress = previousWalletAddressRef.current;
    const isConnected = connected === true;

    const walletStateChanged = 
      wasConnected !== connected ||
      previousAddress !== walletAddress;

    if (!walletStateChanged) return;

    // Update refs AFTER checking old values
    previousConnectedRef.current = connected;
    previousWalletAddressRef.current = walletAddress;

    // Notify parent only when state actually changes
    if (isConnected && (!wasConnected || previousAddress !== walletAddress)) {
      // Wallet connected or address changed
      onWalletConnectedRef.current?.(walletAddress!);
    } else if (!isConnected && wasConnected) {
      // Wallet disconnected
      onWalletDisconnectedRef.current?.();
    }
  }, [connected, walletAddress]);

  const handleConnect = async () => {
    // Get the first available wallet
    const availableWallet = wallet || wallets.find((w: any) => w.readyState === "Installed") || wallets[0];
    
    if (!availableWallet) {
      setError("No wallet available. Please install an Aptos wallet extension (Petra, Pontem, or Martian).");
      // Open wallet installation links
      window.open("https://petra.app/", "_blank");
      return;
    }
    
    try {
      setError(null);
      await connect(availableWallet.name);
    } catch (err) {
      console.error("Connection error:", err);
      setError(err instanceof Error ? err.message : "Failed to connect wallet");
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnect();
      onWalletDisconnected?.();
    } catch (err) {
      console.error("Disconnect error:", err);
      setError(err instanceof Error ? err.message : "Failed to disconnect wallet");
    }
  };

  const formatAddress = (address: string) => {
    if (!address) return "";
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  if (connecting) {
    return (
      <Button
        disabled
        variant={variant}
        className={cn("glass-light border-border/50", className)}
      >
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Connecting...
      </Button>
    );
  }

  if (connected && walletAddress) {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <Button
            variant={variant === "outline" ? "outline" : "default"}
            disabled={disabled || isUpdating}
            onClick={handleDisconnect}
            className={cn(
              variant === "default"
                ? "gradient-purple hover:opacity-90"
                : "glass-strong hover:glass border-border/50 hover:border-primary/30",
              "rounded-lg",
              className
            )}
          >
            {isUpdating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Updating...
              </>
            ) : (
              <>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                {showAddress ? formatAddress(walletAddress) : "Connected"}
              </>
            )}
          </Button>
          {error && (
            <span className="text-xs text-red-400">{error}</span>
          )}
        </div>
        {showAddress && (
          <p className="text-xs text-foreground/60 font-mono">
            {walletAddress}
          </p>
        )}
      </div>
    );
  }

  const availableWallet = wallet || wallets.find((w: any) => w.readyState === "Installed") || wallets[0];
  const hasWallets = wallets.length > 0;

  return (
    <div className="space-y-2">
      <Button
        variant={variant === "outline" ? "outline" : "default"}
        disabled={disabled || !hasWallets}
        onClick={handleConnect}
        className={cn(
          variant === "default"
            ? "gradient-purple hover:opacity-90"
            : "glass-strong hover:glass border-border/50 hover:border-primary/30",
          "rounded-lg",
          className
        )}
      >
        <Wallet className="mr-2 h-4 w-4" />
        {availableWallet ? `Connect ${availableWallet.name}` : "Connect Wallet"}
      </Button>
      {error && (
        <p className="text-xs text-red-400">{error}</p>
      )}
      {!hasWallets && !error && (
        <p className="text-xs text-foreground/60">
          No wallet detected. Install{" "}
          <a href="https://petra.app/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
            Petra
          </a>
          ,{" "}
          <a href="https://pontem.network/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
            Pontem
          </a>
          , or{" "}
          <a href="https://martianwallet.xyz/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
            Martian
          </a>
          .
        </p>
      )}
    </div>
  );
}
