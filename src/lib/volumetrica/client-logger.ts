// Simple logger for Volumetrica API debugging
export const logger = {
  info: (message: string, data?: any) => {
    console.log(`[Volumetrica] ${message}`, data || '');
  },
  
  error: (message: string, error?: any) => {
    console.error(`[Volumetrica Error] ${message}`, error || '');
  },
  
  request: (method: string, endpoint: string, data?: any) => {
    console.log(`[Volumetrica Request] ${method} ${endpoint}`, data ? JSON.stringify(data, null, 2) : '');
  },
  
  response: (endpoint: string, status: number, data?: any) => {
    console.log(`[Volumetrica Response] ${endpoint} - Status: ${status}`, data ? JSON.stringify(data, null, 2) : '');
  }
};