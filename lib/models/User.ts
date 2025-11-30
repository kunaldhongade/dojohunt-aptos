import { ObjectId } from "mongodb";

export interface User {
  _id?: ObjectId;
  name?: string;
  email?: string;
  emailVerified?: Date;
  image?: string;
  walletAddress?: string;
  username?: string;
  password?: string; // For credentials authentication
  bio?: string;
  avatar?: string;
  isActive: boolean;
  role: "USER" | "ADMIN";
  createdAt: Date;
  updatedAt: Date;
}

export interface UserStats {
  _id?: ObjectId;
  userId: ObjectId;
  totalChallengesCompleted: number;
  totalScore: number;
  averageScore: number;
  currentStreak: number;
  longestStreak: number;
  totalStaked: number;
  totalRewards: number;
  rank?: number;
  lastActiveAt: Date;
  createdAt: Date;
  updatedAt: Date;
}
