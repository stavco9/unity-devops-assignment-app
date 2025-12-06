import { Router } from 'express';
import { PurchaseRoutes } from '../../src/routes/PurchaseRoutes.js';
describe('PurchaseRoutes', () => {
    let routes;
    let mockKafkaService;
    let mockRestService;
    let mockConfig;
    beforeEach(() => {
        mockKafkaService = {};
        mockRestService = {};
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
