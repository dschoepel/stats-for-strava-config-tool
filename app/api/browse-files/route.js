import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

/**
 * GET - Browse server file system
 * Returns folders and YAML files for a given directory
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    let dirPath = searchParams.get('path');
    
    // If no path provided, use home directory
    if (!dirPath) {
      dirPath = os.homedir();
    }
    
    // Expand tilde if present
    if (dirPath.startsWith('~/')) {
      dirPath = path.join(os.homedir(), dirPath.slice(2));
    }
    
    // Normalize path
    dirPath = path.resolve(dirPath);
    
    // Check if directory exists and is accessible
    try {
      const stats = await fs.stat(dirPath);
      if (!stats.isDirectory()) {
        return NextResponse.json({
          success: false,
          error: 'Path is not a directory'
        }, { status: 400 });
      }
    } catch (error) {
      return NextResponse.json({
        success: false,
        error: `Cannot access directory: ${error.message}`
      }, { status: 403 });
    }
    
    // Read directory contents
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    
    // Separate folders and YAML files
    const folders = [];
    const files = [];
    
    for (const entry of entries) {
      // Skip hidden files/folders (starting with .)
      if (entry.name.startsWith('.')) {
        continue;
      }
      
      const fullPath = path.join(dirPath, entry.name);
      
      try {
        const stats = await fs.stat(fullPath);
        
        if (entry.isDirectory()) {
          folders.push({
            name: entry.name,
            fullPath: fullPath,
            type: 'folder',
            isDirectory: true
          });
        } else if (entry.isFile()) {
          // Only include YAML files
          const ext = path.extname(entry.name).toLowerCase();
          if (ext === '.yaml' || ext === '.yml') {
            files.push({
              name: entry.name,
              fullPath: fullPath,
              type: 'file',
              size: stats.size,
              modified: stats.mtime,
              isDirectory: false
            });
          }
        }
      } catch (error) {
        // Skip files/folders we can't access
        console.warn(`Cannot access ${fullPath}:`, error.message);
      }
    }
    
    // Sort folders and files alphabetically
    folders.sort((a, b) => a.name.localeCompare(b.name));
    files.sort((a, b) => a.name.localeCompare(b.name));
    
    // Get parent directory
    const parentPath = path.dirname(dirPath);
    const canGoUp = dirPath !== path.parse(dirPath).root;
    
    return NextResponse.json({
      success: true,
      currentPath: dirPath,
      parentPath: canGoUp ? parentPath : null,
      folders,
      files,
      totalFolders: folders.length,
      totalFiles: files.length
    });
    
  } catch (error) {
    console.error('Error browsing files:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
