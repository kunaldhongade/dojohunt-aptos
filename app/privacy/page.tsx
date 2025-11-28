"use client";

import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Shield, Lock, Eye, Database, Mail, FileText } from "lucide-react";

export default function PrivacyPage() {
  return (
    <>
      <Navbar />
      <div className="min-h-screen pt-20 pb-12">
        {/* Hero Section */}
        <div className="relative py-16 px-4 sm:px-6 lg:px-8 mb-16">
          <div className="container mx-auto max-w-7xl">
            <div className="text-center space-y-6 animate-fade-in-up">
              <div className="inline-flex items-center justify-center gap-2 px-4 py-2 glass-strong rounded-full border border-primary/20 mb-4">
                <Shield className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium text-primary">Privacy Policy</span>
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold">
                <span className="text-gradient">Privacy Policy</span>
              </h1>
              <p className="text-lg md:text-xl text-foreground/70 max-w-2xl mx-auto">
                Your privacy is important to us. Learn how we collect, use, and protect your information.
              </p>
              <p className="text-sm text-foreground/60">
                Last updated: {new Date().toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
          <div className="space-y-8">
            {/* Information We Collect */}
            <Card className="glass-strong border-border/50">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-purple-600/10 flex items-center justify-center">
                    <Database className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-2xl font-display font-semibold">
                    1. Information We Collect
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-foreground/70 leading-relaxed mb-4">
                  We collect information you provide directly to us, such as when you create an account, 
                  participate in challenges, or contact us for support.
                </p>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <span className="text-primary mt-1">•</span>
                    <span className="text-foreground/70"><strong>Account Information:</strong> Username, email address, and profile information</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-primary mt-1">•</span>
                    <span className="text-foreground/70"><strong>Wallet Information:</strong> Ethereum wallet addresses (when connected)</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-primary mt-1">•</span>
                    <span className="text-foreground/70"><strong>Challenge Data:</strong> Your code submissions, test results, and progress</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-primary mt-1">•</span>
                    <span className="text-foreground/70"><strong>Usage Data:</strong> How you interact with our platform, including pages visited and features used</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* How We Use Information */}
            <Card className="glass-strong border-border/50">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/10 flex items-center justify-center">
                    <Eye className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-2xl font-display font-semibold">
                    2. How We Use Your Information
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-foreground/70 leading-relaxed mb-4">
                  We use the information we collect to provide, maintain, and improve our services, 
                  process transactions, and communicate with you.
                </p>
                <ul className="space-y-2 text-foreground/70">
                  <li className="flex items-start gap-3">
                    <span className="text-primary mt-1">•</span>
                    <span>Provide and maintain our coding challenge platform</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-primary mt-1">•</span>
                    <span>Process staking transactions and manage smart contracts</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-primary mt-1">•</span>
                    <span>Display leaderboard rankings and user statistics</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-primary mt-1">•</span>
                    <span>Send you updates, notifications, and support communications</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-primary mt-1">•</span>
                    <span>Analyze usage patterns to improve our services</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Information Sharing */}
            <Card className="glass-strong border-border/50">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500/20 to-purple-500/10 flex items-center justify-center">
                    <Lock className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-2xl font-display font-semibold">
                    3. Information Sharing
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-foreground/70 leading-relaxed mb-4">
                  We do not sell, trade, or otherwise transfer your personal information to third parties 
                  without your consent, except as described in this policy.
                </p>
                <div className="space-y-3">
                  <div>
                    <h3 className="font-semibold text-foreground/90 mb-2">Public Information</h3>
                    <p className="text-sm text-foreground/70">
                      Your username, challenge completion status, and leaderboard rankings are publicly 
                      visible on the platform. This is essential for the competitive nature of DojoHunt.
                    </p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground/90 mb-2">Service Providers</h3>
                    <p className="text-sm text-foreground/70">
                      We may share information with trusted service providers who assist us in operating 
                      our platform, conducting business, or serving users, as long as they agree to keep 
                      this information confidential.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Data Security */}
            <Card className="glass-strong border-border/50">
              <CardHeader>
                <CardTitle className="text-2xl font-display font-semibold">
                  4. Data Security
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-foreground/70 leading-relaxed mb-4">
                  We implement appropriate security measures to protect your personal information against 
                  unauthorized access, alteration, disclosure, or destruction.
                </p>
                <ul className="space-y-2 text-foreground/70">
                  <li className="flex items-start gap-3">
                    <span className="text-primary mt-1">•</span>
                    <span>Encryption of sensitive data in transit and at rest</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-primary mt-1">•</span>
                    <span>Secure authentication and authorization systems</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-primary mt-1">•</span>
                    <span>Regular security audits and updates</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-primary mt-1">•</span>
                    <span>Smart contracts audited for security vulnerabilities</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Cookies */}
            <Card className="glass-strong border-border/50">
              <CardHeader>
                <CardTitle className="text-2xl font-display font-semibold">
                  5. Cookies
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-foreground/70 leading-relaxed mb-4">
                  We use cookies and similar technologies to enhance your experience on our platform and 
                  analyze usage patterns.
                </p>
                <p className="text-foreground/70 leading-relaxed">
                  For detailed information about our use of cookies, please see our{" "}
                  <a href="/cookies" className="text-primary hover:underline">Cookie Policy</a>.
                </p>
              </CardContent>
            </Card>

            {/* Third-Party Services */}
            <Card className="glass-strong border-border/50">
              <CardHeader>
                <CardTitle className="text-2xl font-display font-semibold">
                  6. Third-Party Services
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-foreground/70 leading-relaxed mb-4">
                  Our platform may contain links to third-party websites or services. We are not 
                  responsible for the privacy practices of these third parties.
                </p>
                <p className="text-foreground/70 leading-relaxed">
                  We encourage you to review the privacy policies of any third-party services you 
                  access through our platform.
                </p>
              </CardContent>
            </Card>

            {/* Children's Privacy */}
            <Card className="glass-strong border-border/50">
              <CardHeader>
                <CardTitle className="text-2xl font-display font-semibold">
                  7. Children's Privacy
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-foreground/70 leading-relaxed">
                  Our services are not intended for children under 13 years of age. We do not knowingly 
                  collect personal information from children under 13. If you are a parent or guardian 
                  and believe your child has provided us with personal information, please contact us 
                  immediately.
                </p>
              </CardContent>
            </Card>

            {/* Changes to Policy */}
            <Card className="glass-strong border-border/50">
              <CardHeader>
                <CardTitle className="text-2xl font-display font-semibold">
                  8. Changes to This Policy
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-foreground/70 leading-relaxed">
                  We may update this privacy policy from time to time. We will notify you of any changes 
                  by posting the new policy on this page and updating the "Last updated" date. We 
                  encourage you to review this policy periodically.
                </p>
              </CardContent>
            </Card>

            {/* Contact */}
            <Card className="glass-strong border-border/50">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-500/20 to-purple-500/10 flex items-center justify-center">
                    <Mail className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-2xl font-display font-semibold">
                    9. Contact Us
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-foreground/70 leading-relaxed">
                  If you have any questions about this privacy policy or our data practices, please 
                  contact us at privacy@dojohunt.com.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
