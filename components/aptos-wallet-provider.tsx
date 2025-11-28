"use client";

import { WalletProvider } from "@aptos-labs/wallet-adapter-react";
import { PetraWallet } from "petra-plugin-wallet-adapter";
import { PontemWallet } from "@pontem/wallet-adapter-plugin";
import { MartianWallet } from "@martianwallet/aptos-wallet-adapter";
import { RiseWallet } from "@rise-wallet/wallet-adapter";
import { FewchaWallet } from "fewcha-plugin-wallet-adapter";
import { Network } from "@aptos-labs/ts-sdk";
import { ReactNode } from "react";

const APTOS_NETWORK = (process.env.NEXT_PUBLIC_APTOS_NETWORK || "testnet") as Network;

const wallets = [
  new PetraWallet(),
  new PontemWallet(),
  new MartianWallet(),
  new RiseWallet(),
  new FewchaWallet(),
];

export function AptosWalletProvider({ children }: { children: ReactNode }) {
  return (
    <WalletProvider
      wallets={wallets}
      autoConnect={true}
      onError={(error) => {
        console.error("Wallet error:", error);
      }}
    >
      {children}
    </WalletProvider>
  );
}

