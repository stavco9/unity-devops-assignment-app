import type { ManagementApiConfig } from "../config/config.js";

export class RestService {
  async getRequest<T>(baseUrl: string, uri: string, queryParams: Record<string, string>): Promise<[number, T]> {
    let queryString: string = new URLSearchParams(queryParams as Record<string, string>).toString();
    if (queryString) {
      queryString = `?${queryString}`;
    } else {
      queryString = "";
    }

    const url = `${baseUrl}/${uri}${queryString}`;

    console.log(`Sending GET request to ${url}`);
    
    try {
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      return [response.status, await response.json() as T];
    } catch (error) {
      throw new Error(
        `Failed to fetch user buys: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
}
