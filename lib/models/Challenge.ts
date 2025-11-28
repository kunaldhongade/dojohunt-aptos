import { ObjectId } from "mongodb";

export interface Challenge {
  _id?: ObjectId;
  title: string;
  description: string;
  problem: string;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  category: string;
  constraints: string[];
  testCases: {
    variables: Record<string, any>; // e.g., { s: "catsanddog", wordDict: ["cat", "cats", ...] }
    output: string;
    explanation?: string;
  }[];
  starterCode: string;
  solutionCode: string;
  timeLimit: number;
  memoryLimit: number;
  points: number;
  tags: string[];
  isActive: boolean;
  isPublished: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ChallengeWithStats extends Challenge {
  completionRate: number;
  totalSubmissions: number;
}
