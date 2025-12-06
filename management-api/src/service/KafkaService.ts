import { readFileSync } from "fs";
import { KafkaJS as Kafka } from "@confluentinc/kafka-javascript";
import type { KafkaConfig } from "../config/config.js";
import { rootPath } from 'get-root-path';
import { join } from "path";
import logger from "../utils/logger.js";

export type MessageHandler = (message: Kafka.Message, topic: string, partition: number) => Promise<void>;

// Kafka service class. Handles the Kafka operations.
export class KafkaService {
  private consumer: Kafka.Consumer;

  // Constructor. Initializes the Kafka consumer.
  constructor(config: KafkaConfig) {
    try { 
      const kafkaProperties = this.readKafkaProperties(config.kafkaPropertiesFile);
      const kafka = new Kafka.Kafka();

      this.consumer = kafka.consumer(kafkaProperties);
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
      await this.consumer.connect();
      logger.info("Kafka consumer connected");
    } catch (error) {
      logger.error(
        `Kafka consumer connection error: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  // Disconnect from the Kafka cluster.
  async disconnect(): Promise<void> {
    try {
      await this.consumer.disconnect();
      logger.info("Kafka consumer disconnected");
    } catch (error) {
      logger.error(
        `Kafka consumer disconnection error: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  // Consume messages from the specified Kafka topic.
  async consume(kafkaTopic: string, messageHandler?: MessageHandler): Promise<void> {
    try {
      // subscribe to the topic
      await this.consumer.subscribe({ topics: [kafkaTopic] });

      // Consume messages from the topic if a message handler is provided.
      this.consumer.run({
        eachMessage: async ({ topic, partition, message }: { topic: string, partition: number, message: Kafka.Message }) => {
          if (messageHandler) {
            await messageHandler(message, topic, partition);
          } else {
            logger.info(`Consumed message from topic ${topic}, partition ${partition}: key = ${message.key?.toString()}, value = ${message.value?.toString()}`);
          }
        },
      });
    } catch (error) {
      logger.warn(
        `Kafka consumer consumption warning: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
}
