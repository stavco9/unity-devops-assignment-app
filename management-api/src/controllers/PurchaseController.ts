import type { Request, Response } from "express";
import type { MongoService } from "../service/MongoService.js";
import type { Document } from "mongodb";
import type { PurchaseResponse } from "../models/PurchaseResponse.js";
import type { User } from "../models/User.js";
import type { Item } from "../models/Item.js";
import type { AppConfig } from "../config/config.js";
import logger from "../utils/logger.js";

// Purchase controller class. Handles the purchase requests.
export class PurchaseController {
  constructor(
    private mongoService: MongoService,
    private appConfig: AppConfig
  ) {}

  // Get all items purchased by a user.
  async getAllUserBuys(req: Request, res: Response): Promise<void> {
    try {
      const username = req.query.username as string;

      // Validate username parameter.
      if (!username) {
        res.status(400).json({ error: "username parameter is required" });
        return;
      }


      // Get the users and items collections names from the configuration.
      const usersCollection: string = this.appConfig.mongoDb.usersCollectionName;
      const itemsCollection: string = this.appConfig.mongoDb.itemsCollectionName;

      // Get the user details from the database and check if the user exists.
      const userDetails: User | null = await this.getUserDetails(usersCollection, itemsCollection, username);
      if (!userDetails) {
        res.status(404).json({ error: `User ${username} not found` });
        return;
      }

      logger.info(`User buys fetched successfully for username: ${username}`);

      // Return the purchase response.
      res.status(200).json(this.getPurchaseResponse(userDetails));
      return;
    } catch (error) {
      logger.error("Error in getAllUserBuys:", error);
      res.status(500).json({ error: "Failed to fetch user buys" });
      return;
    }
  }

  // Get the user details from the database and join the items purchased by the user.
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

  // Get the purchase response as a PurchaseResponse object.
  private getPurchaseResponse(userDetails: User): PurchaseResponse {
    return {
      username: userDetails.username,
      email: userDetails.email,
      purchaseditems: userDetails.purchaseditems.map((purchase: Item) => (
        {name: purchase.name, price: purchase.price, purchasedAt: purchase.purchasedAt}
      )),
      balance: userDetails.balance
    };
  }
}
