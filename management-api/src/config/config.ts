import { rootPath } from 'get-root-path';
import dotenv from 'dotenv';
import { readFileSync, existsSync } from "fs";
import { join } from "path";
import logger from "../utils/logger.js";

export interface KafkaConfig {
  kafkaPropertiesFile: string;
  purchaseTopic: string;
}

export interface MongoDbConfig {
  dbHost: string;
  dbAuthMechanism: string;
  dbName: string;
  usersCollectionName: string;
  itemsCollectionName: string;
}

export interface AppConfig {
  kafka: KafkaConfig;
  mongoDb: MongoDbConfig;
}

// Mainly for local development, to avoid having to set environment variables in the terminal. In Kubernetes, we use the secret manager to set the environment variables.
function loadEnv(environment: string): void {
  const envPath = join(rootPath, 'config', `.env.${environment}`);
  if (existsSync(envPath)) {
    dotenv.config({ path: envPath });
    logger.info(`Environment variables loaded from ${envPath}`);
  } else {
    logger.info(`Using default environment variables for environment: ${environment}`);
  }
}

export function loadConfig(): AppConfig {
  const environment = process.env.ENVIRONMENT || "local";
  loadEnv(environment);
  const configPath = join(rootPath, 'config', `config-${environment}.json`);

  
  try {
    const configFile = readFileSync(configPath, "utf-8");
    return JSON.parse(configFile) as AppConfig;
  } catch (error) {
    throw new Error(
      `Failed to load configuration from ${configPath}: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}
