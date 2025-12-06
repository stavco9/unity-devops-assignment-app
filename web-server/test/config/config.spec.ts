import { readFileSync } from 'fs';
import { loadConfig } from '../../src/config/config.js';

jest.mock('fs');
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
      managementApi: {
        baseUrl: 'http://localhost:3001',
      },
    };

    (readFileSync as jest.Mock).mockReturnValue(JSON.stringify(mockConfig));

    const config = loadConfig();

    expect(config).toEqual(mockConfig);
    expect(readFileSync).toHaveBeenCalled();
  });

  it('should throw error when config file is invalid', () => {
    (readFileSync as jest.Mock).mockImplementation(() => {
      throw new Error('File not found');
    });

    expect(() => loadConfig()).toThrow('Failed to load configuration');
  });
});

