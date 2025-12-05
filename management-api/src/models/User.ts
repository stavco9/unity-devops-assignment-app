import type { ObjectId } from "mongodb";
import type { Item } from "./Item.js";

export interface User {
  _id: ObjectId;
  username: string;
  email: string;
  createdAt: Date;
  purchases: ObjectId[];
  purchaseditems: Item[];
  balance: number;
}