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
import { Cookie, Shield, Settings, Info } from "lucide-react";

export default function CookiePolicyPage() {
  return (
    <>
      <Navbar />
      <div className="min-h-screen pt-20 pb-12">
        {/* Hero Section */}
        <div className="relative py-16 px-4 sm:px-6 lg:px-8 mb-16">
          <div className="container mx-auto max-w-7xl">
            <div className="text-center space-y-6 animate-fade-in-up">
              <div className="inline-flex items-center justify-center gap-2 px-4 py-2 glass-strong rounded-full border border-primary/20 mb-4">
                <Cookie className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium text-primary">Cookie Policy</span>
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold">
                <span className="text-gradient">Cookie Policy</span>
              </h1>
              <p className="text-lg md:text-xl text-foreground/70 max-w-2xl mx-auto">
                Learn how we use cookies and similar technologies on DojoHunt
              </p>
              <p className="text-sm text-foreground/60">
                Last updated: {new Date().toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
          <div className="space-y-8">
            {/* What Are Cookies */}
            <Card className="glass-strong border-border/50">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-purple-600/10 flex items-center justify-center">
                    <Info className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-2xl font-display font-semibold">
                    What Are Cookies?
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-foreground/70 leading-relaxed mb-4">
                  Cookies are small text files that are placed on your device when you visit a website. 
                  They are widely used to make websites work more efficiently and provide information to 
                  the website owners.
                </p>
                <p className="text-foreground/70 leading-relaxed">
                  DojoHunt uses cookies and similar technologies to enhance your experience, analyze 
                  site usage, and assist in our marketing efforts.
                </p>
              </CardContent>
            </Card>

            {/* Types of Cookies */}
            <Card className="glass-strong border-border/50">
              <CardHeader>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/10 flex items-center justify-center">
                    <Settings className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-2xl font-display font-semibold">
                    Types of Cookies We Use
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <Badge className="glass-light border-border/30 mt-1">Essential</Badge>
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground/90 mb-1">Essential Cookies</h3>
                      <p className="text-sm text-foreground/70">
                        These cookies are necessary for the website to function properly. They enable 
                        core functionality such as security, network management, and accessibility. 
                        You cannot opt-out of these cookies.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <Badge className="glass-light border-border/30 mt-1">Analytics</Badge>
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground/90 mb-1">Analytics Cookies</h3>
                      <p className="text-sm text-foreground/70">
                        These cookies help us understand how visitors interact with our website by 
                        collecting and reporting information anonymously. This helps us improve our 
                        services and user experience.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <Badge className="glass-light border-border/30 mt-1">Functional</Badge>
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground/90 mb-1">Functional Cookies</h3>
                      <p className="text-sm text-foreground/70">
                        These cookies allow the website to remember choices you make (such as your 
                        username, language, or region) and provide enhanced, personalized features.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <Badge className="glass-light border-border/30 mt-1">Marketing</Badge>
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground/90 mb-1">Marketing Cookies</h3>
                      <p className="text-sm text-foreground/70">
                        These cookies are used to track visitors across websites to display relevant 
                        advertisements. They may also be used to limit the number of times you see an 
                        advertisement.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Managing Cookies */}
            <Card className="glass-strong border-border/50">
              <CardHeader>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500/20 to-purple-500/10 flex items-center justify-center">
                    <Shield className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-2xl font-display font-semibold">
                    Managing Your Cookie Preferences
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-foreground/70 leading-relaxed mb-4">
                  You have the right to accept or reject cookies. Most web browsers automatically 
                  accept cookies, but you can usually modify your browser settings to decline cookies 
                  if you prefer.
                </p>
                <p className="text-foreground/70 leading-relaxed mb-4">
                  However, please note that disabling cookies may affect the functionality of our 
                  website and may prevent you from accessing certain features.
                </p>
                <div className="space-y-2 mt-6">
                  <h3 className="font-semibold text-foreground/90 mb-2">Browser Settings:</h3>
                  <ul className="space-y-2 text-sm text-foreground/70">
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span><strong>Chrome:</strong> Settings → Privacy and security → Cookies and other site data</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span><strong>Firefox:</strong> Options → Privacy & Security → Cookies and Site Data</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span><strong>Safari:</strong> Preferences → Privacy → Cookies and website data</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span><strong>Edge:</strong> Settings → Cookies and site permissions</span>
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Third-Party Cookies */}
            <Card className="glass-strong border-border/50">
              <CardHeader>
                <CardTitle className="text-2xl font-display font-semibold">
                  Third-Party Cookies
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-foreground/70 leading-relaxed mb-4">
                  In addition to our own cookies, we may also use various third-party cookies to 
                  report usage statistics of the website, deliver advertisements, and so on.
                </p>
                <p className="text-foreground/70 leading-relaxed">
                  These third-party cookies are subject to the respective privacy policies of these 
                  external services. We recommend reviewing their cookie policies for more information.
                </p>
              </CardContent>
            </Card>

            {/* Updates */}
            <Card className="glass-strong border-border/50">
              <CardHeader>
                <CardTitle className="text-2xl font-display font-semibold">
                  Updates to This Policy
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-foreground/70 leading-relaxed">
                  We may update this Cookie Policy from time to time to reflect changes in our 
                  practices or for other operational, legal, or regulatory reasons. We will notify 
                  you of any material changes by posting the new Cookie Policy on this page and 
                  updating the "Last updated" date.
                </p>
              </CardContent>
            </Card>

            {/* Contact */}
            <Card className="glass-strong border-border/50">
              <CardHeader>
                <CardTitle className="text-2xl font-display font-semibold">
                  Contact Us
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-foreground/70 leading-relaxed">
                  If you have any questions about our use of cookies or this Cookie Policy, please 
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

