import "@/app/globals.css";
import { Footer } from "@/components/footer";
import { Navbar } from "@/components/navbar";
import { AptosWalletProvider } from "@/components/aptos-wallet-provider";
import { Providers } from "@/components/session-provider";
import { ThemeProvider } from "@/components/theme-provider";
import type { Metadata } from "next";
import { Inter, Montserrat, Poppins, Space_Grotesk } from "next/font/google";
import type React from "react";

const inter = Inter({ 
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const montserrat = Montserrat({ 
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-montserrat",
  display: "swap",
});

const poppins = Poppins({ 
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-poppins",
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({ 
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-space-grotesk",
  display: "swap",
});

export const metadata: Metadata = {
  title: "DojoHunt - Coding Challenges with Staking",
  description:
    "Challenge yourself with coding problems while staking tokens. Complete challenges to earn rewards.",
  icons: {
    icon: "/favicon.svg",
    apple: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="dark">
      <body className={`${inter.variable} ${montserrat.variable} ${poppins.variable} ${spaceGrotesk.variable} font-sans min-h-screen bg-background antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          <AptosWalletProvider>
            <Providers>
              <div className="flex flex-col min-h-screen relative overflow-hidden">
                {/* Subtle animated background with minimal purple accents */}
                <div className="fixed inset-0 -z-10">
                  <div className="absolute inset-0 bg-background" />
                  <div className="absolute top-0 right-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl opacity-50" />
                  <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-purple-600/5 rounded-full blur-3xl opacity-50" />
                </div>

                <main className="flex-1 relative z-10">{children}</main>
              </div>
            </Providers>
          </AptosWalletProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
