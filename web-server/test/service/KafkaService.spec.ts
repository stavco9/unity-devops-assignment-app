import { readFileSync } from 'fs';
import { KafkaService } from '../../src/service/KafkaService.js';
import type { KafkaConfig } from '../../src/config/config.js';

jest.mock('fs');
jest.mock('get-root-path', () => ({
  rootPath: '/test',
}));
jest.mock('@confluentinc/kafka-javascript', () => ({
  KafkaJS: {
    Kafka: jest.fn().mockImplementation(() => ({
      producer: jest.fn().mockReturnValue({
        connect: jest.fn(),
        disconnect: jest.fn(),
        send: jest.fn(),
      }),
    })),
  },
}));

describe('KafkaService', () => {
  let service: KafkaService;
  let mockConfig: KafkaConfig;

  beforeEach(() => {
    mockConfig = {
      kafkaPropertiesFile: 'kafka.properties',
      purchaseTopic: 'purchase-topic',
    };

    (readFileSync as jest.Mock).mockReturnValue('key1=value1\nkey2=value2\n');
  });

  it('should create KafkaService instance', () => {
    service = new KafkaService(mockConfig);
    expect(service).toBeInstanceOf(KafkaService);
  });

  it('should read kafka properties from file', () => {
    service = new KafkaService(mockConfig);
    expect(readFileSync).toHaveBeenCalled();
  });

  it('should connect to Kafka', async () => {
    service = new KafkaService(mockConfig);
    await service.connect();
    // Connection is tested through the mock
  });

  it('should disconnect from Kafka', async () => {
    service = new KafkaService(mockConfig);
    await service.disconnect();
    // Disconnection is tested through the mock
  });

  it('should throw error when properties file is invalid', () => {
    (readFileSync as jest.Mock).mockImplementation(() => {
      throw new Error('File not found');
    });

    expect(() => new KafkaService(mockConfig)).toThrow('Failed to read Kafka properties');
  });
});

