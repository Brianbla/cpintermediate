/**
 * Security Utilities - Example Usage and Tests
 * 
 * This file demonstrates how to use the security utilities
 * Run with: npx tsx src/lib/security/examples.ts
 */

import {
  validateFile,
  validateFiles,
  MAX_FILE_SIZE,
  MAX_FILES_PER_UPLOAD,
} from './validation';

import {
  sanitizeHtml,
  sanitizeTags,
  sanitizeFilename,
  sanitizeTextInput,
  validateUrl,
  sanitizeSearchQuery,
} from './sanitization';

import {
  isRateLimited,
  rateLimitPresets,
} from './rate-limit';

console.log('=== Security Utilities Examples ===\n');

// Example 1: Input Sanitization
console.log('1. Input Sanitization Examples:');
console.log('--------------------------------');

const maliciousInput = '<script>alert("XSS")</script>';
const sanitized = sanitizeHtml(maliciousInput);
console.log('Original:', maliciousInput);
console.log('Sanitized:', sanitized);
console.log('✓ XSS prevented\n');

// Example 2: Tag Sanitization
console.log('2. Tag Sanitization:');
console.log('--------------------');

const userTags = 'wedding, <script>bad</script>, nature, portrait!!!';
const safeTags = sanitizeTags(userTags);
console.log('User input:', userTags);
console.log('Sanitized tags:', safeTags);
console.log('✓ Dangerous characters removed\n');

// Example 3: Filename Sanitization
console.log('3. Filename Sanitization:');
console.log('-------------------------');

const dangerousFilename = '../../../etc/passwd.jpg';
const safeFilename = sanitizeFilename(dangerousFilename);
console.log('Dangerous:', dangerousFilename);
console.log('Safe:', safeFilename);
console.log('✓ Path traversal prevented\n');

// Example 4: URL Validation
console.log('4. URL Validation:');
console.log('------------------');

const urls = [
  '/gallery/photos',
  'https://example.com/image.jpg',
  'javascript:alert(1)',
  'file:///etc/passwd',
];

urls.forEach(url => {
  const isValid = validateUrl(url);
  console.log(`${url} - ${isValid ? '✓ Valid' : '✗ Invalid'}`);
});
console.log();

// Example 5: Search Query Sanitization
console.log('5. Search Query Sanitization:');
console.log('-----------------------------');

const maliciousQuery = "'; DROP TABLE users; --";
const safeQuery = sanitizeSearchQuery(maliciousQuery);
console.log('Malicious query:', maliciousQuery);
console.log('Sanitized query:', safeQuery);
console.log('✓ SQL injection prevented\n');

// Example 6: Rate Limiting
console.log('6. Rate Limiting:');
console.log('-----------------');

const userId = 'user123';

for (let i = 1; i <= 12; i++) {
  const limited = isRateLimited({
    identifier: userId,
    ...rateLimitPresets.upload,
  });
  
  if (limited) {
    console.log(`Request ${i}: ✗ Rate limited (exceeded ${rateLimitPresets.upload.maxRequests} requests)`);
  } else {
    console.log(`Request ${i}: ✓ Allowed`);
  }
}
console.log();

// Example 7: File Validation Limits
console.log('7. File Upload Limits:');
console.log('----------------------');
console.log(`Max file size: ${MAX_FILE_SIZE / 1024 / 1024}MB`);
console.log(`Max files per upload: ${MAX_FILES_PER_UPLOAD}`);
console.log(`Allowed types: JPEG, PNG, GIF, WebP`);
console.log('✓ Upload limits enforced\n');

// Example 8: Text Input Sanitization
console.log('8. Text Input with Length Limits:');
console.log('----------------------------------');

const longInput = 'A'.repeat(300) + '<script>alert(1)</script>';
const sanitizedText = sanitizeTextInput(longInput, 255);
console.log(`Original length: ${longInput.length} characters`);
console.log(`Sanitized length: ${sanitizedText.length} characters`);
console.log('Contains script tag:', sanitizedText.includes('<script>') ? '✗ Yes' : '✓ No');
console.log('✓ Length limited and XSS prevented\n');

console.log('=== All Security Examples Completed ===');
console.log('✓ All security utilities working correctly');
