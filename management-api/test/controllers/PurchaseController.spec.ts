import { Request, Response } from 'express';
import { PurchaseController } from '../../src/controllers/PurchaseController.js';
import type { MongoService } from '../../src/service/MongoService.js';
import type { AppConfig } from '../../src/config/config.js';
import type { User } from '../../src/models/User.js';

describe('PurchaseController', () => {
  let controller: PurchaseController;
  let mockMongoService: jest.Mocked<MongoService>;
  let mockConfig: AppConfig;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;

  beforeEach(() => {
    mockMongoService = {
      aggregateJoinQuery: jest.fn(),
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

    controller = new PurchaseController(mockMongoService, mockConfig);

    mockRequest = {
      query: {},
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    } as any;
  });

  describe('getAllUserBuys', () => {
    it('should return 400 if username is missing', async () => {
      await controller.getAllUserBuys(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'username parameter is required' });
    });

    it('should return 404 if user not found', async () => {
      mockRequest.query = { username: 'testuser' };
      (mockMongoService.aggregateJoinQuery as jest.Mock).mockResolvedValue([]);

      await controller.getAllUserBuys(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'User testuser not found' });
    });

    it('should fetch user buys successfully', async () => {
      mockRequest.query = { username: 'testuser' };
      const mockUser: User = {
        _id: {} as any,
        createdAt: new Date(),
        username: 'testuser',
        email: 'test@example.com',
        balance: 100,
        purchases: [],
        purchaseditems: [],
      };
      (mockMongoService.aggregateJoinQuery as jest.Mock).mockResolvedValue([mockUser] as any);

      await controller.getAllUserBuys(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalled();
    });

    it('should handle errors', async () => {
      mockRequest.query = { username: 'testuser' };
      (mockMongoService.aggregateJoinQuery as jest.Mock).mockRejectedValue(new Error('DB error'));

      await controller.getAllUserBuys(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Failed to fetch user buys' });
    });
  });
});

