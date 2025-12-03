import { Router } from 'express';
import { PurchaseController } from "../controller/PurchaseController.js";
import { RestService } from "../service/RestService.js";
import { KafkaService } from "../service/KafkaService.js";
import type { AppConfig } from "../config/config.js";

export class PurchaseRoutes {
  private purchaseRoutes: Router;
  private purchaseController: PurchaseController;

  constructor(kafkaService: KafkaService, restService: RestService, config: AppConfig) {
    this.purchaseRoutes = Router();
    this.purchaseController = new PurchaseController(restService, kafkaService, config);
  }

  getRoutes(): Router {
    this.purchaseRoutes.get("/getAllUserBuys", (req, res): void => {
      this.purchaseController.getAllUserBuys(req, res);
    });
    this.purchaseRoutes.post("/purchase", (req, res): void => {
      this.purchaseController.purchase(req, res);
    });
    return this.purchaseRoutes;
  }
}

export default PurchaseRoutes;