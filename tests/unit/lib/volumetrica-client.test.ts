import { VolumetricaClient, VolumetricaError } from '@/lib/volumetrica/client';
import axios from 'axios';

jest.mock('axios');

describe('VolumetricaClient', () => {
  let client: VolumetricaClient;
  const mockAxios = axios as jest.Mocked<typeof axios>;

  beforeEach(() => {
    jest.clearAllMocks();
    client = new VolumetricaClient({
      apiKey: 'test-api-key',
      baseURL: 'https://test-api.com',
    });
    
    // Mock axios.create to return a mock axios instance
    mockAxios.create = jest.fn().mockReturnValue({
      request: jest.fn(),
      get: jest.fn(),
      post: jest.fn(),
      put: jest.fn(),
      delete: jest.fn(),
      interceptors: {
        request: { use: jest.fn() },
        response: { use: jest.fn() },
      },
    });
  });

  describe('constructor', () => {
    it('should initialize with correct config', () => {
      const config = {
        apiKey: 'test-key',
        baseURL: 'https://api.test.com',
      };
      
      const newClient = new VolumetricaClient(config);
      
      expect(mockAxios.create).toHaveBeenCalledWith({
        baseURL: config.baseURL,
        headers: {
          'x-api-key': config.apiKey,
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      });
    });
  });

  describe('error handling', () => {
    it('should handle 401 errors', async () => {
      const mockClient = mockAxios.create();
      (mockClient.request as jest.Mock).mockRejectedValue({
        response: {
          status: 401,
          data: { message: 'Unauthorized' },
        },
      });

      await expect(client.get('/test')).rejects.toThrow(VolumetricaError);
    });

    it('should handle network errors', async () => {
      const mockClient = mockAxios.create();
      (mockClient.request as jest.Mock).mockRejectedValue({
        message: 'Network Error',
      });

      await expect(client.get('/test')).rejects.toThrow('Network Error');
    });
  });

  describe('response handling', () => {
    it('should extract data from successful response', async () => {
      const mockData = { userId: '123', name: 'Test User' };
      const mockClient = mockAxios.create();
      (mockClient.request as jest.Mock).mockResolvedValue({
        data: {
          success: true,
          data: mockData,
        },
      });

      const result = await client.get('/user/123');
      expect(result).toEqual(mockData);
    });

    it('should handle response without wrapper', async () => {
      const mockData = { userId: '123', name: 'Test User' };
      const mockClient = mockAxios.create();
      (mockClient.request as jest.Mock).mockResolvedValue({
        data: mockData,
      });

      // This should throw because it expects wrapped response
      await expect(client.get('/user/123')).rejects.toThrow('Unexpected response format');
    });
  });

  describe('retry logic', () => {
    it('should retry on temporary failures', async () => {
      const mockClient = mockAxios.create();
      const mockRequest = mockClient.request as jest.Mock;
      
      // First two calls fail, third succeeds
      mockRequest
        .mockRejectedValueOnce({ response: { status: 500 } })
        .mockRejectedValueOnce({ response: { status: 500 } })
        .mockResolvedValueOnce({
          data: { success: true, data: { id: '123' } },
        });

      const result = await client.get('/test');
      
      expect(result).toEqual({ id: '123' });
      expect(mockRequest).toHaveBeenCalledTimes(3);
    });

    it('should not retry on 4xx errors', async () => {
      const mockClient = mockAxios.create();
      (mockClient.request as jest.Mock).mockRejectedValue({
        response: { status: 400, data: { message: 'Bad Request' } },
      });

      await expect(client.get('/test')).rejects.toThrow(VolumetricaError);
      expect(mockClient.request).toHaveBeenCalledTimes(1);
    });
  });
});