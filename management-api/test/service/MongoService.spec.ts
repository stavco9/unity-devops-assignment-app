import { MongoService } from '../../src/service/MongoService.js';
import type { MongoDbConfig } from '../../src/config/config.js';
import { MongoClient } from 'mongodb';

jest.mock('mongodb');

describe('MongoService', () => {
  let service: MongoService;
  let mockConfig: MongoDbConfig;
  let mockClient: jest.Mocked<MongoClient>;
  let mockDb: any;

  beforeEach(() => {
    mockConfig = {
      dbHost: 'localhost',
      dbAuthMechanism: 'MONGODB-AWS',
      dbName: 'testdb',
      usersCollectionName: 'users',
      itemsCollectionName: 'items',
    };

    mockDb = {
      collection: jest.fn().mockReturnValue({
        find: jest.fn().mockReturnValue({
          toArray: jest.fn().mockResolvedValue([]),
        }),
        aggregate: jest.fn().mockReturnValue({
          toArray: jest.fn().mockResolvedValue([]),
        }),
        updateOne: jest.fn().mockResolvedValue({}),
      }),
    };

    mockClient = {
      connect: jest.fn().mockResolvedValue(undefined),
      close: jest.fn().mockResolvedValue(undefined),
      db: jest.fn().mockReturnValue(mockDb),
    } as any;

    (MongoClient as unknown as jest.Mock).mockImplementation(() => mockClient as any);
  });

  it('should create MongoService instance', () => {
    service = new MongoService(mockConfig);
    expect(service).toBeInstanceOf(MongoService);
  });

  it('should connect to MongoDB', async () => {
    service = new MongoService(mockConfig);
    await service.connect();
    expect(mockClient.connect).toHaveBeenCalled();
  });

  it('should disconnect from MongoDB', async () => {
    service = new MongoService(mockConfig);
    await service.disconnect();
    expect(mockClient.close).toHaveBeenCalled();
  });

  it('should perform simple query', async () => {
    service = new MongoService(mockConfig);
    await service.connect();
    const result = await service.simpleQuery('users', { username: 'testuser' });

    expect(mockDb.collection).toHaveBeenCalledWith('users');
    expect(result).toEqual([]);
  });

  it('should perform aggregate sample query', async () => {
    service = new MongoService(mockConfig);
    await service.connect();
    const result = await service.aggregateSampleQuery('items', { price: { $lte: 50 } }, 1);

    expect(mockDb.collection).toHaveBeenCalledWith('items');
    expect(result).toEqual([]);
  });

  it('should perform aggregate join query', async () => {
    service = new MongoService(mockConfig);
    await service.connect();
    const result = await service.aggregateJoinQuery(
      'users',
      { username: 'testuser' },
      { from: 'items', localField: 'purchases', foreignField: '_id', as: 'purchaseditems' }
    );

    expect(mockDb.collection).toHaveBeenCalledWith('users');
    expect(result).toEqual([]);
  });

  it('should update single document', async () => {
    service = new MongoService(mockConfig);
    await service.connect();
    await service.updateSingleDocument('users', { username: 'testuser' }, { $set: { balance: 100 } });

    expect(mockDb.collection).toHaveBeenCalledWith('users');
  });
});

