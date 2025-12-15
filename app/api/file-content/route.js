import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const filePath = searchParams.get('path');

    if (!filePath) {
      return NextResponse.json({
        success: false,
        error: 'File path is required'
      }, { status: 400 });
    }

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
    const { path: filePath, content } = body;

    if (!filePath || content === undefined) {
      return NextResponse.json({
        success: false,
        error: 'File path and content are required'
      }, { status: 400 });
    }

    // Write file content
    await fs.writeFile(filePath, content, 'utf8');

    return NextResponse.json({
      success: true,
      path: filePath,
      message: 'File saved successfully'
    });

  } catch (error) {
    console.error('File write API error:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}