import { Router } from 'express';
import { PurchaseRoutes } from '../../src/routes/PurchaseRoutes.js';
import type { KafkaService } from '../../src/service/KafkaService.js';
import type { RestService } from '../../src/service/RestService.js';
import type { AppConfig } from '../../src/config/config.js';

describe('PurchaseRoutes', () => {
  let routes: PurchaseRoutes;
  let mockKafkaService: jest.Mocked<KafkaService>;
  let mockRestService: jest.Mocked<RestService>;
  let mockConfig: AppConfig;

  beforeEach(() => {
    mockKafkaService = {} as any;
    mockRestService = {} as any;
    mockConfig = {
      kafka: {
        kafkaPropertiesFile: 'kafka.properties',
        purchaseTopic: 'purchase-topic',
      },
      managementApi: {
        baseUrl: 'http://localhost:3001',
      },
    };

    routes = new PurchaseRoutes(mockKafkaService, mockRestService, mockConfig);
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

