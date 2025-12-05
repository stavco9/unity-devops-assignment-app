export interface PurchasedItem {
  name: string;
  price: number;
  purchasedAt: Date;
}

export interface PurchaseResponse {
  username: string;
  email: string;
  purchaseditems: PurchasedItem[];
  balance: number;
}