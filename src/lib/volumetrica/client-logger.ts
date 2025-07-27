// Simple logger for Volumetrica API debugging
// SECURITY: Never log sensitive data like API keys, passwords, or tokens

// List of sensitive fields to filter out
const SENSITIVE_FIELDS = ['password', 'apiKey', 'api_key', 'token', 'secret', 'authorization'];

// Helper to sanitize sensitive data from objects
function sanitizeData(data: any): any {
  if (!data || typeof data !== 'object') return data;
  
  // Clone to avoid mutating original
  const sanitized = Array.isArray(data) ? [...data] : { ...data };
  
  // Recursively sanitize object properties
  for (const key in sanitized) {
    if (SENSITIVE_FIELDS.some(field => key.toLowerCase().includes(field))) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
      sanitized[key] = sanitizeData(sanitized[key]);
    }
  }
  
  return sanitized;
}

export const logger = {
  info: (message: string, data?: any) => {
    console.log(`[Volumetrica] ${message}`, data ? sanitizeData(data) : '');
  },
  
  error: (message: string, error?: any) => {
    console.error(`[Volumetrica Error] ${message}`, error ? sanitizeData(error) : '');
  },
  
  request: (method: string, endpoint: string, data?: any) => {
    console.log(`[Volumetrica Request] ${method} ${endpoint}`, data ? JSON.stringify(sanitizeData(data), null, 2) : '');
  },
  
  response: (endpoint: string, status: number, data?: any) => {
    console.log(`[Volumetrica Response] ${endpoint} - Status: ${status}`, data ? JSON.stringify(sanitizeData(data), null, 2) : '');
  }
};