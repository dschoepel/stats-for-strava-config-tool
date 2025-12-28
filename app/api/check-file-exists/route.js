/* eslint-env node */
import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

// Configure runtime to use Node.js
export const runtime = 'nodejs';

export async function POST(request) {
  try {
    const { filePath } = await request.json();
    
    if (!filePath) {
      return NextResponse.json({
        success: false,
        error: 'File path is required'
      }, { status: 400 });
    }

    // Expand tilde to home directory
    const expandedPath = filePath.startsWith('~') 
      ? path.join(os.homedir(), filePath.slice(1))
      : filePath;

    try {
      await fs.access(expandedPath);
      // File exists
      return NextResponse.json({
        success: true,
        exists: true,
        filePath: expandedPath
      });
    } catch {
      // File doesn't exist
      return NextResponse.json({
        success: true,
        exists: false,
        filePath: expandedPath
      });
    }

  } catch (error) {
    console.error('Check file exists API error:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
