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
import {
  HelpCircle,
  ChevronDown,
  MessageSquare,
  Search,
  Sparkles
} from "lucide-react";
import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface FAQItem {
  question: string;
  answer: string;
  category: string;
}

const faqs: FAQItem[] = [
  {
    category: "Getting Started",
    question: "How do I get started with DojoHunt?",
    answer: "To get started, create an account or connect your wallet, then stake TSKULL tokens on Aptos. Once staked, you'll unlock challenges that you need to complete within the staking period to unlock your tokens without fees."
  },
  {
    category: "Getting Started",
    question: "Do I need to pay to use DojoHunt?",
    answer: "No, DojoHunt is free to use. You only need to stake TSKULL tokens to unlock challenges. When you complete the required challenges, you can unstake your tokens without any fees."
  },
  {
    category: "Staking",
    question: "How many TSKULL tokens do I need to stake?",
    answer: "The minimum stake amount is 5 TSKULL tokens for a 5-day period. You must complete 5 assigned challenges within this period to unlock your stake without fees."
  },
  {
    category: "Staking",
    question: "What happens if I don't complete the challenges?",
    answer: "If you don't complete the required challenges within the staking period, you'll need to pay a fee to unstake your tokens. The fee structure is designed to incentivize challenge completion."
  },
  {
    category: "Staking",
    question: "Are my staked TSKULL tokens safe?",
    answer: "Yes, your TSKULL tokens are locked in audited smart contracts on Aptos. The contracts are transparent and secure. You maintain control of your tokens throughout the staking period."
  },
  {
    category: "Challenges",
    question: "What programming languages are supported?",
    answer: "Currently, DojoHunt supports JavaScript and TypeScript. We use the Monaco editor with full syntax highlighting, autocomplete, and real-time execution."
  },
  {
    category: "Challenges",
    question: "How are challenges validated?",
    answer: "Each challenge has automated test cases that validate your solution. Your code is executed in a secure environment, and results are checked against expected outputs. All tests must pass for a solution to be accepted."
  },
  {
    category: "Challenges",
    question: "Can I see other users' solutions?",
    answer: "Yes, after completing a challenge, you can view solutions from other developers on the leaderboard. This helps you learn different approaches and improve your coding skills."
  },
  {
    category: "Leaderboard",
    question: "How is the leaderboard ranked?",
    answer: "The leaderboard is ranked based on your total score, which is calculated from completed challenges, solution quality, and performance metrics. Higher scores come from solving more challenges and writing efficient solutions."
  },
  {
    category: "Leaderboard",
    question: "Do I get rewards for ranking high?",
    answer: "While there are no direct monetary rewards for rankings, high rankings demonstrate your skills and can help you stand out in the developer community. The main rewards come from completing challenges to unlock your staked tokens."
  },
  {
    category: "Technical",
    question: "What blockchain is DojoHunt built on?",
    answer: "DojoHunt is built on Aptos blockchain. This ensures fast transactions and low gas fees while maintaining security through Aptos's Move-based smart contracts."
  },
  {
    category: "Technical",
    question: "Do I need to know blockchain to use DojoHunt?",
    answer: "No, you don't need blockchain knowledge to solve coding challenges. However, you'll need a crypto wallet to stake tokens. We provide guides to help you get started with wallet setup."
  }
];

const categories = ["All", "Getting Started", "Staking", "Challenges", "Leaderboard", "Technical"];

export default function FAQPage() {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredFAQs = faqs.filter(faq => {
    const matchesCategory = selectedCategory === "All" || faq.category === selectedCategory;
    const matchesSearch = faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <>
      <Navbar />
      <div className="min-h-screen pt-20 pb-12">
        {/* Hero Section */}
        <div className="relative py-16 px-4 sm:px-6 lg:px-8 mb-16">
          <div className="container mx-auto max-w-7xl">
            <div className="text-center space-y-6 animate-fade-in-up">
              <div className="inline-flex items-center justify-center gap-2 px-4 py-2 glass-strong rounded-full border border-primary/20 mb-4">
                <HelpCircle className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium text-primary">FAQ</span>
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold">
                <span className="text-gradient">Frequently Asked</span>
                <br />
                <span className="text-gradient">Questions</span>
              </h1>
              <p className="text-lg md:text-xl text-foreground/70 max-w-2xl mx-auto">
                Find answers to common questions about DojoHunt
              </p>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
          {/* Search Bar */}
          <div className="mb-8">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-foreground/40" />
              <input
                type="text"
                placeholder="Search questions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 glass-light border border-border/30 rounded-xl focus:border-primary/50 focus:outline-none text-foreground placeholder:text-foreground/40"
              />
            </div>
          </div>

          {/* Category Filters */}
          <div className="flex flex-wrap gap-2 mb-8">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  selectedCategory === category
                    ? "gradient-purple text-white shadow-lg shadow-primary/30"
                    : "glass-strong border border-border/30 hover:border-primary/30 text-foreground/70 hover:text-foreground"
                }`}
              >
                {category}
              </button>
            ))}
          </div>

          {/* FAQ Items */}
          <div className="space-y-4 mb-12">
            {filteredFAQs.length > 0 ? (
              filteredFAQs.map((faq, index) => (
                <Card
                  key={index}
                  className="glass-strong border-border/50 hover:border-primary/30 transition-all duration-300"
                >
                  <CardHeader
                    className="cursor-pointer"
                    onClick={() => setOpenIndex(openIndex === index ? null : index)}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className="glass-light border-border/30 text-xs">
                            {faq.category}
                          </Badge>
                        </div>
                        <CardTitle className="text-lg font-display font-semibold pr-8">
                          {faq.question}
                        </CardTitle>
                      </div>
                      <ChevronDown
                        className={`h-5 w-5 text-foreground/60 flex-shrink-0 transition-transform duration-200 ${
                          openIndex === index ? "rotate-180" : ""
                        }`}
                      />
                    </div>
                  </CardHeader>
                  {openIndex === index && (
                    <CardContent className="pt-0">
                      <p className="text-foreground/70 leading-relaxed">
                        {faq.answer}
                      </p>
                    </CardContent>
                  )}
                </Card>
              ))
            ) : (
              <Card className="glass-strong border-border/50">
                <CardContent className="p-12 text-center">
                  <MessageSquare className="h-12 w-12 text-foreground/40 mx-auto mb-4" />
                  <p className="text-foreground/70">No questions found matching your search.</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Still Have Questions */}
          <Card className="glass-strong border-border/50 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-primary/5 to-transparent" />
            <CardContent className="p-12 text-center relative z-10">
              <div className="space-y-6">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500/20 to-purple-600/10 mb-4 mx-auto">
                  <Sparkles className="h-8 w-8 text-primary" />
                </div>
                <h2 className="text-3xl md:text-4xl font-display font-bold">
                  <span className="text-gradient">Still Have Questions?</span>
                </h2>
                <p className="text-lg text-foreground/70 max-w-xl mx-auto">
                  Can't find what you're looking for? Check out our documentation or contact our support team.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link href="/docs">
                    <Button 
                      size="lg" 
                      className="gradient-purple hover:opacity-90 rounded-xl px-8 py-6 text-base font-semibold shadow-lg shadow-primary/30"
                    >
                      View Documentation
                    </Button>
                  </Link>
                  <Link href="/tutorials">
                    <Button 
                      size="lg" 
                      variant="outline"
                      className="glass-strong hover:glass rounded-xl px-8 py-6 text-base font-semibold border-border/50 hover:border-primary/30"
                    >
                      Browse Tutorials
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      <Footer />
    </>
  );
}

