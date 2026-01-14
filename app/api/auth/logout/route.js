// app/api/auth/logout/route.js
import { NextResponse } from 'next/server';
import { serializeClearCookie } from '../../../../src/utils/auth.js';

export async function POST() {
  try {
    const cookie = serializeClearCookie();

    const response = NextResponse.json({
      success: true,
      message: 'Logout successful'
    });

    response.headers.set('Set-Cookie', cookie);
    return response;

  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}
