// app/api/admin/check/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { isUserAdmin } from '@/lib/admin-utils';

export async function GET(request: NextRequest) {
  try {
    const isAdmin = await isUserAdmin();
    
    return NextResponse.json({ 
      isAdmin,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error in admin check API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}