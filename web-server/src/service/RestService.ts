import logger from "../utils/logger.js";

// Rest service class. Handles REST requests.
export class RestService {
  // Send a GET request to the specified URL with the given query parameters.
  async getRequest<T>(baseUrl: string, uri: string, queryParams: Record<string, string>): Promise<[number, T]> {
    // Build the query string.
    let queryString: string = new URLSearchParams(queryParams as Record<string, string>).toString();
    if (queryString) {
      queryString = `?${queryString}`;
    } else {
      queryString = "";
    }

    // Build the URL.
    const url = `${baseUrl}/${uri}${queryString}`;
    
    logger.info(`Sending GET request to ${url}`);
    
    // Send the request and return the response as a tuple of the status and the response body.
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
