import { PurchaseController } from '../../src/controller/PurchaseController.js';
describe('PurchaseController', () => {
    let controller;
    let mockRestService;
    let mockKafkaService;
    let mockConfig;
    let mockRequest;
    let mockResponse;
    beforeEach(() => {
        mockRestService = {
            getRequest: jest.fn(),
        };
        mockKafkaService = {
            produce: jest.fn(),
        };
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
        };
    });
    describe('getAllUserBuys', () => {
        it('should return 400 if username is missing', async () => {
            await controller.getAllUserBuys(mockRequest, mockResponse);
            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({ error: 'username parameter is required' });
        });
        it('should fetch user buys successfully', async () => {
            mockRequest.query = { username: 'testuser' };
            const mockResponseData = { username: 'testuser', purchaseditems: [], balance: 100 };
            mockRestService.getRequest.mockResolvedValue([200, mockResponseData]);
            await controller.getAllUserBuys(mockRequest, mockResponse);
            expect(mockRestService.getRequest).toHaveBeenCalledWith(mockConfig.managementApi.baseUrl, 'getAllUserBuys', { username: 'testuser' });
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith(mockResponseData);
        });
        it('should handle errors', async () => {
            mockRequest.query = { username: 'testuser' };
            mockRestService.getRequest.mockRejectedValue(new Error('Network error'));
            await controller.getAllUserBuys(mockRequest, mockResponse);
            expect(mockResponse.status).toHaveBeenCalledWith(500);
            expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Failed to fetch user buys' });
        });
    });
    describe('purchase', () => {
        it('should return 400 if username is missing', async () => {
            mockRequest.body = { maxItemPrice: 50 };
            await controller.purchase(mockRequest, mockResponse);
            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: 'Request body must contain username and maxItemPrice',
            });
        });
        it('should send purchase request successfully', async () => {
            const purchaseRequest = { username: 'testuser', maxItemPrice: 50 };
            mockRequest.body = purchaseRequest;
            mockKafkaService.produce.mockResolvedValue(undefined);
            await controller.purchase(mockRequest, mockResponse);
            expect(mockKafkaService.produce).toHaveBeenCalled();
            expect(mockResponse.status).toHaveBeenCalledWith(200);
        });
        it('should handle errors', async () => {
            mockRequest.body = { username: 'testuser', maxItemPrice: 50 };
            mockKafkaService.produce.mockRejectedValue(new Error('Kafka error'));
            await controller.purchase(mockRequest, mockResponse);
            expect(mockResponse.status).toHaveBeenCalledWith(500);
        });
    });
});
