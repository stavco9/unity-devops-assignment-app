import { Request, Response } from 'express';
import { PurchaseController } from '../../src/controller/PurchaseController.js';
import type { RestService } from '../../src/service/RestService.js';
import type { KafkaService } from '../../src/service/KafkaService.js';
import type { AppConfig } from '../../src/config/config.js';

describe('PurchaseController', () => {
  let controller: PurchaseController;
  let mockRestService: jest.Mocked<RestService>;
  let mockKafkaService: jest.Mocked<KafkaService>;
  let mockConfig: AppConfig;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;

  beforeEach(() => {
    mockRestService = {
      getRequest: jest.fn(),
    } as any;

    mockKafkaService = {
      produce: jest.fn(),
    } as any;

    mockConfig = {
      kafka: {
        kafkaPropertiesFile: 'kafka.properties',
        purchaseTopic: 'purchase-topic',
      },
      managementApi: {
        baseUrl: 'http://localhost:3001',
      },
    };

    controller = new PurchaseController(mockRestService, mockKafkaService, mockConfig);

    mockRequest = {
      query: {},
      body: {},
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

    it('should fetch user buys successfully', async () => {
      mockRequest.query = { username: 'testuser' };
      const mockResponseData = { username: 'testuser', purchaseditems: [], balance: 100 };
      (mockRestService.getRequest as jest.Mock).mockResolvedValue([200, mockResponseData]);

      await controller.getAllUserBuys(mockRequest as Request, mockResponse as Response);

      expect(mockRestService.getRequest).toHaveBeenCalledWith(
        mockConfig.managementApi.baseUrl,
        'getAllUserBuys',
        { username: 'testuser' }
      );
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(mockResponseData);
    });

    it('should handle errors', async () => {
      mockRequest.query = { username: 'testuser' };
      (mockRestService.getRequest as jest.Mock).mockRejectedValue(new Error('Network error'));

      await controller.getAllUserBuys(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Failed to fetch user buys' });
    });
  });

  describe('purchase', () => {
    it('should return 400 if username is missing', async () => {
      mockRequest.body = { maxItemPrice: 50 };

      await controller.purchase(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Request body must contain username and maxItemPrice',
      });
    });

    it('should send purchase request successfully', async () => {
      const purchaseRequest = { username: 'testuser', maxItemPrice: 50 };
      mockRequest.body = purchaseRequest;
      (mockKafkaService.produce as jest.Mock).mockResolvedValue(undefined);

      await controller.purchase(mockRequest as Request, mockResponse as Response);

      expect(mockKafkaService.produce).toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(200);
    });

    it('should handle errors', async () => {
      mockRequest.body = { username: 'testuser', maxItemPrice: 50 };
      (mockKafkaService.produce as jest.Mock).mockRejectedValue(new Error('Kafka error'));

      await controller.purchase(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
    });
  });
});

