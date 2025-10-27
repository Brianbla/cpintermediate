/**
 * Security Validation Utilities
 * Based on OWASP Top 10 2021 Guidelines
 */

// Allowed MIME types for image uploads
const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
] as const;

// Maximum file size: 10MB
export const MAX_FILE_SIZE = 10 * 1024 * 1024;

// Maximum number of files per upload
export const MAX_FILES_PER_UPLOAD = 10;

/**
 * Validates file type against allowed MIME types
 * Prevents malicious file uploads (OWASP A04:2021 - Insecure Design)
 */
export function validateFileType(file: File): boolean {
  return ALLOWED_IMAGE_TYPES.includes(file.type as typeof ALLOWED_IMAGE_TYPES[number]);
}

/**
 * Validates file size
 * Prevents DoS attacks through large file uploads (OWASP A05:2021 - Security Misconfiguration)
 */
export function validateFileSize(file: File): boolean {
  return file.size > 0 && file.size <= MAX_FILE_SIZE;
}

/**
 * Validates file extension matches MIME type
 * Prevents MIME type spoofing attacks
 */
export function validateFileExtension(file: File): boolean {
  const extension = file.name.split('.').pop()?.toLowerCase();
  const validExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
  
  if (!extension || !validExtensions.includes(extension)) {
    return false;
  }

  // Check if extension matches MIME type
  const typeMap: Record<string, string[]> = {
    'image/jpeg': ['jpg', 'jpeg'],
    'image/png': ['png'],
    'image/gif': ['gif'],
    'image/webp': ['webp'],
  };

  const expectedExtensions = typeMap[file.type];
  return expectedExtensions ? expectedExtensions.includes(extension) : false;
}

/**
 * Validates filename for path traversal attacks
 * Prevents directory traversal (OWASP A01:2021 - Broken Access Control)
 */
export function validateFilename(filename: string): boolean {
  // Reject filenames with path traversal patterns
  const dangerousPatterns = [
    /\.\./,  // Parent directory
    /\//,    // Directory separator
    /\\/,    // Windows separator
    /\0/,    // Null byte
    /[<>:"|?*]/,  // Invalid filename characters
  ];

  return !dangerousPatterns.some(pattern => pattern.test(filename));
}

/**
 * Comprehensive file validation
 * Combines all file validation checks
 */
export function validateFile(file: File): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!validateFileType(file)) {
    errors.push('Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.');
  }

  if (!validateFileSize(file)) {
    if (file.size === 0) {
      errors.push('File is empty.');
    } else {
      errors.push(`File size exceeds maximum limit of ${MAX_FILE_SIZE / 1024 / 1024}MB.`);
    }
  }

  if (!validateFileExtension(file)) {
    errors.push('File extension does not match file type.');
  }

  if (!validateFilename(file.name)) {
    errors.push('Invalid filename. Filename contains illegal characters.');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validates multiple files
 */
export function validateFiles(files: File[]): {
  valid: boolean;
  errors: string[];
  fileErrors: Map<string, string[]>;
} {
  const errors: string[] = [];
  const fileErrors = new Map<string, string[]>();

  if (files.length === 0) {
    errors.push('No files provided.');
  }

  if (files.length > MAX_FILES_PER_UPLOAD) {
    errors.push(`Maximum ${MAX_FILES_PER_UPLOAD} files allowed per upload.`);
  }

  files.forEach((file) => {
    const result = validateFile(file);
    if (!result.valid) {
      fileErrors.set(file.name, result.errors);
    }
  });

  return {
    valid: errors.length === 0 && fileErrors.size === 0,
    errors,
    fileErrors,
  };
}
