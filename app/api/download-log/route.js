import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export const runtime = 'nodejs';

// Directory for storing command logs (Docker volume mount)
const LOG_DIR = '/var/log/stats-cmd/command-logs';

/**
 * GET - Download or view a log file
 * Query params:
 *   - path: (required) Path to the log file (absolute path from helper)
 *   - view: (optional) If 'true', returns JSON with content instead of download
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const logPath = searchParams.get('path');
    const viewMode = searchParams.get('view') === 'true';

    if (!logPath) {
      return NextResponse.json({
        success: false,
        error: 'Log path is required'
      }, { status: 400 });
    }

    // Security: Validate path is within command logs directory
    const normalizedPath = path.normalize(logPath);
    const resolvedPath = path.resolve(normalizedPath);
    const resolvedLogDir = path.resolve(LOG_DIR);

    // Check if the path is within the log directory
    if (!resolvedPath.startsWith(resolvedLogDir)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid log path - access denied'
      }, { status: 403 });
    }

    // Check if file exists
    try {
      await fs.access(resolvedPath);
    } catch {
      return NextResponse.json({
        success: false,
        error: 'Log file not found'
      }, { status: 404 });
    }

    // Read the file
    const content = await fs.readFile(resolvedPath, 'utf8');
    const filename = path.basename(resolvedPath);

    // Return JSON with content if view mode, otherwise download
    if (viewMode) {
      return NextResponse.json({
        success: true,
        filename,
        content
      });
    }

    return new Response(content, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache'
      }
    });

  } catch (error) {
    console.error('Download log error:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

/**
 * DELETE - Delete a log file
 */
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const logPath = searchParams.get('path');

    if (!logPath) {
      return NextResponse.json({
        success: false,
        error: 'Log path is required'
      }, { status: 400 });
    }

    // Security: Validate path is within strava-sh-logs directory
    const resolvedPath = path.resolve(logPath);
    const resolvedLogDir = path.resolve(LOG_DIR);

    if (!resolvedPath.startsWith(resolvedLogDir)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid log path - access denied'
      }, { status: 403 });
    }

    // Delete the file
    await fs.unlink(resolvedPath);

    return NextResponse.json({
      success: true,
      message: 'Log file deleted'
    });

  } catch (error) {
    if (error.code === 'ENOENT') {
      return NextResponse.json({
        success: false,
        error: 'Log file not found'
      }, { status: 404 });
    }

    console.error('Delete log error:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
