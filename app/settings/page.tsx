"use client";

import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Bell,
  ChevronRight,
  Eye,
  EyeOff,
  Globe,
  Lock,
  Mail,
  Palette,
  Save,
  Shield,
  User,
  Loader2,
  Settings as SettingsIcon,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { useState, useEffect, useCallback, useRef } from "react";
import { cn } from "@/lib/utils";
import { ConnectWallet } from "@/components/connect-wallet";

type SettingsSection = "profile" | "security" | "notifications" | "privacy";

const settingsSections = [
  {
    id: "profile" as const,
    label: "Profile",
    icon: User,
    description: "Manage your personal information",
  },
  {
    id: "security" as const,
    label: "Security",
    icon: Lock,
    description: "Password and authentication",
  },
  {
    id: "notifications" as const,
    label: "Notifications",
    icon: Bell,
    description: "Notification preferences",
  },
  {
    id: "privacy" as const,
    label: "Privacy",
    icon: Globe,
    description: "Privacy and visibility settings",
  },
];

export default function SettingsPage() {
  const { data: session } = useSession();
  const [activeSection, setActiveSection] = useState<SettingsSection>("profile");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Form states
  const [profileData, setProfileData] = useState({
    name: session?.user?.name || "",
    email: session?.user?.email || "",
    username: "",
    bio: "",
    walletAddress: "",
  });

  // Track previous wallet address to prevent unnecessary updates
  const previousWalletAddressRef = useRef<string>("");

  // Fetch user data including wallet address
  useEffect(() => {
    const fetchUserData = async () => {
      if (session?.user?.email) {
        try {
          const response = await fetch("/api/user/profile", {
            credentials: "include",
          });
          if (response.ok) {
            const data = await response.json();
            if (data.user) {
              const walletAddress = data.user.walletAddress || "";
              previousWalletAddressRef.current = walletAddress;
              setProfileData((prev) => ({
                ...prev,
                walletAddress,
                username: data.user.username || "",
                bio: data.user.bio || "",
              }));
            }
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
        }
      }
    };

    fetchUserData();
  }, [session?.user?.email]);

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    challengeReminders: true,
    stakeUpdates: true,
    leaderboardUpdates: false,
    marketingEmails: false,
  });

  const [privacySettings, setPrivacySettings] = useState({
    profileVisibility: "public",
    showEmail: false,
    showWalletAddress: false,
    allowDirectMessages: true,
  });

  // Memoize wallet callbacks to prevent infinite loops
  const handleWalletConnected = useCallback((address: string) => {
    if (previousWalletAddressRef.current !== address) {
      previousWalletAddressRef.current = address;
      setProfileData((prev) => ({
        ...prev,
        walletAddress: address,
      }));
    }
  }, []);

  const handleWalletDisconnected = useCallback(() => {
    if (previousWalletAddressRef.current !== "") {
      previousWalletAddressRef.current = "";
      setProfileData((prev) => ({
        ...prev,
        walletAddress: "",
      }));
    }
  }, []);

  const handleSaveProfile = async () => {
    setIsLoading(true);
    // TODO: Implement profile update API call
    setTimeout(() => {
      setIsLoading(false);
      // Show success message
    }, 1000);
  };

  const handleChangePassword = async () => {
    setIsLoading(true);
    // TODO: Implement password change API call
    setTimeout(() => {
      setIsLoading(false);
      // Show success message
    }, 1000);
  };

  const activeSectionData = settingsSections.find((s) => s.id === activeSection);

  return (
    <>
      <Navbar />
      <div className="min-h-screen pt-20 pb-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          {/* Header */}
          <div className="mb-8 pt-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 glass-strong rounded-xl border-border/50">
                <SettingsIcon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-display font-bold text-foreground">
                  Settings
                </h1>
                <p className="text-foreground/60 text-sm mt-1">
                  Manage your account settings and preferences
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Sidebar Navigation */}
            <aside className="lg:col-span-3">
              <div className="glass-strong border-border/50 rounded-2xl p-2 sticky top-24">
                <nav className="space-y-1">
                  {settingsSections.map((section) => {
                    const Icon = section.icon;
                    const isActive = activeSection === section.id;
                    return (
                      <button
                        key={section.id}
                        onClick={() => setActiveSection(section.id)}
                        className={cn(
                          "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all duration-200",
                          isActive
                            ? "bg-primary/10 text-primary border border-primary/20"
                            : "text-foreground/70 hover:text-foreground hover:bg-background/50"
                        )}
                      >
                        <Icon className={cn(
                          "h-5 w-5",
                          isActive ? "text-primary" : "text-foreground/50"
                        )} />
                        <div className="flex-1">
                          <div className="font-medium text-sm">{section.label}</div>
                          <div className="text-xs text-foreground/50 mt-0.5">
                            {section.description}
                          </div>
                        </div>
                        {isActive && (
                          <ChevronRight className="h-4 w-4 text-primary" />
                        )}
                      </button>
                    );
                  })}
                </nav>
              </div>
            </aside>

            {/* Main Content */}
            <main className="lg:col-span-9">
              {/* Profile Section */}
              {activeSection === "profile" && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-display font-bold text-foreground mb-2">
                      Profile Information
                    </h2>
                    <p className="text-foreground/60 text-sm">
                      Update your personal information and profile details
                    </p>
                  </div>

                  <Card className="glass-strong border-border/50">
                    <CardHeader>
                      <CardTitle className="text-lg font-semibold">
                        Personal Details
                      </CardTitle>
                      <CardDescription>
                        This information will be displayed on your public profile
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="grid gap-6 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="name" className="text-sm font-medium">
                            Full Name
                          </Label>
                          <div className="relative">
                            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-foreground/40" />
                            <Input
                              id="name"
                              value={profileData.name}
                              onChange={(e) =>
                                setProfileData({
                                  ...profileData,
                                  name: e.target.value,
                                })
                              }
                              className="pl-10 h-11 glass-light border-border/30 rounded-lg focus:border-primary/50"
                              placeholder="Enter your full name"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="email" className="text-sm font-medium">
                            Email Address
                          </Label>
                          <div className="relative">
                            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-foreground/40" />
                            <Input
                              id="email"
                              type="email"
                              value={profileData.email}
                              onChange={(e) =>
                                setProfileData({
                                  ...profileData,
                                  email: e.target.value,
                                })
                              }
                              className="pl-10 h-11 glass-light border-border/30 rounded-lg focus:border-primary/50"
                              placeholder="Enter your email"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="grid gap-6 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="username" className="text-sm font-medium">
                            Username
                          </Label>
                          <Input
                            id="username"
                            value={profileData.username}
                            onChange={(e) =>
                              setProfileData({
                                ...profileData,
                                username: e.target.value,
                              })
                            }
                            className="h-11 glass-light border-border/30 rounded-lg focus:border-primary/50"
                            placeholder="Choose a unique username"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">
                            Wallet Address
                          </Label>
                          <div>
                            <ConnectWallet
                              onWalletConnected={handleWalletConnected}
                              onWalletDisconnected={handleWalletDisconnected}
                              showAddress={true}
                              variant="outline"
                              className="w-full justify-start"
                            />
                            <p className="text-xs text-foreground/50 mt-2">
                              Connect your wallet to enable staking features
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="bio" className="text-sm font-medium">
                          Bio
                        </Label>
                        <Textarea
                          id="bio"
                          value={profileData.bio}
                          onChange={(e) =>
                            setProfileData({
                              ...profileData,
                              bio: e.target.value,
                            })
                          }
                          className="min-h-[100px] glass-light border-border/30 rounded-lg focus:border-primary/50 resize-none"
                          placeholder="Tell us about yourself..."
                        />
                        <p className="text-xs text-foreground/50">
                          A brief description of yourself (max 160 characters)
                        </p>
                      </div>

                      <Separator className="border-border/30" />

                      <div className="flex justify-end">
                        <Button
                          onClick={handleSaveProfile}
                          disabled={isLoading}
                          className="gradient-purple hover:opacity-90 rounded-lg px-6 shadow-lg shadow-primary/30"
                        >
                          {isLoading ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Saving...
                            </>
                          ) : (
                            <>
                              <Save className="mr-2 h-4 w-4" />
                              Save Changes
                            </>
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Security Section */}
              {activeSection === "security" && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-display font-bold text-foreground mb-2">
                      Security Settings
                    </h2>
                    <p className="text-foreground/60 text-sm">
                      Manage your password and authentication settings
                    </p>
                  </div>

                  <Card className="glass-strong border-border/50">
                    <CardHeader>
                      <CardTitle className="text-lg font-semibold">
                        Change Password
                      </CardTitle>
                      <CardDescription>
                        Update your password to keep your account secure
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="space-y-2">
                        <Label htmlFor="currentPassword" className="text-sm font-medium">
                          Current Password
                        </Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-foreground/40" />
                          <Input
                            id="currentPassword"
                            type={showPassword ? "text" : "password"}
                            value={passwordData.currentPassword}
                            onChange={(e) =>
                              setPasswordData({
                                ...passwordData,
                                currentPassword: e.target.value,
                              })
                            }
                            className="pl-10 pr-10 h-11 glass-light border-border/30 rounded-lg focus:border-primary/50"
                            placeholder="Enter current password"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-foreground/40 hover:text-foreground/70 transition-colors"
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </div>

                      <div className="grid gap-6 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="newPassword" className="text-sm font-medium">
                            New Password
                          </Label>
                          <Input
                            id="newPassword"
                            type="password"
                            value={passwordData.newPassword}
                            onChange={(e) =>
                              setPasswordData({
                                ...passwordData,
                                newPassword: e.target.value,
                              })
                            }
                            className="h-11 glass-light border-border/30 rounded-lg focus:border-primary/50"
                            placeholder="Enter new password"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="confirmPassword" className="text-sm font-medium">
                            Confirm New Password
                          </Label>
                          <Input
                            id="confirmPassword"
                            type="password"
                            value={passwordData.confirmPassword}
                            onChange={(e) =>
                              setPasswordData({
                                ...passwordData,
                                confirmPassword: e.target.value,
                              })
                            }
                            className="h-11 glass-light border-border/30 rounded-lg focus:border-primary/50"
                            placeholder="Confirm new password"
                          />
                        </div>
                      </div>

                      <Separator className="border-border/30" />

                      <div className="flex justify-end">
                        <Button
                          onClick={handleChangePassword}
                          disabled={isLoading}
                          className="gradient-purple hover:opacity-90 rounded-lg px-6 shadow-lg shadow-primary/30"
                        >
                          {isLoading ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Updating...
                            </>
                          ) : (
                            <>
                              <Lock className="mr-2 h-4 w-4" />
                              Update Password
                            </>
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="glass-strong border-border/50">
                    <CardHeader>
                      <CardTitle className="text-lg font-semibold flex items-center gap-2">
                        <Shield className="h-5 w-5 text-primary" />
                        Two-Factor Authentication
                      </CardTitle>
                      <CardDescription>
                        Add an extra layer of security to your account
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between py-2">
                        <div className="flex-1">
                          <p className="font-medium text-foreground/90 mb-1">
                            Enable 2FA
                          </p>
                          <p className="text-sm text-foreground/60">
                            Protect your account with two-factor authentication using an authenticator app
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          className="glass-strong hover:glass border-border/50 hover:border-primary/30 rounded-lg ml-4"
                        >
                          Setup 2FA
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Notifications Section */}
              {activeSection === "notifications" && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-display font-bold text-foreground mb-2">
                      Notification Preferences
                    </h2>
                    <p className="text-foreground/60 text-sm">
                      Choose what notifications you want to receive
                    </p>
                  </div>

                  <Card className="glass-strong border-border/50">
                    <CardHeader>
                      <CardTitle className="text-lg font-semibold">
                        Email Notifications
                      </CardTitle>
                      <CardDescription>
                        Control how and when you receive email notifications
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-0">
                      <div className="divide-y divide-border/30">
                        <div className="flex items-center justify-between py-4 first:pt-0 last:pb-0">
                          <div className="flex-1">
                            <p className="font-medium text-foreground/90 mb-1">
                              Email Notifications
                            </p>
                            <p className="text-sm text-foreground/60">
                              Receive important updates via email
                            </p>
                          </div>
                          <Switch
                            checked={notificationSettings.emailNotifications}
                            onCheckedChange={(checked) =>
                              setNotificationSettings({
                                ...notificationSettings,
                                emailNotifications: checked,
                              })
                            }
                          />
                        </div>
                        <div className="flex items-center justify-between py-4 first:pt-0 last:pb-0">
                          <div className="flex-1">
                            <p className="font-medium text-foreground/90 mb-1">
                              Challenge Reminders
                            </p>
                            <p className="text-sm text-foreground/60">
                              Get reminded about pending challenges
                            </p>
                          </div>
                          <Switch
                            checked={notificationSettings.challengeReminders}
                            onCheckedChange={(checked) =>
                              setNotificationSettings({
                                ...notificationSettings,
                                challengeReminders: checked,
                              })
                            }
                          />
                        </div>
                        <div className="flex items-center justify-between py-4 first:pt-0 last:pb-0">
                          <div className="flex-1">
                            <p className="font-medium text-foreground/90 mb-1">
                              Stake Updates
                            </p>
                            <p className="text-sm text-foreground/60">
                              Notifications about your staking activities
                            </p>
                          </div>
                          <Switch
                            checked={notificationSettings.stakeUpdates}
                            onCheckedChange={(checked) =>
                              setNotificationSettings({
                                ...notificationSettings,
                                stakeUpdates: checked,
                              })
                            }
                          />
                        </div>
                        <div className="flex items-center justify-between py-4 first:pt-0 last:pb-0">
                          <div className="flex-1">
                            <p className="font-medium text-foreground/90 mb-1">
                              Leaderboard Updates
                            </p>
                            <p className="text-sm text-foreground/60">
                              Get notified when your rank changes
                            </p>
                          </div>
                          <Switch
                            checked={notificationSettings.leaderboardUpdates}
                            onCheckedChange={(checked) =>
                              setNotificationSettings({
                                ...notificationSettings,
                                leaderboardUpdates: checked,
                              })
                            }
                          />
                        </div>
                        <div className="flex items-center justify-between py-4 first:pt-0 last:pb-0">
                          <div className="flex-1">
                            <p className="font-medium text-foreground/90 mb-1">
                              Marketing Emails
                            </p>
                            <p className="text-sm text-foreground/60">
                              Receive updates about new features and promotions
                            </p>
                          </div>
                          <Switch
                            checked={notificationSettings.marketingEmails}
                            onCheckedChange={(checked) =>
                              setNotificationSettings({
                                ...notificationSettings,
                                marketingEmails: checked,
                              })
                            }
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Privacy Section */}
              {activeSection === "privacy" && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-display font-bold text-foreground mb-2">
                      Privacy Settings
                    </h2>
                    <p className="text-foreground/60 text-sm">
                      Control who can see your information and how it's shared
                    </p>
                  </div>

                  <Card className="glass-strong border-border/50">
                    <CardHeader>
                      <CardTitle className="text-lg font-semibold">
                        Profile Visibility
                      </CardTitle>
                      <CardDescription>
                        Control who can see your profile and information
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="space-y-3">
                        <Label className="text-sm font-medium">
                          Profile Visibility
                        </Label>
                        <div className="flex gap-3">
                          <Button
                            variant={privacySettings.profileVisibility === "public" ? "default" : "outline"}
                            size="sm"
                            onClick={() =>
                              setPrivacySettings({
                                ...privacySettings,
                                profileVisibility: "public",
                              })
                            }
                            className={cn(
                              "rounded-lg",
                              privacySettings.profileVisibility === "public"
                                ? "gradient-purple hover:opacity-90"
                                : "glass-strong hover:glass border-border/50"
                            )}
                          >
                            Public
                          </Button>
                          <Button
                            variant={privacySettings.profileVisibility === "private" ? "default" : "outline"}
                            size="sm"
                            onClick={() =>
                              setPrivacySettings({
                                ...privacySettings,
                                profileVisibility: "private",
                              })
                            }
                            className={cn(
                              "rounded-lg",
                              privacySettings.profileVisibility === "private"
                                ? "gradient-purple hover:opacity-90"
                                : "glass-strong hover:glass border-border/50"
                            )}
                          >
                            Private
                          </Button>
                        </div>
                        <p className="text-sm text-foreground/60">
                          {privacySettings.profileVisibility === "public"
                            ? "Your profile is visible to everyone"
                            : "Your profile is only visible to you"}
                        </p>
                      </div>

                      <Separator className="border-border/30" />

                      <div className="space-y-0 divide-y divide-border/30">
                        <div className="flex items-center justify-between py-4 first:pt-0 last:pb-0">
                          <div className="flex-1">
                            <p className="font-medium text-foreground/90 mb-1">
                              Show Email Address
                            </p>
                            <p className="text-sm text-foreground/60">
                              Display your email on your public profile
                            </p>
                          </div>
                          <Switch
                            checked={privacySettings.showEmail}
                            onCheckedChange={(checked) =>
                              setPrivacySettings({
                                ...privacySettings,
                                showEmail: checked,
                              })
                            }
                          />
                        </div>
                        <div className="flex items-center justify-between py-4 first:pt-0 last:pb-0">
                          <div className="flex-1">
                            <p className="font-medium text-foreground/90 mb-1">
                              Show Wallet Address
                            </p>
                            <p className="text-sm text-foreground/60">
                              Display your wallet address on your public profile
                            </p>
                          </div>
                          <Switch
                            checked={privacySettings.showWalletAddress}
                            onCheckedChange={(checked) =>
                              setPrivacySettings({
                                ...privacySettings,
                                showWalletAddress: checked,
                              })
                            }
                          />
                        </div>
                        <div className="flex items-center justify-between py-4 first:pt-0 last:pb-0">
                          <div className="flex-1">
                            <p className="font-medium text-foreground/90 mb-1">
                              Allow Direct Messages
                            </p>
                            <p className="text-sm text-foreground/60">
                              Let other users send you direct messages
                            </p>
                          </div>
                          <Switch
                            checked={privacySettings.allowDirectMessages}
                            onCheckedChange={(checked) =>
                              setPrivacySettings({
                                ...privacySettings,
                                allowDirectMessages: checked,
                              })
                            }
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="glass-strong border-border/50">
                    <CardHeader>
                      <CardTitle className="text-lg font-semibold flex items-center gap-2">
                        <Palette className="h-5 w-5 text-primary" />
                        Theme Preferences
                      </CardTitle>
                      <CardDescription>
                        Customize your app appearance
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between py-2">
                        <div className="flex-1">
                          <p className="font-medium text-foreground/90 mb-1">
                            Dark Mode
                          </p>
                          <p className="text-sm text-foreground/60">
                            Use dark theme for better visibility
                          </p>
                        </div>
                        <Switch defaultChecked />
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </main>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
