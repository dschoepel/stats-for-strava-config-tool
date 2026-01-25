import { NextResponse } from 'next/server';

/**
 * DELETE - Clear command history from localStorage
 * Note: This endpoint returns instructions for client-side clearing
 * since localStorage is browser-only. Log files are NOT deleted.
 */
export async function DELETE() {
  // Since localStorage is client-side only, we just return success
  // The actual clearing happens in the client
  return NextResponse.json({ 
    success: true, 
    message: 'Command history cleared from browser storage' 
  });
}

/**
 * GET - Get information about history storage
 */
export async function GET() {
  return NextResponse.json({
    success: true,
    storageKey: 'strava-console-history',
    note: 'History is stored in browser localStorage. Log files are preserved.'
  });
}
