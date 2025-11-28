"use client";

import { Button } from "@/components/ui/button";
import Image from "next/image";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UserAvatar } from "@/components/user-avatar";
import { LogOut, Menu, X } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { useEffect, useState } from "react";

export function Navbar({
  isWide = true,
  variant = "default"
}: {
  isWide?: boolean;
  variant?: "default" | "compact";
}) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { data: session, status } = useSession();
  const isLoggedIn = status === "authenticated";
  const isCompact = variant === "compact";

  useEffect(() => {
    if (isCompact) {
      // Don't track scroll for compact variant
      return;
    }
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isCompact]);

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/" });
  };

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isCompact
      ? "py-0 bg-background/98 backdrop-blur-lg border-b border-border/10"
      : scrolled
        ? "py-2"
        : "py-4"
      }`}>
      <div
        className={`mx-auto ${isCompact
          ? "px-4 w-full"
          : `px-4 sm:px-6 lg:px-8 ${isWide ? "container" : "w-full"}`
          }`}
      >
        <div className={`${isCompact
          ? "px-0 py-0"
          : `bg-transparent px-6 py-3 transition-all duration-300`
          }`}>
          <div className={`flex items-center justify-between ${isCompact ? "h-10" : "h-14"
            }`}>
            <div className="flex items-center gap-4">
              <Link
                href="/"
                className={`flex items-center ${isCompact
                  ? "hover:opacity-80 transition-opacity gap-1.5"
                  : "group transition-transform hover:scale-105 gap-2"
                  }`}
              >
                <Image
                  src="/dojo-hunt.svg"
                  alt="DojoHunt"
                  width={isCompact ? 80 : 105}
                  height={isCompact ? 17 : 22}
                  className="h-auto"
                  priority
                />
              </Link>
              {isCompact && (
                <nav className="hidden sm:flex items-center gap-0.5 ml-2">
                  {[
                    { href: "/challenges", label: "Challenges" },
                    { href: "/leaderboard", label: "Leaderboard" },
                    { href: "/dashboard", label: "Dashboard" },
                  ].map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="px-3 py-1.5 text-xs font-medium text-white/80 hover:text-white font-montserrat transition-all duration-200"
                    >
                      {item.label}
                    </Link>
                  ))}
                </nav>
              )}
              {!isCompact && (
                <nav className="hidden md:flex gap-1 ml-8">
                  {[
                    { href: "/challenges", label: "Challenges" },
                    { href: "/leaderboard", label: "Leaderboard" },
                    { href: "/docs", label: "Docs" },
                  ].map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="px-4 py-2 text-sm font-medium text-white hover:text-white/80 font-montserrat transition-all duration-200 relative"
                    >
                      <span className="relative z-10">{item.label}</span>
                    </Link>
                  ))}
                </nav>
              )}
            </div>
            <div className="flex items-center gap-2">
              {isLoggedIn ? (
                <>
                  {isCompact && (
                    <div className="hidden sm:flex items-center gap-2 mr-2">
                      <Link
                        href="/dashboard"
                        className="px-2.5 py-1.5 text-xs font-medium text-foreground/60 hover:text-foreground/90 hover:bg-background/30 rounded-md transition-all"
                      >
                        Dashboard
                      </Link>
                      <Link
                        href="/settings"
                        className="px-2.5 py-1.5 text-xs font-medium text-foreground/60 hover:text-foreground/90 hover:bg-background/30 rounded-md transition-all"
                      >
                        Settings
                      </Link>
                    </div>
                  )}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        className={`relative p-0 ${isCompact
                          ? "h-8 w-8 rounded-lg hover:bg-background/50 border border-border/20"
                          : "h-10 w-10 rounded-full glass-light hover:glass"
                          }`}
                      >
                        <UserAvatar
                          name={session?.user?.name || session?.user?.email || "User"}
                          src={session?.user?.image || undefined}
                          size={isCompact ? "sm" : "md"}
                          className="w-full h-full"
                        />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      className="glass-strong border-border/50 w-56 mt-2 rounded-xl"
                      align="end"
                      disableAnimation
                    >
                      <DropdownMenuLabel className="font-normal">
                        <div className="flex flex-col space-y-1">
                          <p className="text-sm font-medium leading-none">
                            {session?.user?.name || session?.user?.email || "User"}
                          </p>
                          <p className="text-xs leading-none text-muted-foreground">
                            {session?.user?.email}
                          </p>
                        </div>
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator className="bg-border/50" />
                      <DropdownMenuItem className="rounded-lg">
                        <Link href="/dashboard" className="w-full">
                          Dashboard
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem className="rounded-lg">
                        <Link href="/settings" className="w-full">
                          Settings
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator className="bg-border/50" />
                      <DropdownMenuItem
                        onClick={handleLogout}
                        className="text-red-400 rounded-lg focus:text-red-400"
                      >
                        <LogOut className="mr-2 h-4 w-4" />
                        Log out
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              ) : (
                <>
                  {!isCompact && (
                    <div className="hidden md:flex gap-2">
                      <Link href="/auth/signup">
                        <Button
                          className="bg-white text-gray-900 hover:bg-white/90 rounded-xl px-4 py-2 text-sm font-semibold font-montserrat shadow-lg transition-all duration-200"
                        >
                          Sign In
                        </Button>
                      </Link>
                      <Link href="/auth/signin">
                        <Button
                          variant="outline"
                          className="bg-gray-900/80 border-gray-700 text-white hover:bg-gray-800/80 rounded-xl px-4 py-2 text-sm font-semibold font-montserrat backdrop-blur-sm"
                        >
                          Log In
                        </Button>
                      </Link>
                    </div>
                  )}
                  {isCompact && (
                    <>
                      <Link href="/auth/signup">
                        <Button
                          size="sm"
                          className="h-7 px-3 text-xs bg-white text-gray-900 hover:bg-white/90 rounded-lg font-montserrat font-medium"
                        >
                          Sign In
                        </Button>
                      </Link>
                    </>
                  )}
                </>
              )}

              {/* Mobile menu button - hidden in compact mode */}
              {!isCompact && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden bg-white/10 hover:bg-white/20 rounded-xl text-white"
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                >
                  {isMenuOpen ? (
                    <X className="h-5 w-5" />
                  ) : (
                    <Menu className="h-5 w-5" />
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden mt-2 mx-4 bg-background/95 backdrop-blur-lg rounded-2xl border border-white/10 animate-fade-in">
          <div className="px-6 py-4 space-y-2">
            <nav className="flex flex-col gap-1">
              {[
                { href: "/challenges", label: "Challenges" },
                { href: "/leaderboard", label: "Leaderboard" },
                { href: "/docs", label: "Docs" },
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="px-4 py-3 text-sm font-medium text-white hover:text-white/80 font-montserrat rounded-lg transition-all duration-200"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
            {!isLoggedIn && (
              <div className="flex flex-col gap-2 pt-4 border-t border-white/10">
                <Link
                  href="/auth/signup"
                  className="w-full"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Button className="w-full bg-white text-gray-900 hover:bg-white/90 rounded-xl font-montserrat font-semibold">
                    Sign In
                  </Button>
                </Link>
                <Link
                  href="/auth/signin"
                  className="w-full"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Button variant="outline" className="w-full bg-gray-900/80 border-gray-700 text-white hover:bg-gray-800/80 rounded-xl font-montserrat font-semibold">
                    Log In
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
