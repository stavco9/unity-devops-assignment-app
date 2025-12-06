import { RestService } from '../../src/service/RestService.js';
// Mock global fetch
global.fetch = jest.fn();
describe('RestService', () => {
    let service;
    beforeEach(() => {
        service = new RestService();
        jest.clearAllMocks();
    });
    it('should create RestService instance', () => {
        expect(service).toBeInstanceOf(RestService);
    });
    it('should make GET request successfully', async () => {
        const mockResponse = { status: 200, json: jest.fn().mockResolvedValue({ data: 'test' }) };
        global.fetch.mockResolvedValue(mockResponse);
        const [status, result] = await service.getRequest('http://localhost:3001', 'getAllUserBuys', {
            username: 'testuser',
        });
        expect(global.fetch).toHaveBeenCalledWith('http://localhost:3001/getAllUserBuys?username=testuser', expect.objectContaining({
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        }));
        expect(status).toBe(200);
        expect(result).toEqual({ data: 'test' });
    });
    it('should handle request errors', async () => {
        global.fetch.mockRejectedValue(new Error('Network error'));
        await expect(service.getRequest('http://localhost:3001', 'getAllUserBuys', { username: 'testuser' })).rejects.toThrow('Failed to fetch user buys');
    });
    it('should handle empty query params', async () => {
        const mockResponse = { status: 200, json: jest.fn().mockResolvedValue({}) };
        global.fetch.mockResolvedValue(mockResponse);
        await service.getRequest('http://localhost:3001', 'getAllUserBuys', {});
        expect(global.fetch).toHaveBeenCalledWith('http://localhost:3001/getAllUserBuys', expect.any(Object));
    });
});
