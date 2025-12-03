// index.ts
import express from "express";
import type { Server } from "http";
import { KafkaService } from "./service/KafkaService.js";
import { RestService } from "./service/RestService.js";
import { loadConfig } from "./config/config.js";
import { PurchaseRoutes } from "./routes/PurchaseRoutes.js";

const config = loadConfig();
const app = express();
const port = process.env.PORT || "3000";
const kafkaService = new KafkaService(config.kafka);
const restService = new RestService(config.managementApi);
const purchaseRoutes = new PurchaseRoutes(kafkaService, restService, config).getRoutes();
// Middleware
app.use(express.json());

// Routes
app.get("/", (req, res): void => {
  res.send("Hello World from web-server!");
  console.log("Response sent");
});

app.use(purchaseRoutes)

const server: Server = app.listen(port, async (): Promise<void> => {
  await kafkaService.connect();
  console.log(`Web server listening on port ${port}`);
  console.log(`Environment: ${process.env.ENVIRONMENT || "dev"}`);
});

// Handle graceful shutdown signals (SIGINT from Ctrl+C, SIGTERM from process managers)
process.on('SIGINT', async () => {
  await gracefulShutdown('SIGINT', kafkaService, server);
});

process.on('SIGTERM', async () => {
    await gracefulShutdown('SIGTERM', kafkaService, server);
});

async function gracefulShutdown(signalType: string, kafkaService: KafkaService, server: Server): Promise<void> {
  console.log(`Received ${signalType} signal. Shutting down gracefully...`);
  await kafkaService.disconnect();
  server.close(() => {
    console.log('HTTP server closed.');
    process.exit(0);
  });
}

export default app;