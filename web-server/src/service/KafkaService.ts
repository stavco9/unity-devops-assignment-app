import { readFileSync } from "fs";
import { KafkaJS as Kafka } from "@confluentinc/kafka-javascript";
import type { KafkaConfig } from "../config/config.js";
import type { KafkaMessage } from "../model/KafkaMessage.js";
import { rootPath } from 'get-root-path';
import { join } from "path";
import logger from "../utils/logger.js";

// Kafka service class. Handles Kafka operations.
export class KafkaService {
  // The Kafka producer.
  private producer: Kafka.Producer;

  // Constructor. Initializes the Kafka producer.
  constructor(config: KafkaConfig) {
    try { 
      const kafkaProperties = this.readKafkaProperties(config.kafkaPropertiesFile);
      const kafka = new Kafka.Kafka();

      this.producer = kafka.producer(kafkaProperties);
    } catch (error) {
      throw new Error(
        `Failed to read Kafka properties from ${config.kafkaPropertiesFile}: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  // Read the Kafka properties from the file under the root config directory.
  readKafkaProperties(kafkaPropertiesFile: string): Record<string, string> {
    const data = readFileSync(join(rootPath, 'config', kafkaPropertiesFile), "utf8").toString().split("\n");
    return data.reduce((config: Record<string, string>, line: string) => {
        const [key, value] = line.split("=");
        if (key && value) {
            config[key] = value;
        }
        return config;
    }, {});
  }

  // Connect to the Kafka cluster.
  async connect(): Promise<void> {
    try {
      await this.producer.connect();
      logger.info("Kafka producer connected");
    } catch (error) {
      logger.error(
        `Kafka connection error: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  // Disconnect from the Kafka cluster.
  async disconnect(): Promise<void> {
    try {
      await this.producer.disconnect();
      logger.info("Kafka producer disconnected");
    } catch (error) {
      logger.error(
        `Kafka disconnection error: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  // Produce a message to the specified Kafka topic.
  async produce(kafkaTopic: string, kafkaMessage: KafkaMessage): Promise<void> {
    try {
      await this.producer.send({
        topic: kafkaTopic,
        messages: [kafkaMessage],
      });
      logger.info(`Purchase sent to Kafka topic ${kafkaTopic}:`, kafkaMessage);
    } catch (error) {
      throw new Error(
        `Failed to send purchase to Kafka: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
}
