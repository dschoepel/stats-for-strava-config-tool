import { NextResponse } from 'next/server';
import { getDefaultConfigPath } from '../config/defaults.js';

/**
 * API endpoint to expose runtime environment variables to the client
 * This allows Docker containers to configure the app via environment variables
 * without requiring a rebuild
 */
export async function GET() {
  try {
    // Read environment variables at runtime (server-side)
    const config = {
      defaultPath: getDefaultConfigPath(),
    };

    return NextResponse.json({
      success: true,
      config
    });
  } catch (error) {
    console.error('Error reading runtime config:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      config: {
        defaultPath: getDefaultConfigPath()
      }
    }, { status: 500 });
  }
}
