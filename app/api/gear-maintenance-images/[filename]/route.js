/* eslint-env node */
import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { getDefaultGearMaintenancePath } from '../../config/defaults.js';

// Configure runtime to use Node.js
export const runtime = 'nodejs';

/**
 * GET - Serve an image file from the gear maintenance directory
 */
export async function GET(request, { params }) {
  try {
    const { filename } = await params;
    const { searchParams } = new URL(request.url);
    const customPath = searchParams.get('path');

    let basePath = customPath || getDefaultGearMaintenancePath();

    // Expand ~ to home directory
    if (basePath.startsWith('~/') || basePath.startsWith('~\\')) {
      basePath = path.join(os.homedir(), basePath.slice(2));
    }

    const filePath = path.join(basePath, filename);

    // Security check: ensure file is within gear maintenance directory
    const resolvedPath = path.resolve(filePath);
    const resolvedBase = path.resolve(basePath);
    if (!resolvedPath.startsWith(resolvedBase)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid file path'
      }, { status: 403 });
    }

    // Check if file exists
    try {
      await fs.access(filePath);
    } catch (accessError) {
      console.error('File not found:', filePath, accessError.message);
      return NextResponse.json({
        success: false,
        error: 'File not found'
      }, { status: 404 });
    }

    // Read file
    const fileBuffer = await fs.readFile(filePath);
    
    // Determine content type
    const ext = path.extname(filename).toLowerCase();
    const contentTypeMap = {
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.webp': 'image/webp',
      '.gif': 'image/gif',
      '.svg': 'image/svg+xml'
    };
    const contentType = contentTypeMap[ext] || 'application/octet-stream';

    // Return image
    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable'
      }
    });

  } catch (error) {
    console.error('Error serving image:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
