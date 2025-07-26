import { NextRequest, NextResponse } from 'next/server';
import { getVolumetricaClient } from '@/lib/volumetrica/client';
import { VolumetricaError } from '@/lib/volumetrica/client';
import type { EnableAccountRequest } from '@/types/volumetrica';

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
    
    // Create enable request
    const enableRequest: EnableAccountRequest = {
      accountId: accountId
    };
    
    // Enable the account using the Volumetrica client
    const client = getVolumetricaClient();
    await client.post('/tradingAccount/Enable', enableRequest);
    
    // Return success response
    return NextResponse.json({
      success: true,
      data: {
        accountId: accountId,
        status: 'enabled'
      },
      message: 'Account enabled successfully'
    }, { status: 200 });
    
  } catch (error) {
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
          message: 'Account cannot be enabled in its current state',
          details: error.details
        }, { status: 400 });
      }
      
      return NextResponse.json({
        success: false,
        message: error.message,
        details: error.details
      }, { status: error.statusCode || 500 });
    }
    
    // Handle unexpected errors
    console.error('Unexpected error enabling account:', error);
    return NextResponse.json({
      success: false,
      message: 'An unexpected error occurred while enabling the account'
    }, { status: 500 });
  }
}