import { PurchaseHandler } from '../../src/handlers/PurchaseHandler.js';
describe('PurchaseHandler', () => {
    let handler;
    let mockMongoService;
    let mockConfig;
    let mockMessage;
    beforeEach(() => {
        mockMongoService = {
            simpleQuery: jest.fn(),
            aggregateSampleQuery: jest.fn(),
            updateSingleDocument: jest.fn(),
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
        handler = new PurchaseHandler(mockMongoService, mockConfig);
        mockMessage = {
            key: Buffer.from('key'),
            value: Buffer.from(JSON.stringify({ username: 'testuser', maxItemPrice: 50 })),
        };
    });
    it('should create PurchaseHandler instance', () => {
        expect(handler).toBeInstanceOf(PurchaseHandler);
    });
    it('should handle empty message', async () => {
        const emptyMessage = { value: null };
        await handler.handle(emptyMessage, 'test-topic', 0);
        expect(mockMongoService.simpleQuery).not.toHaveBeenCalled();
    });
    it('should return early if user not found', async () => {
        mockMongoService.simpleQuery.mockResolvedValue([]);
        await handler.handle(mockMessage, 'test-topic', 0);
        expect(mockMongoService.simpleQuery).toHaveBeenCalled();
        expect(mockMongoService.aggregateSampleQuery).not.toHaveBeenCalled();
    });
    it('should return early if user has insufficient balance', async () => {
        const mockUser = {
            _id: {},
            createdAt: new Date(),
            username: 'testuser',
            email: 'test@example.com',
            balance: 30,
            purchases: [],
            purchaseditems: [],
        };
        mockMongoService.simpleQuery.mockResolvedValue([mockUser]);
        await handler.handle(mockMessage, 'test-topic', 0);
        expect(mockMongoService.aggregateSampleQuery).not.toHaveBeenCalled();
    });
    it('should process purchase successfully', async () => {
        const mockUser = {
            _id: {},
            createdAt: new Date(),
            username: 'testuser',
            email: 'test@example.com',
            balance: 100,
            purchases: [],
            purchaseditems: [],
        };
        const mockItem = {
            _id: {},
            name: 'Test Item',
            price: 50,
            purchasedBy: {},
            purchasedAt: new Date(),
            createdAt: new Date(),
        };
        mockMongoService.simpleQuery.mockResolvedValue([mockUser]);
        mockMongoService.aggregateSampleQuery.mockResolvedValue([mockItem]);
        mockMongoService.updateSingleDocument.mockResolvedValue(undefined);
        await handler.handle(mockMessage, 'test-topic', 0);
        expect(mockMongoService.updateSingleDocument).toHaveBeenCalledTimes(2);
    });
});
