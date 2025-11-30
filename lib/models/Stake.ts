import { ObjectId } from "mongodb";

export interface Stake {
  _id?: ObjectId;
  userId: ObjectId;
  walletAddress?: string; // Wallet address used for this stake
  amount: number; // TSKULL tokens amount
  startTime: Date;
  endTime: Date;
  challengesRequired: number;
  challengesCompleted: number;
  status: "ACTIVE" | "COMPLETED" | "FAILED" | "CANCELLED";
  transactionHash?: string;
  unstakeTransactionHash?: string;
  fee: number;
  reward: number;
  challengeIds: ObjectId[]; // Array of challenge IDs assigned to this stake
  createdAt: Date;
  updatedAt: Date;
}

export interface StakeWithChallenges extends Stake {
  challenges: {
    _id: ObjectId;
    title: string;
    difficulty: "EASY" | "MEDIUM" | "HARD";
    category: string;
  }[];
}

