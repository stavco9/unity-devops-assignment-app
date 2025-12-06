import type { KafkaJS as Kafka } from "@confluentinc/kafka-javascript";
import type { PurchaseRequest } from "../models/PurchaseRequest.js";
import type { Document, WithId, PushOperator, ObjectId } from "mongodb";
import type { User } from "../models/User.js";
import type { Item } from "../models/Item.js";
import type { MongoService } from "../service/MongoService.js";
import type { AppConfig } from "../config/config.js";
import logger from "../utils/logger.js";

// Purchase handler class. Handles the purchase messages from Kafka.
export class PurchaseHandler {
  constructor(
    private mongoService: MongoService,
    private appConfig: AppConfig
  ) {}

  async handle(message: Kafka.Message, topic: string, partition: number): Promise<void> {
    try {
      // Get the message value from the Kafka message and validate it.
      const messageValue = message.value?.toString();
      if (!messageValue) {
        logger.warn(`Received empty message from topic ${topic}, partition ${partition}`);
        return;
      }

      // Parse the message value as a PurchaseRequest object.
      const purchaseRequest: PurchaseRequest = JSON.parse(messageValue);

      // Get the users and items collections names from the configuration.
      const usersCollectionName = this.appConfig.mongoDb.usersCollectionName;
      const itemsCollectionName = this.appConfig.mongoDb.itemsCollectionName;
      
      logger.info(`Processing purchase message:`, {
        topic,
        partition,
        key: message.key?.toString(),
        data: purchaseRequest,
      });

      // Get the user details from the database and check if the user exists.
      const user: User | null = await this.getUserDetails(usersCollectionName, purchaseRequest.username);
      if (!user) {
        logger.warn(`User ${purchaseRequest.username} not found`);
        return;
      }

      // Check if the user has enough balance to purchase the item.
      if (user.balance < purchaseRequest.maxItemPrice) {
        logger.warn(`User ${purchaseRequest.username} has not enough balance to purchase item with price ${purchaseRequest.maxItemPrice}`);
        return;
      }

      // Get a random item from the database that is less than or equal to the max item price.
      const item: Item | null = await this.getRandomItem(itemsCollectionName, purchaseRequest.maxItemPrice);
      if (!item) {
        logger.warn(`No item found with price less than or equal to ${purchaseRequest.maxItemPrice}`);
        return;
      }

      // Calculate the new balance of the user.
      const newBalance: number = user.balance - item.price;

      // Update the user's purchases and balance in the database.
      await this.updateUserPurchases(usersCollectionName, user._id, newBalance, item._id);

      // Update the item's purchased by field in the database.
      await this.updateItemPurchasedBy(itemsCollectionName, item._id, user._id);

      logger.info(`Purchased item ${item.name} for user ${purchaseRequest.username}`);
      return;

    } catch (error) {
      logger.error(
        `Error handling purchase message from topic ${topic}, partition ${partition}:`,
        error instanceof Error ? error.message : String(error)
      );
      throw error;
    }
  }

  // Get the user details from the database by a simple query.
  private async getUserDetails(usersCollectionName: string, username: string): Promise<User | null> {
    logger.info(`Getting user details for username: ${username} from collection: ${usersCollectionName}`);

    const userDetails: WithId<Document>[] = 
      await this.mongoService.simpleQuery(usersCollectionName, { 
        username: username 
      });
    if (userDetails.length === 0) {
      return null;
    }

    logger.info(`User ${username} found and has a balance of ${userDetails[0].balance}`);
    return userDetails[0] as User;
  }

  // Get a random item from the database that is less than or equal to the max item price and not purchased by any user.
  private async getRandomItem(itemsCollectionName: string, maxItemPrice: number): Promise<Item | null> {
    const itemDetails: Document = 
      await this.mongoService.aggregateSampleQuery(itemsCollectionName, { 
        price: { $lte: maxItemPrice }, 
        purchasedBy: { $eq: null} 
      }, 1);
    if (!itemDetails || itemDetails.length === 0) {
      return null;
    }

    return itemDetails[0] as Item;
  }
  
  // Update the user's purchases with the new item and update the new balance in the database.
  private async updateUserPurchases(usersCollectionName: string, userId: ObjectId, balance: number, itemId: ObjectId): Promise<void> {
    await this.mongoService.updateSingleDocument(usersCollectionName, {
      _id: userId
    }, {
      $set: { balance: balance },
      $push: { purchases: itemId } as unknown as PushOperator<Document>
    });
  }

  // Update the item's purchased by field with the user id and the purchase date in the database.
  private async updateItemPurchasedBy(itemsCollectionName: string, itemId: ObjectId, userId: ObjectId): Promise<void> {
    await this.mongoService.updateSingleDocument(itemsCollectionName, {
      _id: itemId
    }, {
        $set: { purchasedBy: userId, purchasedAt: new Date().toISOString() }
      });
  }
}
