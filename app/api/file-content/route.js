import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import os from 'os';
import path from 'path';

/**
 * Expand tilde (~) to home directory
 */
function expandTilde(filePath) {
  if (filePath.startsWith('~/') || filePath === '~') {
    return path.join(os.homedir(), filePath.slice(1));
  }
  return filePath;
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    let filePath = searchParams.get('path');

    if (!filePath) {
      return NextResponse.json({
        success: false,
        error: 'File path is required'
      }, { status: 400 });
    }

    // Expand tilde to home directory
    filePath = expandTilde(filePath);

    // Validate file exists and is readable
    try {
      const stats = await fs.stat(filePath);
      if (!stats.isFile()) {
        return NextResponse.json({
          success: false,
          error: 'Path is not a file'
        }, { status: 400 });
      }
    } catch (err) {
      return NextResponse.json({
        success: false,
        error: `File not found: ${filePath}`
      }, { status: 404 });
    }

    // Read file content
    const content = await fs.readFile(filePath, 'utf8');

    return NextResponse.json({
      success: true,
      content: content,
      path: filePath
    });

  } catch (error) {
    console.error('File content API error:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      content: null
    }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    let { path: filePath, content } = body;

    console.log('file-content POST request:', { filePath, hasContent: content !== undefined });

    if (!filePath) {
      return NextResponse.json({
        success: false,
        error: 'File path is required'
      }, { status: 400 });
    }

    // If content is provided, it's a write operation
    if (content !== undefined) {
      // Expand tilde to home directory
      filePath = expandTilde(filePath);

      // Ensure directory exists
      const dirPath = path.dirname(filePath);
      try {
        await fs.mkdir(dirPath, { recursive: true });
      } catch (mkdirErr) {
        // Directory might already exist, continue
      }

      // Write file content
      await fs.writeFile(filePath, content, 'utf8');

      return NextResponse.json({
        success: true,
        path: filePath,
        message: 'File saved successfully'
      });
    }

    // Otherwise, it's a read operation
    // Expand tilde to home directory
    filePath = expandTilde(filePath);

    // Validate file exists and is readable
    try {
      const stats = await fs.stat(filePath);
      if (!stats.isFile()) {
        return NextResponse.json({
          success: false,
          error: 'Path is not a file'
        }, { status: 400 });
      }
    } catch (err) {
      return NextResponse.json({
        success: false,
        error: `File not found: ${filePath}`
      }, { status: 404 });
    }

    // Read file content
    const fileContent = await fs.readFile(filePath, 'utf8');
    const stats = await fs.stat(filePath);

    return NextResponse.json({
      success: true,
      content: fileContent,
      path: filePath,
      size: stats.size,
      lastModified: stats.mtime.toISOString()
    });

  } catch (error) {
    console.error('File content POST API error:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}