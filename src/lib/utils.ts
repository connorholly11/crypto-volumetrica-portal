import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Format currency with proper symbol and decimals
// Accepts string or number to maintain decimal precision
export function formatCurrency(amount: string | number, currency: 'USD' | 'EUR' = 'USD'): string {
  // Convert string to number for formatting, but use parseFloat carefully
  // For production, consider using a decimal library like decimal.js
  const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  // Check for invalid numbers
  if (isNaN(numericAmount)) {
    return currency === 'USD' ? '$0.00' : '€0.00';
  }
  
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return formatter.format(numericAmount);
}

// Format percentage with sign
export function formatPercentage(value: number, decimals: number = 2): string {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(decimals)}%`;
}

// Format large numbers with K, M, B suffixes
export function formatLargeNumber(num: number): string {
  if (Math.abs(num) >= 1e9) {
    return (num / 1e9).toFixed(1) + 'B';
  }
  if (Math.abs(num) >= 1e6) {
    return (num / 1e6).toFixed(1) + 'M';
  }
  if (Math.abs(num) >= 1e3) {
    return (num / 1e3).toFixed(1) + 'K';
  }
  return num.toFixed(0);
}

// Get status color classes
export function getStatusColor(status: string): string {
  const statusColors: Record<string, string> = {
    enabled: 'text-green-600 bg-green-50',
    active: 'text-green-600 bg-green-50',
    success: 'text-green-600 bg-green-50',
    challengesuccess: 'text-green-600 bg-green-50',
    disabled: 'text-red-600 bg-red-50',
    failed: 'text-red-600 bg-red-50',
    challengefailed: 'text-red-600 bg-red-50',
    initialized: 'text-gray-600 bg-gray-50',
    pending: 'text-yellow-600 bg-yellow-50',
  };
  
  return statusColors[status.toLowerCase()] || 'text-gray-600 bg-gray-50';
}

// Get P&L color classes
export function getPnLColor(value: number): string {
  if (value > 0) return 'text-green-600';
  if (value < 0) return 'text-red-600';
  return 'text-gray-600';
}

// Calculate drawdown percentage
export function calculateDrawdownPercentage(currentBalance: number, initialBalance: number): number {
  if (initialBalance === 0) return 0;
  const drawdown = ((initialBalance - currentBalance) / initialBalance) * 100;
  return Math.max(0, drawdown);
}

// Format date for display
export function formatDate(date: string | Date, format: 'short' | 'long' = 'short'): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  
  if (format === 'short') {
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }
  
  return d.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// Debounce function for search inputs
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}
