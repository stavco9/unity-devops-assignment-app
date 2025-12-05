import type { KafkaJS as Kafka } from "@confluentinc/kafka-javascript";
import type { PurchaseRequest } from "../models/PurchaseRequest.js";
import type { Document, WithId, PushOperator, ObjectId } from "mongodb";
import type { User } from "../models/User.js";
import type { Item } from "../models/Item.js";
import type { MongoService } from "../service/MongoService.js";
import type { AppConfig } from "../config/config.js";

export class PurchaseHandler {
  constructor(
    private mongoService: MongoService,
    private appConfig: AppConfig
  ) {}

  async handle(message: Kafka.Message, topic: string, partition: number): Promise<void> {
    try {
      const messageValue = message.value?.toString();
      if (!messageValue) {
        console.warn(`Received empty message from topic ${topic}, partition ${partition}`);
        return;
      }

      const purchaseRequest: PurchaseRequest = JSON.parse(messageValue);
      const usersCollectionName = this.appConfig.mongoDb.usersCollectionName;
      const itemsCollectionName = this.appConfig.mongoDb.itemsCollectionName;
      
      console.log(`Processing purchase message:`, {
        topic,
        partition,
        key: message.key?.toString(),
        data: purchaseRequest,
      });

      const user: User | null = await this.getUserDetails(usersCollectionName, purchaseRequest.username);
      if (!user) {
        console.warn(`User ${purchaseRequest.username} not found`);
        return;
      }

      if (user.balance < purchaseRequest.maxItemPrice) {
        console.warn(`User ${purchaseRequest.username} has not enough balance to purchase item with price ${purchaseRequest.maxItemPrice}`);
        return;
      }

      const item: Item | null = await this.getRandomItem(itemsCollectionName, purchaseRequest.maxItemPrice);
      if (!item) {
        console.warn(`No item found with price less than or equal to ${purchaseRequest.maxItemPrice}`);
        return;
      }

      const newBalance: number = user.balance - item.price;

      await this.updateUserPurchases(usersCollectionName, user._id, newBalance, item._id);
      
      await this.updateItemPurchasedBy(itemsCollectionName, item._id, user._id);

      console.log(`Purchased item ${item.name} for user ${purchaseRequest.username}`);
      return;

    } catch (error) {
      console.error(
        `Error handling purchase message from topic ${topic}, partition ${partition}:`,
        error instanceof Error ? error.message : String(error)
      );
      throw error;
    }
  }

  private async getUserDetails(usersCollectionName: string, username: string): Promise<User | null> {
    console.log(`Getting user details for username: ${username} from collection: ${usersCollectionName}`);

    const userDetails: WithId<Document>[] = 
      await this.mongoService.simpleQuery(usersCollectionName, { 
        username: username 
      });
    if (userDetails.length === 0) {
      return null;
    }

    console.log(`User ${username} found and has a balance of ${userDetails[0].balance}`);
    return userDetails[0] as User;
  }

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
  
  private async updateUserPurchases(usersCollectionName: string, userId: ObjectId, balance: number, itemId: ObjectId): Promise<void> {
    await this.mongoService.updateSingleDocument(usersCollectionName, {
      _id: userId
    }, {
      $set: { balance: balance },
      $push: { purchases: itemId } as unknown as PushOperator<Document>
    });
  }

  private async updateItemPurchasedBy(itemsCollectionName: string, itemId: ObjectId, userId: ObjectId): Promise<void> {
    await this.mongoService.updateSingleDocument(itemsCollectionName, {
      _id: itemId
    }, {
        $set: { purchasedBy: userId, purchasedAt: new Date().toISOString() }
      });
  }
}
