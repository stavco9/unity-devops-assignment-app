import type { ObjectId } from "mongodb";

export interface Item {
    _id: ObjectId;
    name: string;
    price: number;
    createdAt: Date;
    purchasedBy: ObjectId;
    purchasedAt: Date;
}