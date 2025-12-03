import { rootPath } from 'get-root-path';
import { readFileSync } from "fs";
import { join } from "path";

export interface KafkaConfig {
  kafkaPropertiesFile: string;
  purchaseTopic: string;
}

export interface ManagementApiConfig {
  baseUrl: string;
}

export interface AppConfig {
  kafka: KafkaConfig;
  managementApi: ManagementApiConfig;
}

export function loadConfig(): AppConfig {
  const environment = process.env.ENVIRONMENT || "local";
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
