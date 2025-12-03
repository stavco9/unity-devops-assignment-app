import type { PurchaseRequest } from "./PurchaseRequest.js";

export interface KafkaMessage {
    key: string;
    value: string;
}

export class PurchaseMessage implements KafkaMessage {
    key: string;
    value: string;
  
    constructor(purchaseRequest: PurchaseRequest) {
      this.key = purchaseRequest.userId;
      this.value = JSON.stringify(purchaseRequest);
    }
  }
  