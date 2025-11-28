import { ObjectId } from "mongodb";

export interface SystemConfig {
  _id?: ObjectId;
  key: string;
  value: string;
  description?: string;
  updatedAt: Date;
}

