"use client";

import { AptosWalletAdapterProvider } from "@aptos-labs/wallet-adapter-react";
import { ReactNode } from "react";

export function AptosWalletProvider({ children }: { children: ReactNode }) {
  return (
    <AptosWalletAdapterProvider
      autoConnect={true}
      onError={(error) => {
        // Don't log user rejections as errors - these are expected user actions
        if (error?.message?.includes("rejected") || error?.name === "UserRejectedRequest") {
          // User rejected the request - this is fine, don't log as error
          return;
        }
        // Only log actual errors
        console.error("Wallet error:", error);
      }}
    >
      {children}
    </AptosWalletAdapterProvider>
  );
}

