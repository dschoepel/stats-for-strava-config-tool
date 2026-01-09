/* eslint-env node */
import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { getDefaultGearMaintenancePath } from '../config/defaults.js';

// Configure runtime to use Node.js
export const runtime = 'nodejs';

/**
 * Resolve the gear maintenance images directory path
 */
function resolveGearMaintenancePath(customPath) {
  let basePath = customPath || getDefaultGearMaintenancePath();

  // Expand ~ to home directory
  if (basePath.startsWith('~/') || basePath.startsWith('~\\')) {
    basePath = path.join(os.homedir(), basePath.slice(2));
  }

  return basePath;
}

/**
 * GET - List all images in the gear maintenance directory
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const customPath = searchParams.get('path');
    const pathParam = customPath ? `?path=${encodeURIComponent(customPath)}` : '';

    const gearMaintenancePath = resolveGearMaintenancePath(customPath);

    // Ensure directory exists
    try {
      await fs.access(gearMaintenancePath);
    } catch {
      // Create directory if it doesn't exist
      await fs.mkdir(gearMaintenancePath, { recursive: true });
    }

    // Read directory contents
    const entries = await fs.readdir(gearMaintenancePath, { withFileTypes: true });
    
    // Filter for image files
    const imageExtensions = ['.png', '.jpg', '.jpeg', '.webp', '.gif', '.svg'];
    const images = [];

    for (const entry of entries) {
      if (entry.isFile()) {
        const ext = path.extname(entry.name).toLowerCase();
        if (imageExtensions.includes(ext)) {
          const filePath = path.join(gearMaintenancePath, entry.name);
          const stats = await fs.stat(filePath);
          
          images.push({
            name: entry.name,
            size: stats.size,
            lastModified: stats.mtime,
            url: `/api/gear-maintenance-images/${encodeURIComponent(entry.name)}${pathParam}`
          });
        }
      }
    }

    // Sort by name
    images.sort((a, b) => a.name.localeCompare(b.name));

    return NextResponse.json({
      success: true,
      images,
      directory: gearMaintenancePath,
      count: images.length
    });

  } catch (error) {
    console.error('Error listing gear maintenance images:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      images: []
    }, { status: 500 });
  }
}

/**
 * POST - Upload a new image to the gear maintenance directory
 */
export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');
    const customPath = formData.get('path');

    console.log('Upload request received:', { 
      fileName: file?.name, 
      fileSize: file?.size, 
      fileType: file?.type,
      customPath 
    });

    if (!file) {
      return NextResponse.json({
        success: false,
        error: 'No file provided'
      }, { status: 400 });
    }

    // Validate file type
    const validTypes = ['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/svg+xml'];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid file type. Only PNG, JPG, WEBP, GIF, and SVG are allowed.'
      }, { status: 400 });
    }

    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json({
        success: false,
        error: 'File too large. Maximum size is 10MB.'
      }, { status: 400 });
    }

    const gearMaintenancePath = resolveGearMaintenancePath(customPath);
    console.log('Resolved gear maintenance path:', gearMaintenancePath);

    // Ensure directory exists
    try {
      await fs.mkdir(gearMaintenancePath, { recursive: true });
      console.log('Directory ensured:', gearMaintenancePath);
    } catch (mkdirError) {
      console.error('Failed to create directory:', mkdirError);
      return NextResponse.json({
        success: false,
        error: `Failed to create directory: ${mkdirError.message}`
      }, { status: 500 });
    }

    // Sanitize filename
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const filePath = path.join(gearMaintenancePath, sanitizedName);
    console.log('Target file path:', filePath);

    // Check if file already exists
    try {
      await fs.access(filePath);
      console.log('File already exists:', filePath);
      return NextResponse.json({
        success: false,
        error: `File '${sanitizedName}' already exists. Please rename or delete the existing file first.`
      }, { status: 409 });
    } catch {
      // File doesn't exist, proceed
    }

    // Write file
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await fs.writeFile(filePath, buffer);

    console.log('✅ Image uploaded successfully:', filePath);

    return NextResponse.json({
      success: true,
      message: 'Image uploaded successfully',
      filename: sanitizedName,
      url: `/api/gear-maintenance-images/${encodeURIComponent(sanitizedName)}`
    });

  } catch (error) {
    console.error('❌ Error uploading image:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

/**
 * DELETE - Remove an image from the gear maintenance directory
 */
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const filename = searchParams.get('filename');
    const customPath = searchParams.get('path');

    if (!filename) {
      return NextResponse.json({
        success: false,
        error: 'Filename is required'
      }, { status: 400 });
    }

    const gearMaintenancePath = resolveGearMaintenancePath(customPath);
    const filePath = path.join(gearMaintenancePath, filename);

    // Check if file exists
    try {
      await fs.access(filePath);
    } catch {
      return NextResponse.json({
        success: false,
        error: 'File not found'
      }, { status: 404 });
    }

    // Delete file
    await fs.unlink(filePath);

    console.log('Image deleted:', filePath);

    return NextResponse.json({
      success: true,
      message: 'Image deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting image:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
