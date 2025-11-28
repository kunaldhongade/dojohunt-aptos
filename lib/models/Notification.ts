import { ObjectId } from "mongodb";

export interface Notification {
  _id?: ObjectId;
  userId: ObjectId;
  type:
    | "CHALLENGE_COMPLETED"
    | "STAKE_ACTIVATED"
    | "STAKE_COMPLETED"
    | "STAKE_FAILED"
    | "ACHIEVEMENT_EARNED"
    | "RANK_CHANGED"
    | "SYSTEM";
  title: string;
  message: string;
  isRead: boolean;
  data?: any; // Additional data
  createdAt: Date;
}

export interface NotificationWithUser extends Notification {
  user: {
    _id: ObjectId;
    name?: string;
    username?: string;
  };
}

