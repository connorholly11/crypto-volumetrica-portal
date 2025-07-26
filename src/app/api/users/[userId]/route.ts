import { NextRequest, NextResponse } from 'next/server';
import { volumetricaApi } from '@/lib/volumetrica/client';
import { VolumetricaError } from '@/lib/volumetrica/client';
import { z } from 'zod';
import type { User } from '@/types/volumetrica';

// Validation schema for userId parameter
const userIdSchema = z.string().uuid('Invalid user ID format');

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    // Validate the userId parameter
    const userId = userIdSchema.parse(params.userId);
    
    // Call Volumetrica API to get user details
    const user = await volumetricaApi.users.get(userId) as User;
    
    // Return successful response
    return NextResponse.json({
      success: true,
      data: user,
      message: 'User retrieved successfully'
    }, { status: 200 });
    
  } catch (error) {
    // Handle validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        message: 'Invalid user ID format',
        errors: error.errors.map(e => ({
          field: 'userId',
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
          message: `User with ID ${params.userId} not found`
        }, { status: 404 });
      }
      
      return NextResponse.json({
        success: false,
        message: error.message,
        details: error.details
      }, { status: error.statusCode || 500 });
    }
    
    // Handle unexpected errors
    console.error('Unexpected error fetching user:', error);
    return NextResponse.json({
      success: false,
      message: 'An unexpected error occurred while fetching the user'
    }, { status: 500 });
  }
}