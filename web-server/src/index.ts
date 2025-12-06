import express from "express";
import type { Server } from "http";
import { KafkaService } from "./service/KafkaService.js";
import { RestService } from "./service/RestService.js";
import { loadConfig } from "./config/config.js";
import { PurchaseRoutes } from "./routes/PurchaseRoutes.js";
import logger from "./utils/logger.js";

const config = loadConfig();
const app = express();
const port = process.env.PORT || "3000";

// Initialize the purchase routes and it's dependencies.
const kafkaService = new KafkaService(config.kafka);
const restService = new RestService();
const purchaseRoutes = new PurchaseRoutes(kafkaService, restService, config).getRoutes();

let ready: boolean = false;

// Middleware
app.use(express.json());

// Default route
app.get("/", (req, res): void => {
  res.send("Hello World from web-server!");
  logger.info("Response sent");
});

// Health check route. Returns 200 if Kafka producer is connected.
app.get("/health", (req, res): void => {
  if (ready) {
    res.status(200).send("OK");
  } else {
    res.status(503).send("Service not ready yet");
  }
});

// Purchase routes
app.use(purchaseRoutes)

// Start the server and connect to Kafka cluster.
const server: Server = app.listen(port, async (): Promise<void> => {
  await kafkaService.connect();
  logger.info(`Web server listening on port ${port}`);
  logger.info(`Environment: ${process.env.ENVIRONMENT || "dev"}`);
  ready = true;
});

// Handle graceful shutdown signals (SIGINT from Ctrl+C, SIGTERM from process managers)
process.on('SIGINT', async () => {
  await gracefulShutdown('SIGINT', kafkaService, server);
});

// Handle graceful shutdown signals (SIGTERM from process managers)
process.on('SIGTERM', async () => {
    await gracefulShutdown('SIGTERM', kafkaService, server);
});

// Graceful shutdown function. Disconnects from Kafka cluster and closes the server.
async function gracefulShutdown(signalType: string, kafkaService: KafkaService, server: Server): Promise<void> {
  logger.info(`Received ${signalType} signal. Shutting down gracefully...`);
  await kafkaService.disconnect();
  server.close(() => {
    logger.info('HTTP server closed.');
    process.exit(0);
  });
}

export default app;