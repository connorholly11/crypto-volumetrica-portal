import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getVolumetricaClient } from '@/lib/volumetrica/client';
import { VolumetricaError } from '@/lib/volumetrica/client';
import type { DisableAccountRequest } from '@/types/volumetrica';

// Validation schema for disable request body
const DisableAccountSchema = z.object({
  reason: z.string().min(1, 'Reason is required').max(500, 'Reason must be less than 500 characters'),
  forceClose: z.boolean().default(false),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ accountId: string }> }
) {
  try {
    // Get accountId from params
    const { accountId } = await params;
    
    // Validate accountId
    if (!accountId || typeof accountId !== 'string') {
      return NextResponse.json({
        success: false,
        message: 'Invalid account ID'
      }, { status: 400 });
    }
    
    // Parse and validate request body
    const body = await request.json();
    const validatedData = DisableAccountSchema.parse(body);
    
    // Create disable request
    const disableRequest: DisableAccountRequest = {
      accountId: accountId,
      reason: validatedData.reason,
      forceClose: validatedData.forceClose
    };
    
    // Disable the account using the Volumetrica client
    const client = getVolumetricaClient();
    await client.post('/tradingAccount/Disable', disableRequest);
    
    // Return success response
    return NextResponse.json({
      success: true,
      data: {
        accountId: accountId,
        status: 'disabled',
        reason: validatedData.reason,
        forceClose: validatedData.forceClose,
        disabledAt: new Date().toISOString()
      },
      message: validatedData.forceClose 
        ? 'Account disabled and all positions force closed successfully' 
        : 'Account disabled successfully'
    }, { status: 200 });
    
  } catch (error) {
    // Handle validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        message: 'Validation error',
        details: error.errors.map(e => `${e.path.join('.')}: ${e.message}`)
      }, { status: 400 });
    }
    
    // Handle Volumetrica API errors
    if (error instanceof VolumetricaError) {
      // Handle specific errors
      if (error.statusCode === 404) {
        return NextResponse.json({
          success: false,
          message: 'Account not found'
        }, { status: 404 });
      }
      
      if (error.statusCode === 400) {
        return NextResponse.json({
          success: false,
          message: 'Account cannot be disabled in its current state',
          details: error.details
        }, { status: 400 });
      }
      
      if (error.statusCode === 409) {
        return NextResponse.json({
          success: false,
          message: 'Account has open positions that cannot be force closed',
          details: error.details
        }, { status: 409 });
      }
      
      return NextResponse.json({
        success: false,
        message: error.message,
        details: error.details
      }, { status: error.statusCode || 500 });
    }
    
    // Handle unexpected errors
    console.error('Unexpected error disabling account:', error);
    return NextResponse.json({
      success: false,
      message: 'An unexpected error occurred while disabling the account'
    }, { status: 500 });
  }
}