/* eslint-env node */
import { NextResponse } from 'next/server';
import os from 'os';
import path from 'path';

// Configure runtime to use Node.js
export const runtime = 'nodejs';

export async function POST(request) {
  try {
    const { path: inputPath } = await request.json();
    
    if (!inputPath) {
      return NextResponse.json({
        success: false,
        error: 'Path is required'
      }, { status: 400 });
    }

    let expandedPath = inputPath;
    
    // Expand tilde to home directory
    if (inputPath.startsWith('~/') || inputPath === '~') {
      expandedPath = path.join(os.homedir(), inputPath.slice(1));
    }

    // Normalize path separators for the platform
    expandedPath = path.normalize(expandedPath);

    return NextResponse.json({
      success: true,
      expandedPath: expandedPath,
      originalPath: inputPath
    });

  } catch (error) {
    console.error('Expand path API error:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
