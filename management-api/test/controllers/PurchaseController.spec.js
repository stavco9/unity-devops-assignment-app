import { PurchaseController } from '../../src/controllers/PurchaseController.js';
describe('PurchaseController', () => {
    let controller;
    let mockMongoService;
    let mockConfig;
    let mockRequest;
    let mockResponse;
    beforeEach(() => {
        mockMongoService = {
            aggregateJoinQuery: jest.fn(),
        };
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
        };
    });
    describe('getAllUserBuys', () => {
        it('should return 400 if username is missing', async () => {
            await controller.getAllUserBuys(mockRequest, mockResponse);
            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({ error: 'username parameter is required' });
        });
        it('should return 404 if user not found', async () => {
            mockRequest.query = { username: 'testuser' };
            mockMongoService.aggregateJoinQuery.mockResolvedValue([]);
            await controller.getAllUserBuys(mockRequest, mockResponse);
            expect(mockResponse.status).toHaveBeenCalledWith(404);
            expect(mockResponse.json).toHaveBeenCalledWith({ error: 'User testuser not found' });
        });
        it('should fetch user buys successfully', async () => {
            mockRequest.query = { username: 'testuser' };
            const mockUser = {
                _id: {},
                createdAt: new Date(),
                username: 'testuser',
                email: 'test@example.com',
                balance: 100,
                purchases: [],
                purchaseditems: [],
            };
            mockMongoService.aggregateJoinQuery.mockResolvedValue([mockUser]);
            await controller.getAllUserBuys(mockRequest, mockResponse);
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalled();
        });
        it('should handle errors', async () => {
            mockRequest.query = { username: 'testuser' };
            mockMongoService.aggregateJoinQuery.mockRejectedValue(new Error('DB error'));
            await controller.getAllUserBuys(mockRequest, mockResponse);
            expect(mockResponse.status).toHaveBeenCalledWith(500);
            expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Failed to fetch user buys' });
        });
    });
});
