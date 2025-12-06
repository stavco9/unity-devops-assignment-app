import type { Request, Response } from "express";
import type { MongoService } from "../service/MongoService.js";
import type { Document } from "mongodb";
import type { PurchaseResponse } from "../models/PurchaseResponse.js";
import type { User } from "../models/User.js";
import type { Item } from "../models/Item.js";
import type { AppConfig } from "../config/config.js";
import logger from "../utils/logger.js";
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

      const usersCollection: string = this.appConfig.mongoDb.usersCollectionName;
      const itemsCollection: string = this.appConfig.mongoDb.itemsCollectionName;
      const userDetails: User | null = await this.getUserDetails(usersCollection, itemsCollection, username);
      if (!userDetails) {
        res.status(404).json({ error: `User ${username} not found` });
        return;
      }
 
      logger.info(`User buys fetched successfully for username: ${username}`);

      res.status(200).json(this.getPurchaseResponse(userDetails));
      return;
    } catch (error) {
      logger.error("Error in getAllUserBuys:", error);
      res.status(500).json({ error: "Failed to fetch user buys" });
      return;
    }
  }

  private async getUserDetails(usersCollectionName: string, itemsCollectionName: string, username: string): Promise<User | null> {
    logger.info(`Fetching user buys for username: ${username} from collection: ${usersCollectionName}`);
    const userDetails: Document = await this.mongoService.aggregateJoinQuery(usersCollectionName, { 
      username: username }, { 
          from: itemsCollectionName, localField: "purchases", foreignField: "_id", as: "purchaseditems"
      });
    if (!userDetails || userDetails.length === 0) {
      return null;
    }
    return userDetails[0] as User;
  }

  private getPurchaseResponse(userDetails: User): PurchaseResponse {
    return {
      username: userDetails.username,
      email: userDetails.email,
      purchaseditems: userDetails.purchaseditems.map((purchase: Item) => ({name: purchase.name, price: purchase.price, purchasedAt: purchase.purchasedAt})),
      balance: userDetails.balance
    };
  }
}
