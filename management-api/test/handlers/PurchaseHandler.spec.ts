import { PurchaseHandler } from '../../src/handlers/PurchaseHandler.js';
import type { MongoService } from '../../src/service/MongoService.js';
import type { AppConfig } from '../../src/config/config.js';
import type { User } from '../../src/models/User.js';
import type { Item } from '../../src/models/Item.js';
import type { KafkaJS as Kafka } from '@confluentinc/kafka-javascript';

describe('PurchaseHandler', () => {
  let handler: PurchaseHandler;
  let mockMongoService: jest.Mocked<MongoService>;
  let mockConfig: AppConfig;
  let mockMessage: Kafka.Message;

  beforeEach(() => {
    mockMongoService = {
      simpleQuery: jest.fn(),
      aggregateSampleQuery: jest.fn(),
      updateSingleDocument: jest.fn(),
    } as any;

    mockConfig = {
      kafka: {
        kafkaPropertiesFile: 'kafka.properties',
        purchaseTopic: 'purchase-topic',
      },
      mongoDb: {
        dbHost: 'localhost',
        dbAuthMechanism: 'MONGODB-AWS',
        dbName: 'testdb',
        usersCollectionName: 'users',
        itemsCollectionName: 'items',
      },
    };

    handler = new PurchaseHandler(mockMongoService, mockConfig);

    mockMessage = {
      key: Buffer.from('key'),
      value: Buffer.from(JSON.stringify({ username: 'testuser', maxItemPrice: 50 })),
    } as any;
  });

  it('should create PurchaseHandler instance', () => {
    expect(handler).toBeInstanceOf(PurchaseHandler);
  });

  it('should handle empty message', async () => {
    const emptyMessage = { value: null } as any;

    await handler.handle(emptyMessage, 'test-topic', 0);

    expect(mockMongoService.simpleQuery).not.toHaveBeenCalled();
  });

    it('should return early if user not found', async () => {
      (mockMongoService.simpleQuery as jest.Mock).mockResolvedValue([]);

    await handler.handle(mockMessage, 'test-topic', 0);

    expect(mockMongoService.simpleQuery).toHaveBeenCalled();
    expect(mockMongoService.aggregateSampleQuery).not.toHaveBeenCalled();
  });

  it('should return early if user has insufficient balance', async () => {
    const mockUser: User = {
      _id: {} as any,
      createdAt: new Date(),
      username: 'testuser',
      email: 'test@example.com',
      balance: 30,
      purchases: [],
      purchaseditems: [],
    };
    (mockMongoService.simpleQuery as jest.Mock).mockResolvedValue([mockUser] as any);

    await handler.handle(mockMessage, 'test-topic', 0);

    expect(mockMongoService.aggregateSampleQuery).not.toHaveBeenCalled();
  });

  it('should process purchase successfully', async () => {
    const mockUser: User = {
      _id: {} as any,
      createdAt: new Date(),
      username: 'testuser',
      email: 'test@example.com',
      balance: 100,
      purchases: [],
      purchaseditems: [],
    };
    const mockItem: Item = {
      _id: {} as any,
      name: 'Test Item',
      price: 50,
      purchasedBy: {} as any,
      purchasedAt: new Date(),
      createdAt: new Date(),
    };
    (mockMongoService.simpleQuery as jest.Mock).mockResolvedValue([mockUser] as any);
    (mockMongoService.aggregateSampleQuery as jest.Mock).mockResolvedValue([mockItem] as any);
    (mockMongoService.updateSingleDocument as jest.Mock).mockResolvedValue(undefined);

    await handler.handle(mockMessage, 'test-topic', 0);

    expect(mockMongoService.updateSingleDocument).toHaveBeenCalledTimes(2);
  });
});

