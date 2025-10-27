/**
 * Secure File Upload API Route
 * Implements OWASP Top 10 2021 security best practices
 */

import { NextRequest, NextResponse } from 'next/server';
import { isRateLimited, rateLimitPresets } from '@/lib/security/rate-limit';
import { validateFile } from '@/lib/security/validation';
import { sanitizeFilename } from '@/lib/security/sanitization';

// Maximum request body size: 50MB (for multiple files)
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '50mb',
    },
  },
};

/**
 * POST /api/upload
 * Handles secure file uploads with comprehensive validation
 */
export async function POST(request: NextRequest) {
  try {
    // Get client IP for rate limiting
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               'unknown';

    // Check rate limit (OWASP A05:2021 - Security Misconfiguration)
    const rateLimited = isRateLimited({
      identifier: ip,
      ...rateLimitPresets.upload,
    });

    if (rateLimited) {
      return NextResponse.json(
        { 
          error: 'Too many upload requests. Please try again later.',
          code: 'RATE_LIMIT_EXCEEDED' 
        },
        { status: 429 }
      );
    }

    // Parse form data
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: 'No files provided', code: 'NO_FILES' },
        { status: 400 }
      );
    }

    // Validate all files (OWASP A04:2021 - Insecure Design)
    const validationResults = [];
    const validFiles = [];

    for (const file of files) {
      const validation = validateFile(file);
      
      if (!validation.valid) {
        validationResults.push({
          filename: file.name,
          valid: false,
          errors: validation.errors,
        });
      } else {
        validFiles.push(file);
        validationResults.push({
          filename: file.name,
          valid: true,
          errors: [],
        });
      }
    }

    // If no valid files, return error
    if (validFiles.length === 0) {
      return NextResponse.json(
        {
          error: 'No valid files to upload',
          code: 'VALIDATION_FAILED',
          details: validationResults,
        },
        { status: 400 }
      );
    }

    // Process valid files
    const uploadedFiles = [];

    for (const file of validFiles) {
      try {
        // Generate safe filename (OWASP A01:2021 - Broken Access Control)
        const timestamp = Date.now();
        const randomId = Math.random().toString(36).substring(2, 15);
        const sanitizedName = sanitizeFilename(file.name);
        const safeFilename = `${timestamp}_${randomId}_${sanitizedName}`;

        // In production, you would:
        // 1. Save file to secure storage (S3, Azure Blob, etc.)
        // 2. Scan file for viruses
        // 3. Process/optimize image
        // 4. Generate thumbnails
        // 5. Save metadata to database

        // For demo, we'll just return file info
        uploadedFiles.push({
          originalName: file.name,
          savedName: safeFilename,
          size: file.size,
          type: file.type,
          uploadedAt: new Date().toISOString(),
        });

        // Log successful upload (OWASP A09:2021 - Logging Failures)
        console.log(`File uploaded successfully: ${safeFilename} by ${ip}`);
      } catch (error) {
        console.error(`Error processing file ${file.name}:`, error);
        validationResults.push({
          filename: file.name,
          valid: false,
          errors: ['Failed to process file'],
        });
      }
    }

    return NextResponse.json(
      {
        success: true,
        message: `Successfully uploaded ${uploadedFiles.length} file(s)`,
        files: uploadedFiles,
        validationResults,
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Upload error:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal server error during file upload',
        code: 'INTERNAL_ERROR' 
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/upload
 * Returns upload configuration and limits
 */
export async function GET() {
  return NextResponse.json({
    maxFileSize: 10 * 1024 * 1024, // 10MB
    maxFiles: 10,
    allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
    allowedExtensions: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
  });
}
