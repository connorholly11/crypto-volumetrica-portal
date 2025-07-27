import { NextRequest, NextResponse } from 'next/server';
import { getVolumetricaClient } from '@/lib/volumetrica/client';
import type { TradingRule, VolumetricaResponse, PaginationRequest, PaginatedResponse } from '@/types/volumetrica';
import { z } from 'zod';

// Validation schema for query parameters
const querySchema = z.object({
  page: z.coerce.number().min(1).optional().default(1),
  pageSize: z.coerce.number().min(1).max(100).optional().default(20),
  sortBy: z.enum(['name', 'createdAt', 'id']).optional().default('name'),
  sortDirection: z.enum(['asc', 'desc']).optional().default('asc'),
  search: z.string().optional(),
});

export async function GET(request: NextRequest) {
  console.log('[Trading Rules List] Request received');
  
  try {
    const { searchParams } = new URL(request.url);
    
    // Parse and validate query parameters
    const queryResult = querySchema.safeParse({
      page: searchParams.get('page') || undefined,
      pageSize: searchParams.get('pageSize') || undefined,
      sortBy: searchParams.get('sortBy') || undefined,
      sortDirection: searchParams.get('sortDirection') || undefined,
      search: searchParams.get('search') || undefined,
    });

    if (!queryResult.success) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid query parameters',
          details: queryResult.error.errors.map(e => e.message),
        },
        { status: 400 }
      );
    }

    const { page, pageSize, sortBy, sortDirection, search } = queryResult.data;

    // Get the Volumetrica client
    const client = getVolumetricaClient();

    // Try different parameter combinations as Volumetrica might not support all
    let response;
    let tradingRules: TradingRule[] = [];
    
    try {
      // First try with no parameters (Volumetrica might not support pagination)
      console.log('[Trading Rules List] Trying without parameters');
      response = await client.get<any>('/tradingRule');
      console.log('[Trading Rules List] Response received:', response);
      
      // Handle different response formats
      if (Array.isArray(response)) {
        tradingRules = response;
      } else if (response.data && Array.isArray(response.data)) {
        tradingRules = response.data;
      } else if (response.items && Array.isArray(response.items)) {
        tradingRules = response.items;
      } else if (response.rules && Array.isArray(response.rules)) {
        tradingRules = response.rules;
      }
    } catch (error: any) {
      console.log('[Trading Rules List] Error:', error.statusCode, error.message);
      // If that fails, try with basic pagination
      if (error.statusCode === 400) {
        try {
          response = await client.get<any>('/tradingRule', { 
            params: { page: page, pageSize: pageSize } 
          });
          
          if (Array.isArray(response)) {
            tradingRules = response;
          } else if (response.data) {
            tradingRules = response.data;
          }
        } catch (secondError: any) {
          // If still failing, return empty list
          console.log('Trading rules API error:', secondError);
          tradingRules = [];
        }
      } else {
        throw error;
      }
    }
    
    // Apply client-side filtering if search is provided
    if (search && tradingRules.length > 0) {
      const searchLower = search.toLowerCase();
      tradingRules = tradingRules.filter(rule => 
        rule.name?.toLowerCase().includes(searchLower) ||
        rule.description?.toLowerCase().includes(searchLower)
      );
    }
    
    // Apply client-side sorting
    if (sortBy && tradingRules.length > 0) {
      tradingRules.sort((a, b) => {
        let aVal = a[sortBy as keyof TradingRule];
        let bVal = b[sortBy as keyof TradingRule];
        
        if (sortDirection === 'desc') {
          [aVal, bVal] = [bVal, aVal];
        }
        
        if (aVal < bVal) return -1;
        if (aVal > bVal) return 1;
        return 0;
      });
    }
    
    // Apply client-side pagination
    const totalCount = tradingRules.length;
    const totalPages = Math.ceil(totalCount / pageSize);
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedRules = tradingRules.slice(startIndex, endIndex);
    
    // Format response
    response = {
      items: paginatedRules,
      totalCount: totalCount,
      page: page,
      pageSize: pageSize,
      totalPages: totalPages
    };

    // Return the response
    return NextResponse.json({
      success: true,
      data: response,
    });
  } catch (error: any) {
    console.error('Error fetching trading rules:', error);

    // Check if it's a Volumetrica API error
    if (error.name === 'VolumetricaError') {
      return NextResponse.json(
        {
          success: false,
          message: error.message,
          details: error.details || [],
        },
        { status: error.statusCode || 500 }
      );
    }

    // Generic error response
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch trading rules',
        details: [error.message],
      },
      { status: 500 }
    );
  }
}