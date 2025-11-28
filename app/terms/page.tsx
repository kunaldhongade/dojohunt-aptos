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
import { FileText, Scale, AlertTriangle, Shield, Gavel, Globe } from "lucide-react";

export default function TermsPage() {
  return (
    <>
      <Navbar />
      <div className="min-h-screen pt-20 pb-12">
        {/* Hero Section */}
        <div className="relative py-16 px-4 sm:px-6 lg:px-8 mb-16">
          <div className="container mx-auto max-w-7xl">
            <div className="text-center space-y-6 animate-fade-in-up">
              <div className="inline-flex items-center justify-center gap-2 px-4 py-2 glass-strong rounded-full border border-primary/20 mb-4">
                <FileText className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium text-primary">Terms of Service</span>
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold">
                <span className="text-gradient">Terms of Service</span>
              </h1>
              <p className="text-lg md:text-xl text-foreground/70 max-w-2xl mx-auto">
                Please read these terms carefully before using DojoHunt
              </p>
              <p className="text-sm text-foreground/60">
                Last updated: {new Date().toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
          <div className="space-y-8">
            {/* Acceptance of Terms */}
            <Card className="glass-strong border-border/50">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-purple-600/10 flex items-center justify-center">
                    <Scale className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-2xl font-display font-semibold">
                    1. Acceptance of Terms
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-foreground/70 leading-relaxed">
                  By accessing and using DojoHunt, you accept and agree to be bound by the terms and 
                  provision of this agreement. If you do not agree to these terms, please do not use 
                  our services.
                </p>
              </CardContent>
            </Card>

            {/* Use License */}
            <Card className="glass-strong border-border/50">
              <CardHeader>
                <CardTitle className="text-2xl font-display font-semibold">
                  2. Use License
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-foreground/70 leading-relaxed mb-4">
                  Permission is granted to temporarily use DojoHunt for personal, non-commercial 
                  purposes. This is the grant of a license, not a transfer of title, and under this 
                  license you may not:
                </p>
                <ul className="space-y-2 text-foreground/70">
                  <li className="flex items-start gap-3">
                    <span className="text-primary mt-1">•</span>
                    <span>Modify or copy the materials or code</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-primary mt-1">•</span>
                    <span>Use the materials for any commercial purpose or public display</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-primary mt-1">•</span>
                    <span>Attempt to reverse engineer any software contained on DojoHunt</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-primary mt-1">•</span>
                    <span>Remove any copyright or other proprietary notations from materials</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Disclaimer */}
            <Card className="glass-strong border-border/50">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-500/20 to-purple-500/10 flex items-center justify-center">
                    <AlertTriangle className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-2xl font-display font-semibold">
                    3. Disclaimer
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-foreground/70 leading-relaxed mb-4">
                  The materials on DojoHunt are provided on an 'as is' basis. DojoHunt makes no 
                  warranties, expressed or implied, and hereby disclaims and negates all other warranties 
                  including without limitation, implied warranties or conditions of merchantability, 
                  fitness for a particular purpose, or non-infringement of intellectual property or other 
                  violation of rights.
                </p>
                <p className="text-foreground/70 leading-relaxed">
                  Further, DojoHunt does not warrant or make any representations concerning the 
                  accuracy, likely results, or reliability of the use of the materials on its website or 
                  otherwise relating to such materials or on any sites linked to this site.
                </p>
              </CardContent>
            </Card>

            {/* Limitations */}
            <Card className="glass-strong border-border/50">
              <CardHeader>
                <CardTitle className="text-2xl font-display font-semibold">
                  4. Limitations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-foreground/70 leading-relaxed mb-4">
                  In no event shall DojoHunt or its suppliers be liable for any damages (including, 
                  without limitation, damages for loss of data or profit, or due to business 
                  interruption) arising out of the use or inability to use the materials on DojoHunt, 
                  even if DojoHunt or a DojoHunt authorized representative has been notified orally or 
                  in writing of the possibility of such damage.
                </p>
                <p className="text-foreground/70 leading-relaxed">
                  Because some jurisdictions do not allow limitations on implied warranties, or 
                  limitations of liability for consequential or incidental damages, these limitations 
                  may not apply to you.
                </p>
              </CardContent>
            </Card>

            {/* Accuracy of Materials */}
            <Card className="glass-strong border-border/50">
              <CardHeader>
                <CardTitle className="text-2xl font-display font-semibold">
                  5. Accuracy of Materials
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-foreground/70 leading-relaxed">
                  The materials appearing on DojoHunt could include technical, typographical, or 
                  photographic errors. DojoHunt does not warrant that any of the materials on its 
                  website are accurate, complete or current. DojoHunt may make changes to the materials 
                  contained on its website at any time without notice.
                </p>
              </CardContent>
            </Card>

            {/* Links */}
            <Card className="glass-strong border-border/50">
              <CardHeader>
                <CardTitle className="text-2xl font-display font-semibold">
                  6. Links
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-foreground/70 leading-relaxed">
                  DojoHunt has not reviewed all of the sites linked to our website and is not 
                  responsible for the contents of any such linked site. The inclusion of any link does 
                  not imply endorsement by DojoHunt of the site. Use of any such linked website is at 
                  the user's own risk.
                </p>
              </CardContent>
            </Card>

            {/* Modifications */}
            <Card className="glass-strong border-border/50">
              <CardHeader>
                <CardTitle className="text-2xl font-display font-semibold">
                  7. Modifications
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-foreground/70 leading-relaxed">
                  DojoHunt may revise these terms of service for its website at any time without notice. 
                  By using this website you are agreeing to be bound by the then current version of 
                  these terms of service.
                </p>
              </CardContent>
            </Card>

            {/* Governing Law */}
            <Card className="glass-strong border-border/50">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/10 flex items-center justify-center">
                    <Gavel className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-2xl font-display font-semibold">
                    8. Governing Law
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-foreground/70 leading-relaxed">
                  These terms and conditions are governed by and construed in accordance with applicable 
                  laws. You irrevocably submit to the exclusive jurisdiction of the courts in that 
                  state or location for any disputes arising from or related to these terms.
                </p>
              </CardContent>
            </Card>

            {/* Staking and Smart Contracts */}
            <Card className="glass-strong border-border/50">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500/20 to-purple-500/10 flex items-center justify-center">
                    <Shield className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-2xl font-display font-semibold">
                    9. Staking and Smart Contracts
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-foreground/70 leading-relaxed mb-4">
                  By staking tokens on DojoHunt, you acknowledge and agree that:
                </p>
                <ul className="space-y-2 text-foreground/70">
                  <li className="flex items-start gap-3">
                    <span className="text-primary mt-1">•</span>
                    <span>You understand the risks associated with blockchain technology and smart contracts</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-primary mt-1">•</span>
                    <span>You are responsible for maintaining the security of your wallet and private keys</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-primary mt-1">•</span>
                    <span>Staking transactions are irreversible once confirmed on the blockchain</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-primary mt-1">•</span>
                    <span>You must complete required challenges to unlock your stake without fees</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-primary mt-1">•</span>
                    <span>DojoHunt is not responsible for losses due to user error, wallet compromise, or smart contract vulnerabilities</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Contact */}
            <Card className="glass-strong border-border/50">
              <CardHeader>
                <CardTitle className="text-2xl font-display font-semibold">
                  10. Contact Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-foreground/70 leading-relaxed">
                  If you have any questions about these Terms of Service, please contact us at 
                  legal@dojohunt.com.
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
