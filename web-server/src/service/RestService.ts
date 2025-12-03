import type { ManagementApiConfig } from "../config/config.js";

export class RestService {
  private baseUrl: string;

  constructor(config: ManagementApiConfig) {
    this.baseUrl = config.baseUrl;
  }

  async getAllUserBuys(userId: string): Promise<unknown> {
    const url = `${this.baseUrl}/getAllUserBuys?userId=${encodeURIComponent(userId)}`;
    
    try {
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      throw new Error(
        `Failed to fetch user buys: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
}
