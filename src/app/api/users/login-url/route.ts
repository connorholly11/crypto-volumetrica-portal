import { NextRequest, NextResponse } from 'next/server';
import { volumetricaApi } from '@/lib/volumetrica/client';
import { VolumetricaError } from '@/lib/volumetrica/client';
import { z } from 'zod';
import type { LoginUrlRequest, LoginUrlResponse } from '@/types/volumetrica';

// Validation schema for login URL request
const loginUrlSchema = z.object({
  userId: z.string().uuid('Invalid user ID format'),
});

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    
    // Validate input
    const validatedData = loginUrlSchema.parse(body);
    
    // Create the login URL request object
    const loginUrlRequest: LoginUrlRequest = {
      userId: validatedData.userId,
    };
    
    // Call Volumetrica API to generate login URL
    const result = await volumetricaApi.users.loginUrl(loginUrlRequest) as LoginUrlResponse;
    
    // Return successful response
    return NextResponse.json({
      success: true,
      data: result,
      message: 'One-time login URL generated successfully'
    }, { status: 200 });
    
  } catch (error) {
    // Handle validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        message: 'Validation error',
        errors: error.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message
        }))
      }, { status: 400 });
    }
    
    // Handle Volumetrica API errors
    if (error instanceof VolumetricaError) {
      // Check if it's a not found error
      if (error.statusCode === 404) {
        return NextResponse.json({
          success: false,
          message: 'User not found'
        }, { status: 404 });
      }
      
      // Check if it's an authorization error
      if (error.statusCode === 403) {
        return NextResponse.json({
          success: false,
          message: 'Not authorized to generate login URL for this user'
        }, { status: 403 });
      }
      
      return NextResponse.json({
        success: false,
        message: error.message,
        details: error.details
      }, { status: error.statusCode || 500 });
    }
    
    // Handle unexpected errors
    console.error('Unexpected error generating login URL:', error);
    return NextResponse.json({
      success: false,
      message: 'An unexpected error occurred while generating the login URL'
    }, { status: 500 });
  }
}