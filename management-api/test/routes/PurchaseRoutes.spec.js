import { Router } from 'express';
import { PurchaseRoutes } from '../../src/routes/PurchaseRoutes.js';
describe('PurchaseRoutes', () => {
    let routes;
    let mockMongoService;
    let mockConfig;
    beforeEach(() => {
        mockMongoService = {};
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
