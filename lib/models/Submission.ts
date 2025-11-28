import { ObjectId } from "mongodb";

export interface Submission {
  _id?: ObjectId;
  userId: ObjectId;
  challengeId: ObjectId;
  stakeId?: ObjectId;
  language: "JAVASCRIPT";
  code: string;
  status:
    | "PENDING"
    | "RUNNING"
    | "ACCEPTED"
    | "WRONG_ANSWER"
    | "TIME_LIMIT_EXCEEDED"
    | "MEMORY_LIMIT_EXCEEDED"
    | "RUNTIME_ERROR"
    | "COMPILATION_ERROR";
  executionTime?: number; // milliseconds
  memoryUsed?: number; // MB
  score?: number; // 0-100
  testResults: {
    input: string;
    expectedOutput: string;
    actualOutput: string;
    passed: boolean;
    executionTime: number;
  }[];
  errorMessage?: string;
  submittedAt: Date;
  completedAt?: Date;
}

export interface SubmissionWithDetails extends Submission {
  challenge: {
    _id: ObjectId;
    title: string;
    difficulty: "EASY" | "MEDIUM" | "HARD";
    category: string;
  };
  user: {
    _id: ObjectId;
    name?: string;
    username?: string;
  };
}
