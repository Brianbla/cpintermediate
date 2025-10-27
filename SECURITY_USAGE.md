# Security Implementation Usage Guide

This guide shows developers how to use the security utilities in their code.

## Table of Contents

1. [File Upload Security](#file-upload-security)
2. [Input Sanitization](#input-sanitization)
3. [Rate Limiting](#rate-limiting)
4. [Security Headers](#security-headers)
5. [Common Patterns](#common-patterns)

---

## File Upload Security

### Validating Single File

```typescript
import { validateFile } from '@/lib/security/validation';

function handleFileUpload(file: File) {
  const validation = validateFile(file);
  
  if (!validation.valid) {
    console.error('File validation failed:', validation.errors);
    // Show errors to user
    validation.errors.forEach(error => {
      showErrorMessage(error);
    });
    return;
  }
  
  // File is safe to upload
  uploadFile(file);
}
```

### Validating Multiple Files

```typescript
import { validateFiles } from '@/lib/security/validation';

function handleMultipleFiles(files: File[]) {
  const validation = validateFiles(files);
  
  if (!validation.valid) {
    // Show general errors
    validation.errors.forEach(error => {
      showErrorMessage(error);
    });
    
    // Show file-specific errors
    validation.fileErrors.forEach((errors, filename) => {
      console.error(`${filename}:`, errors);
    });
    return;
  }
  
  // All files are safe
  uploadFiles(files);
}
```

### File Upload Limits

```typescript
import { MAX_FILE_SIZE, MAX_FILES_PER_UPLOAD } from '@/lib/security/validation';

console.log(`Maximum file size: ${MAX_FILE_SIZE / 1024 / 1024}MB`);
console.log(`Maximum files per upload: ${MAX_FILES_PER_UPLOAD}`);
```

---

## Input Sanitization

### Preventing XSS in Text

```typescript
import { sanitizeHtml, sanitizeTextInput } from '@/lib/security/sanitization';

// Basic HTML escaping
const userComment = '<script>alert("XSS")</script>';
const safe = sanitizeHtml(userComment);
// Result: &lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;

// Text input with length limit
const userBio = 'User biography here...';
const safeBio = sanitizeTextInput(userBio, 500); // Max 500 chars
```

### Sanitizing Tags

```typescript
import { sanitizeTags } from '@/lib/security/sanitization';

const userInput = 'wedding, <script>malicious</script>, nature, portrait!!!';
const tags = sanitizeTags(userInput);
// Result: ['wedding', 'scriptmaliciousscript', 'nature', 'portrait']
// Script tags removed, only alphanumeric/spaces/hyphens/underscores remain
// Limited to 20 tags maximum
```

### Sanitizing Filenames

```typescript
import { sanitizeFilename } from '@/lib/security/sanitization';

const userFilename = '../../../etc/passwd.jpg';
const safeFilename = sanitizeFilename(userFilename);
// Result: '_________etc_passwd.jpg'
// Path traversal prevented, special chars replaced
```

### Gallery and Copyright Text

```typescript
import { 
  sanitizeGalleryName, 
  sanitizeCopyright 
} from '@/lib/security/sanitization';

const galleryName = sanitizeGalleryName(userInput); // Max 100 chars
const copyright = sanitizeCopyright(userInput);     // Max 200 chars
```

### URL Validation

```typescript
import { validateUrl } from '@/lib/security/sanitization';

// Basic validation
if (validateUrl(userUrl)) {
  // Safe to use
  redirect(userUrl);
}

// With domain allowlist
const allowedDomains = ['example.com', 'cdn.example.com'];
if (validateUrl(userUrl, allowedDomains)) {
  // URL is from allowed domain
  loadResource(userUrl);
}
```

### Search Query Sanitization

```typescript
import { sanitizeSearchQuery } from '@/lib/security/sanitization';

const searchTerm = sanitizeSearchQuery(userInput);
// Removes SQL keywords and dangerous characters
```

---

## Rate Limiting

### API Route Rate Limiting

```typescript
import { isRateLimited, rateLimitPresets } from '@/lib/security/rate-limit';

export async function POST(request: NextRequest) {
  // Get client identifier (IP address)
  const ip = request.headers.get('x-forwarded-for') || 
             request.headers.get('x-real-ip') || 
             'unknown';
  
  // Check rate limit
  const limited = isRateLimited({
    identifier: ip,
    ...rateLimitPresets.upload,
  });
  
  if (limited) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429 }
    );
  }
  
  // Process request
}
```

### Custom Rate Limits

```typescript
import { isRateLimited } from '@/lib/security/rate-limit';

// Custom configuration
const limited = isRateLimited({
  identifier: userId,
  maxRequests: 5,
  windowMs: 60 * 1000, // 1 minute
});
```

### Available Presets

```typescript
import { rateLimitPresets } from '@/lib/security/rate-limit';

// Strict for uploads: 10 requests per 15 minutes
rateLimitPresets.upload

// Standard for API: 100 requests per 15 minutes
rateLimitPresets.api

// Lenient for general: 1000 requests per 15 minutes
rateLimitPresets.general
```

---

## Security Headers

Security headers are automatically applied via `next.config.ts` and `middleware.ts`.

### Available Headers

- **Strict-Transport-Security**: Enforces HTTPS
- **X-Frame-Options**: Prevents clickjacking
- **X-Content-Type-Options**: Prevents MIME sniffing
- **Referrer-Policy**: Controls referrer information
- **Permissions-Policy**: Restricts browser features
- **Content-Security-Policy**: Prevents XSS and injection attacks

### Custom CSP Configuration

```typescript
// src/lib/security/headers.ts
import { contentSecurityPolicy, generateCspHeader } from '@/lib/security/headers';

// The CSP is automatically configured
const cspHeader = generateCspHeader();
```

---

## Common Patterns

### Secure Form Submission

```typescript
'use client';

import { useState } from 'react';
import { 
  sanitizeTags, 
  sanitizeTextInput,
  sanitizeCopyright 
} from '@/lib/security/sanitization';

export function PhotoUploadForm() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    // Sanitize all inputs
    const data = {
      title: sanitizeTextInput(title, 100),
      description: sanitizeTextInput(description, 500),
      tags: sanitizeTags(tags),
    };
    
    // Send sanitized data to API
    await fetch('/api/photos', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <input 
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        maxLength={100}
      />
      <textarea 
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        maxLength={500}
      />
      <input 
        value={tags}
        onChange={(e) => setTags(e.target.value)}
        placeholder="tag1, tag2, tag3"
      />
      <button type="submit">Upload</button>
    </form>
  );
}
```

### Secure API Route

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { isRateLimited, rateLimitPresets } from '@/lib/security/rate-limit';
import { sanitizeTextInput } from '@/lib/security/sanitization';

export async function POST(request: NextRequest) {
  // Rate limiting
  const ip = request.headers.get('x-forwarded-for') || 'unknown';
  if (isRateLimited({ identifier: ip, ...rateLimitPresets.api })) {
    return NextResponse.json(
      { error: 'Rate limit exceeded' },
      { status: 429 }
    );
  }
  
  // Parse and sanitize input
  const body = await request.json();
  const sanitizedData = {
    title: sanitizeTextInput(body.title, 100),
    description: sanitizeTextInput(body.description, 500),
  };
  
  // Process sanitized data
  // ...
  
  return NextResponse.json({ success: true });
}
```

### Secure File Upload Component

```typescript
'use client';

import { useCallback, useState } from 'react';
import { validateFiles } from '@/lib/security/validation';

export function SecureUpload() {
  const [errors, setErrors] = useState<string[]>([]);
  
  const handleFiles = useCallback(async (files: File[]) => {
    // Validate files
    const validation = validateFiles(files);
    
    if (!validation.valid) {
      setErrors(validation.errors);
      return;
    }
    
    // Upload validated files
    const formData = new FormData();
    files.forEach(file => formData.append('files', file));
    
    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      const error = await response.json();
      setErrors([error.error]);
    }
  }, []);
  
  return (
    <div>
      {errors.length > 0 && (
        <div className="error">
          {errors.map((error, i) => (
            <p key={i}>{error}</p>
          ))}
        </div>
      )}
      {/* Upload UI */}
    </div>
  );
}
```

---

## Testing Security

### Running Security Examples

```bash
# Run the security examples
npx tsx src/lib/security/examples.ts
```

### Checking Dependencies

```bash
# Check for vulnerabilities
npm audit

# Fix automatically
npm audit fix

# View detailed report
npm audit --json
```

### Linting

```bash
# Run ESLint
npm run lint

# Fix auto-fixable issues
npm run lint -- --fix
```

---

## Best Practices

1. **Always sanitize user input** before displaying or storing
2. **Validate on both client and server** - never trust client-side validation alone
3. **Use rate limiting** for all API endpoints
4. **Keep dependencies updated** to patch security vulnerabilities
5. **Use HTTPS in production** - never transmit sensitive data over HTTP
6. **Log security events** for monitoring and incident response
7. **Implement proper authentication** before deploying to production
8. **Review security headers** regularly to ensure they meet your needs
9. **Test with malicious input** to verify protections work
10. **Follow the principle of least privilege** in access control

---

## Additional Resources

- [SECURITY.md](./SECURITY.md) - Comprehensive security documentation
- [SECURITY_QUICKSTART.md](./SECURITY_QUICKSTART.md) - Quick reference guide
- [OWASP Top 10 2021](https://owasp.org/Top10/)
- [OWASP Cheat Sheet Series](https://cheatsheetseries.owasp.org/)
