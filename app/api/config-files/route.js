/* eslint-env node */
import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

// Configure runtime to use Node.js
export const runtime = 'nodejs';

export async function GET(request) {
  console.log('GET /api/config-files called');
  try {
    // Get the directory from query params or use default
    const { searchParams } = new URL(request.url);
    const customDir = searchParams.get('directory');
    console.log('Custom directory:', customDir);
    
    let configPath;
    if (customDir) {
      configPath = customDir;
    } else {
      // Use environment variable or default
      const envPath = process.env.DEFAULT_STATS_CONFIG_PATH || '~/Documents/config/';
      console.log('Environment path:', envPath);
      
      // Replace ~ with actual home directory
      if (envPath.startsWith('~/')) {
        configPath = path.join(os.homedir(), envPath.slice(2));
      } else {
        configPath = envPath;
      }
      console.log('Final config path:', configPath);
    }

    // Check if directory exists
    try {
      await fs.access(configPath);
    } catch {
      return NextResponse.json({
        success: false,
        error: `Directory not accessible: ${configPath}`,
        directory: configPath
      }, { status: 404 });
    }

    // Read directory contents
    const entries = await fs.readdir(configPath, { withFileTypes: true });
    const configFiles = [];

    for (const entry of entries) {
      if (entry.isFile()) {
        const fileName = entry.name;
        // Check if file matches our criteria: config.yaml or config-*.yaml
        if (fileName === 'config.yaml' || (fileName.startsWith('config-') && fileName.endsWith('.yaml'))) {
          const filePath = path.join(configPath, fileName);
          const stats = await fs.stat(filePath);
          
          configFiles.push({
            name: fileName,
            path: filePath,
            size: stats.size,
            lastModified: stats.mtime,
            isMainConfig: fileName === 'config.yaml'
          });
        }
      }
    }

    // Sort with config.yaml first, then alphabetically
    configFiles.sort((a, b) => {
      if (a.name === 'config.yaml') return -1;
      if (b.name === 'config.yaml') return 1;
      return a.name.localeCompare(b.name);
    });

    return NextResponse.json({
      success: true,
      files: configFiles,
      directory: configPath,
      count: configFiles.length
    });

  } catch (error) {
    console.error('Config files API error:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      files: []
    }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { directory } = body;

    if (!directory) {
      return NextResponse.json({
        success: false,
        error: 'Directory path is required'
      }, { status: 400 });
    }

    // Validate directory exists
    try {
      const stats = await fs.stat(directory);
      if (!stats.isDirectory()) {
        return NextResponse.json({
          success: false,
          error: 'Path is not a directory'
        }, { status: 400 });
      }
    } catch {
      return NextResponse.json({
        success: false,
        error: `Directory not found: ${directory}`
      }, { status: 404 });
    }

    // Scan the specified directory (same logic as GET)
    const entries = await fs.readdir(directory, { withFileTypes: true });
    const configFiles = [];

    for (const entry of entries) {
      if (entry.isFile()) {
        const fileName = entry.name;
        if (fileName === 'config.yaml' || (fileName.startsWith('config-') && fileName.endsWith('.yaml'))) {
          const filePath = path.join(directory, fileName);
          const stats = await fs.stat(filePath);
          
          configFiles.push({
            name: fileName,
            path: filePath,
            size: stats.size,
            lastModified: stats.mtime,
            isMainConfig: fileName === 'config.yaml'
          });
        }
      }
    }

    configFiles.sort((a, b) => {
      if (a.name === 'config.yaml') return -1;
      if (b.name === 'config.yaml') return 1;
      return a.name.localeCompare(b.name);
    });

    return NextResponse.json({
      success: true,
      files: configFiles,
      directory: directory,
      count: configFiles.length
    });

  } catch (error) {
    console.error('Config files POST API error:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      files: []
    }, { status: 500 });
  }
}