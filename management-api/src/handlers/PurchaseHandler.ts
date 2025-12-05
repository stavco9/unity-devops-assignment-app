import type { KafkaJS as Kafka } from "@confluentinc/kafka-javascript";
import type { PurchaseRequest } from "../models/PurchaseRequest.js";
import type { Document, WithId, PushOperator } from "mongodb";
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

      console.log(`Checking if user ${purchaseRequest.username} has enough balance`);

      const userDetails: WithId<Document>[] = 
        await this.mongoService.simpleQuery(usersCollectionName, { 
          username: purchaseRequest.username 
        });
      if (userDetails.length === 0) {
        console.error(`User ${purchaseRequest.username} not found`);
        return;
      }
      
      const user: User = userDetails[0] as User;
      
      console.log(`User ${purchaseRequest.username} found and has a balance of ${user.balance}`);
      
      if (user.balance < purchaseRequest.maxItemPrice) {
        console.error(`User ${purchaseRequest.username} has not enough balance to purchase item with price ${purchaseRequest.maxItemPrice}`);
        return;
      }

      const itemDetails: Document = 
        await this.mongoService.aggregateSampleQuery(itemsCollectionName, { 
          price: { $lte: purchaseRequest.maxItemPrice }, 
          purchasedBy: { $eq: null} 
        }, 1);
      if (!itemDetails || itemDetails.length === 0) {
        console.error(`No item found with price less than or equal to ${purchaseRequest.maxItemPrice}`);
        return;
      }

      const item: Item = itemDetails[0] as Item;

      const newBalance: number = user.balance - item.price;

      await this.mongoService.updateSingleDocument(usersCollectionName, {
         username: purchaseRequest.username 
        }, {
          $set: { balance: newBalance },
          $push: { purchases: item._id } as unknown as PushOperator<Document>
        });
      
      await this.mongoService.updateSingleDocument(itemsCollectionName, { 
          name: item.name 
        }, 
        { 
          $set: { purchasedBy: user._id, purchasedAt: new Date(purchaseRequest.timestamp) }
        });

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
}
