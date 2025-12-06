import { Router } from 'express';
import { PurchaseRoutes } from '../../src/routes/PurchaseRoutes.js';
import type { MongoService } from '../../src/service/MongoService.js';
import type { AppConfig } from '../../src/config/config.js';

describe('PurchaseRoutes', () => {
  let routes: PurchaseRoutes;
  let mockMongoService: jest.Mocked<MongoService>;
  let mockConfig: AppConfig;

  beforeEach(() => {
    mockMongoService = {} as any;
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

    routes = new PurchaseRoutes(mockMongoService, mockConfig);
  });

  it('should create routes instance', () => {
    expect(routes).toBeInstanceOf(PurchaseRoutes);
  });

  it('should return router with routes', () => {
    const router = routes.getRoutes();

    expect(router).toBeDefined();
    expect(router).toBeInstanceOf(Router);
  });
});

