import { Router } from 'express';
import { PurchaseController } from "../controllers/PurchaseController.js";
import { MongoService } from "../service/MongoService.js";
import type { AppConfig } from "../config/config.js";

export class PurchaseRoutes {
  private purchaseRoutes: Router;
  private purchaseController: PurchaseController;

  constructor(mongoService: MongoService, config: AppConfig) {
    this.purchaseRoutes = Router();
    this.purchaseController = new PurchaseController(mongoService, config);
  }

  getRoutes(): Router {
    this.purchaseRoutes.get("/getAllUserBuys", (req, res): void => {
      this.purchaseController.getAllUserBuys(req, res);
    });
    return this.purchaseRoutes;
  }
}

export default PurchaseRoutes;