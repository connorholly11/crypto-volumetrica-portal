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

    // Prepare parameters for the API call
    const params: PaginationRequest & { search?: string } = {
      page,
      pageSize,
      sortBy,
      sortDirection,
    };

    if (search) {
      params.search = search;
    }

    // Fetch trading rules from Volumetrica API
    const response = await client.get<PaginatedResponse<TradingRule>>('/tradingRule', { params });

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