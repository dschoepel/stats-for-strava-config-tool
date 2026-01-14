// app/api/auth/user/route.js
import { NextResponse } from 'next/server';
import { getAdminUsername } from '../../../../src/utils/auth.js';

// GET - Return current user info (protected by proxy.js)
export async function GET(request) {
  try {
    // If we reach here, proxy.js has already verified the session
    const username = getAdminUsername();
    
    return NextResponse.json({
      success: true,
      username
    });
  } catch (error) {
    console.error('Error fetching user info:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}
