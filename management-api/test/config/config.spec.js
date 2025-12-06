import { readFileSync, existsSync } from 'fs';
import dotenv from 'dotenv';
import { loadConfig } from '../../src/config/config.js';
jest.mock('fs');
jest.mock('dotenv');
jest.mock('get-root-path', () => ({
    rootPath: '/test',
}));
describe('loadConfig', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });
    afterEach(() => {
        jest.restoreAllMocks();
    });
    it('should load config successfully', () => {
        const mockConfig = {
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
        existsSync.mockReturnValue(false);
        readFileSync.mockReturnValue(JSON.stringify(mockConfig));
        const config = loadConfig();
        expect(config).toEqual(mockConfig);
        expect(readFileSync).toHaveBeenCalled();
    });
    it('should load environment variables when .env file exists', () => {
        const mockConfig = {
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
        existsSync.mockReturnValue(true);
        readFileSync.mockReturnValue(JSON.stringify(mockConfig));
        dotenv.config.mockReturnValue({});
        loadConfig();
        expect(dotenv.config).toHaveBeenCalled();
    });
    it('should throw error when config file is invalid', () => {
        existsSync.mockReturnValue(false);
        readFileSync.mockImplementation(() => {
            throw new Error('File not found');
        });
        expect(() => loadConfig()).toThrow('Failed to load configuration');
    });
});
