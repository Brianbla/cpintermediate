/**
 * Input Sanitization Utilities
 * Based on OWASP Top 10 2021 - A03:2021 Injection
 */

/**
 * Sanitizes HTML input to prevent XSS attacks
 * Escapes dangerous characters that could execute scripts
 */
export function sanitizeHtml(input: string): string {
  const htmlEscapeMap: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
  };

  return input.replace(/[&<>"'/]/g, (char) => htmlEscapeMap[char] || char);
}

/**
 * Sanitizes user input for tags
 * Allows only alphanumeric, spaces, hyphens, and underscores
 */
export function sanitizeTags(input: string): string[] {
  return input
    .split(',')
    .map((tag) => tag.trim())
    .filter((tag) => tag.length > 0)
    .map((tag) => tag.replace(/[^a-zA-Z0-9\s\-_]/g, ''))
    .filter((tag) => tag.length > 0)
    .slice(0, 20); // Limit to 20 tags
}

/**
 * Sanitizes filename to create safe storage names
 * Removes special characters and limits length
 */
export function sanitizeFilename(filename: string): string {
  const extension = filename.split('.').pop()?.toLowerCase() || '';
  const nameWithoutExt = filename.substring(0, filename.lastIndexOf('.')) || filename;
  
  // Remove special characters, keep only alphanumeric, hyphens, and underscores
  const sanitized = nameWithoutExt
    .replace(/[^a-zA-Z0-9\-_]/g, '_')
    .substring(0, 100); // Limit length
  
  return extension ? `${sanitized}.${extension}` : sanitized;
}

/**
 * Validates and sanitizes text input
 * Prevents injection attacks and limits length
 */
export function sanitizeTextInput(input: string, maxLength: number = 255): string {
  return sanitizeHtml(input.trim()).substring(0, maxLength);
}

/**
 * Validates URL to prevent open redirect vulnerabilities
 * Only allows relative URLs or same-origin URLs
 */
export function validateUrl(url: string, allowedDomains?: string[]): boolean {
  try {
    // Allow relative URLs
    if (url.startsWith('/') && !url.startsWith('//')) {
      return true;
    }

    const parsed = new URL(url);
    
    // Only allow http and https protocols
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return false;
    }

    // If allowed domains specified, check against them
    if (allowedDomains && allowedDomains.length > 0) {
      return allowedDomains.some(domain => parsed.hostname === domain);
    }

    return true;
  } catch {
    return false;
  }
}

/**
 * Sanitizes gallery/album names
 */
export function sanitizeGalleryName(name: string): string {
  return sanitizeTextInput(name, 100);
}

/**
 * Sanitizes copyright notice
 */
export function sanitizeCopyright(text: string): string {
  return sanitizeTextInput(text, 200);
}

/**
 * Validates email format
 * Basic validation to prevent injection
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email) && email.length <= 254;
}

/**
 * Sanitizes search query input
 * Prevents SQL injection and XSS in search
 */
export function sanitizeSearchQuery(query: string): string {
  // Remove SQL keywords and special characters
  const sanitized = query
    .replace(/['";\\]/g, '') // Remove quotes and backslashes
    .replace(/\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE)\b/gi, '')
    .trim();
  
  return sanitizeHtml(sanitized).substring(0, 100);
}
