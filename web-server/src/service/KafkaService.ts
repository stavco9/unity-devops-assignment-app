import { readFileSync } from "fs";
import { KafkaJS as Kafka } from "@confluentinc/kafka-javascript";
import type { KafkaConfig } from "../config/config.js";
import type { KafkaMessage } from "../model/KafkaMessage.js";
import { rootPath } from 'get-root-path';
import { join } from "path";

export class KafkaService {
  private producer: Kafka.Producer;

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

  async connect(): Promise<void> {
    try {
      await this.producer.connect();
      console.log("Kafka producer connected (mock)");
    } catch (error) {
      console.warn(
        `Kafka connection warning (mock mode): ${error instanceof Error ? error.message : String(error)}`
      );
      // In mock mode, we continue even if connection fails
    }
  }

  async disconnect(): Promise<void> {
    try {
      await this.producer.disconnect();
      console.log("Kafka producer disconnected");
    } catch (error) {
      console.warn(
        `Kafka disconnection warning: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  async produce(kafkaTopic: string, kafkaMessage: KafkaMessage): Promise<void> {
    try {
      await this.producer.send({
        topic: kafkaTopic,
        messages: [kafkaMessage],
      });
      console.log(`Purchase sent to Kafka topic ${kafkaTopic}:`, kafkaMessage);
    } catch (error) {
      throw new Error(
        `Failed to send purchase to Kafka: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
}
