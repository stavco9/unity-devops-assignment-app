import type { Request, Response } from "express";
import type { RestService } from "../service/RestService.js";
import type { KafkaService } from "../service/KafkaService.js";
import type { PurchaseRequest } from "../model/PurchaseRequest.js";
import type { AppConfig } from "../config/config.js";
import { PurchaseMessage } from "../model/KafkaMessage.js";
export class PurchaseController {
  constructor(
    private restService: RestService,
    private kafkaService: KafkaService,
    private appConfig: AppConfig
  ) {}

  async getAllUserBuys(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.query.userId as string;

      if (!userId) {
        res.status(400).json({ error: "userId parameter is required" });
        return;
      }

      const result = await this.restService.getAllUserBuys(userId);
      res.json(result);
    } catch (error) {
      console.error("Error in getAllUserBuys:", error);
      res.status(500).json({
        error: "Failed to fetch user buys",
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }

  async purchase(req: Request, res: Response): Promise<void> {
    try {
      const purchaseRequest = req.body as PurchaseRequest;

      if (!purchaseRequest.userId || !purchaseRequest.itemId) {
        res.status(400).json({
          error: "Request body must contain userId and itemId",
        });
        return;
      }

      purchaseRequest.timestamp = new Date().toISOString();

      await this.kafkaService.produce(this.appConfig.kafka.purchaseTopic, new PurchaseMessage(purchaseRequest));
      res.status(200).json({
        message: "Purchase request sent successfully",
        purchaseRequest,
      });
    } catch (error) {
      console.error("Error in purchase:", error);
      res.status(500).json({
        error: "Failed to process purchase",
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }
}
