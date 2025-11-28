import { ObjectId } from "mongodb";

export interface Achievement {
  _id?: ObjectId;
  userId: ObjectId;
  type: string;
  title: string;
  description: string;
  icon?: string;
  earnedAt: Date;
}

export interface AchievementWithUser extends Achievement {
  user: {
    _id: ObjectId;
    name?: string;
    username?: string;
    image?: string;
  };
}

