import axios, { AxiosInstance, AxiosError, AxiosRequestConfig } from 'axios';
import type { VolumetricaResponse } from '@/types/volumetrica';
import { logger } from './client-logger';

// Custom error class for Volumetrica API errors
export class VolumetricaError extends Error {
  statusCode?: number;
  details?: string[];

  constructor(message: string, statusCode?: number, details?: string[]) {
    super(message);
    this.name = 'VolumetricaError';
    this.statusCode = statusCode;
    this.details = details;
  }
}

// Retry configuration
interface RetryConfig {
  maxRetries: number;
  initialDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  initialDelay: 1000, // 1 second
  maxDelay: 10000, // 10 seconds
  backoffMultiplier: 2,
};

// API Client Class
export class VolumetricaClient {
  private client: AxiosInstance;
  private retryConfig: RetryConfig;

  constructor(retryConfig: Partial<RetryConfig> = {}) {
    const baseURL = process.env.VOLUMETRICA_API_URL;
    const apiKey = process.env.VOLUMETRICA_API_KEY;

    if (!baseURL || !apiKey) {
      throw new Error('Missing Volumetrica API configuration. Please check environment variables.');
    }

    this.retryConfig = { ...DEFAULT_RETRY_CONFIG, ...retryConfig };

    this.client = axios.create({
      baseURL: `${baseURL}/api/v2/propsite`,
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
      },
      timeout: 30000, // 30 seconds
    });

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      this.handleError.bind(this)
    );
  }

  // Exponential backoff retry logic
  private async retryWithBackoff<T>(
    fn: () => Promise<T>,
    retryCount: number = 0
  ): Promise<T> {
    try {
      return await fn();
    } catch (error) {
      if (retryCount >= this.retryConfig.maxRetries) {
        throw error;
      }

      // Only retry on network errors or 5xx errors
      if (error instanceof VolumetricaError) {
        const statusCode = error.statusCode || 0;
        if (statusCode >= 400 && statusCode < 500) {
          // Don't retry client errors
          throw error;
        }
      }

      const delay = Math.min(
        this.retryConfig.initialDelay * Math.pow(this.retryConfig.backoffMultiplier, retryCount),
        this.retryConfig.maxDelay
      );

      await new Promise((resolve) => setTimeout(resolve, delay));
      return this.retryWithBackoff(fn, retryCount + 1);
    }
  }

  // Error handler
  private async handleError(error: AxiosError): Promise<never> {
    if (error.response) {
      const data = error.response.data as VolumetricaResponse<unknown>;
      
      // Handle Volumetrica API error response format
      if (!data.success && data.message) {
        throw new VolumetricaError(
          data.message,
          data.statusCode || error.response.status,
          data.details
        );
      }

      // Generic HTTP error
      throw new VolumetricaError(
        `API request failed with status ${error.response.status}`,
        error.response.status
      );
    } else if (error.request) {
      // Network error
      throw new VolumetricaError('Network error: Unable to reach Volumetrica API');
    } else {
      // Other errors
      throw new VolumetricaError(error.message || 'An unexpected error occurred');
    }
  }

  // Generic request method with retry logic
  private async request<T>(config: AxiosRequestConfig): Promise<T> {
    logger.request(config.method || 'GET', config.url || '', config.data);
    
    return this.retryWithBackoff(async () => {
      try {
        const response = await this.client.request<VolumetricaResponse<T>>(config);
        
        logger.response(config.url || '', response.status, response.data);
        
        // Handle successful response with wrapper
        if (response.data.success && response.data.data !== undefined) {
          return response.data.data;
        }

        // Handle successful response without data (e.g., DELETE requests)
        if (response.data.success) {
          return {} as T;
        }

        // This shouldn't happen if the API is consistent, but handle it just in case
        throw new VolumetricaError(
          response.data.message || 'Unexpected response format',
          response.data.statusCode
        );
      } catch (error) {
        logger.error(`Request failed: ${config.url}`, error);
        throw error;
      }
    });
  }

  // Public API methods
  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.request<T>({ ...config, method: 'GET', url });
  }

  async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return this.request<T>({ ...config, method: 'POST', url, data });
  }

  async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return this.request<T>({ ...config, method: 'PUT', url, data });
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.request<T>({ ...config, method: 'DELETE', url });
  }

  async patch<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return this.request<T>({ ...config, method: 'PATCH', url, data });
  }
}

// Singleton instance for use across the application
let clientInstance: VolumetricaClient | null = null;

export function getVolumetricaClient(): VolumetricaClient {
  if (!clientInstance) {
    clientInstance = new VolumetricaClient();
  }
  return clientInstance;
}

// Convenience functions for common API operations
export const volumetricaApi = {
  // User Management
  users: {
    create: (data: any) => getVolumetricaClient().post('/user', data),
    get: (userId: string) => getVolumetricaClient().get(`/user/${userId}`),
    loginUrl: (data: any) => getVolumetricaClient().post('/user/loginurl', data),
    invite: (data: any) => getVolumetricaClient().post('/user/invite', data),
  },

  // Trading Accounts
  accounts: {
    create: (data: any) => getVolumetricaClient().post('/tradingAccount', data),
    get: (accountId: string) => getVolumetricaClient().get(`/tradingAccount/${accountId}`),
    list: (params?: any) => getVolumetricaClient().get('/tradingAccount', { params }),
    enable: (data: any) => getVolumetricaClient().post('/tradingAccount/Enable', data),
    disable: (data: any) => getVolumetricaClient().post('/tradingAccount/Disable', data),
    changeStatus: (data: any) => getVolumetricaClient().post('/tradingAccount/ChangeStatus', data),
    changeTradingRule: (data: any) => getVolumetricaClient().post('/tradingAccount/changeTradingRule', data),
    delete: (accountId: string) => getVolumetricaClient().delete(`/tradingAccount/${accountId}`),
  },

  // Trading Rules
  tradingRules: {
    create: (data: any) => getVolumetricaClient().post('/tradingRule', data),
    get: (ruleId: string) => getVolumetricaClient().get(`/tradingRule/${ruleId}`),
    list: (params?: any) => getVolumetricaClient().get('/tradingRule', { params }),
    update: (data: any) => getVolumetricaClient().post('/tradingRule', data),
    validate: (data: any) => getVolumetricaClient().post('/tradingRule/validate', data),
    changeGroupUniverse: (data: any) => getVolumetricaClient().post('/tradingRule/changeGroupUniverse', data),
  },

  // Group Universe
  groupUniverse: {
    create: (data: any) => getVolumetricaClient().post('/groupUniverse', data),
    get: (universeId: string) => getVolumetricaClient().get(`/groupUniverse/${universeId}`),
    list: (params?: any) => getVolumetricaClient().get('/groupUniverse', { params }),
    update: (data: any) => getVolumetricaClient().put('/groupUniverse', data),
    delete: (universeId: string) => getVolumetricaClient().delete(`/groupUniverse/${universeId}`),
  },
};