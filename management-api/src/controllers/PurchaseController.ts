import type { Request, Response } from "express";
import type { MongoService } from "../service/MongoService.js";
import type { Document } from "mongodb";
import type { PurchaseResponse } from "../models/PurchaseResponse.js";
import type { User } from "../models/User.js";
import type { Item } from "../models/Item.js";
import type { AppConfig } from "../config/config.js";
export class PurchaseController {
  constructor(
    private mongoService: MongoService,
    private appConfig: AppConfig
  ) {}

  async getAllUserBuys(req: Request, res: Response): Promise<void> {
    try {
      const username = req.query.username as string;

      if (!username) {
        res.status(400).json({ error: "username parameter is required" });
        return;
      }

      console.log(`Fetching user buys for username: ${username}`);

      const usersCollection: string = this.appConfig.mongoDb.usersCollectionName;
      const itemsCollection: string = this.appConfig.mongoDb.itemsCollectionName;
      const userDetails: Document = await this.mongoService.aggregateJoinQuery(usersCollection, { 
        username: username }, { 
            from: itemsCollection, localField: "purchases", foreignField: "_id", as: "purchaseditems"
        });
      if (!userDetails || userDetails.length === 0) {
        res.status(404).json({ error: `User ${username} not found` });
        return;
      }

      const user: User = userDetails[0] as User;
       
      console.log(`User buys fetched successfully for username: ${username}`);

      const purchaseResponse: PurchaseResponse = {
        username: user.username,
        email: user.email,
        purchaseditems: user.purchaseditems.map((purchase: Item) => ({name: purchase.name, price: purchase.price, purchasedAt: purchase.purchasedAt})),
        balance: user.balance
      };

      res.status(200).json(purchaseResponse);
      return;
    } catch (error) {
      console.error("Error in getAllUserBuys:", error);
      res.status(500).json({ error: "Failed to fetch user buys" });
      return;
    }
  }
}
