// index.ts
import express from "express";
import type { Server } from "http";
import { KafkaService } from "./service/KafkaService.js";
import { MongoService } from "./service/MongoService.js";
import { loadConfig } from "./config/config.js";
import { PurchaseHandler } from "./handlers/PurchaseHandler.js";
import { PurchaseRoutes } from "./routes/PurchaseRoutes.js";
import logger from "./utils/logger.js";

const config = loadConfig();
const app = express();
const port = process.env.PORT || "3001";
const kafkaService = new KafkaService(config.kafka);
const mongoService = new MongoService(config.mongoDb);
const purchaseHandler = new PurchaseHandler(mongoService, config);
const purchaseRoutes = new PurchaseRoutes(mongoService, config).getRoutes();
let ready: boolean = false;

// Middleware
app.use(express.json());

// Routes
app.get("/", (req, res): void => {
  res.send("Hello World from management-api!");
  logger.info("Response sent");
});

app.get("/health", (req, res): void => {
  if (ready) {
    res.status(200).send("OK");
  } else {
    res.status(503).send("Service not ready yet");
  }
});

app.use(purchaseRoutes)

const server: Server = app.listen(port, async (): Promise<void> => {
  await kafkaService.connect();
  // Register consumer with handler for purchase topic
  await kafkaService.consume(config.kafka.purchaseTopic, async (message, topic, partition) => {
    await purchaseHandler.handle(message, topic, partition);
  });
  await mongoService.connect();
  logger.info(`Management API listening on port ${port}`);
  logger.info(`Environment: ${process.env.ENVIRONMENT || "dev"}`);
  ready = true;
});

// Handle graceful shutdown signals (SIGINT from Ctrl+C, SIGTERM from process managers)
process.on('SIGINT', async () => {
  await gracefulShutdown('SIGINT', kafkaService, mongoService, server);
});

process.on('SIGTERM', async () => {
    await gracefulShutdown('SIGTERM', kafkaService, mongoService, server);
});

async function gracefulShutdown(signalType: string, kafkaService: KafkaService, mongoService: MongoService, server: Server): Promise<void> {
  logger.info(`Received ${signalType} signal. Shutting down gracefully...`);
  await kafkaService.disconnect();
  await mongoService.disconnect();
  server.close(() => {
    logger.info('HTTP server closed.');
    process.exit(0);
  });
}

export default app;