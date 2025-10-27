# Security Implementation Guide

## OWASP Top 10 2021 - Security Measures

This document outlines the security measures implemented in the Photo Gallery & Portfolio application based on the OWASP Top 10 2021 guidelines.

---

## A01:2021 – Broken Access Control

### Implementation

#### File Upload Access Control
- **Path Traversal Prevention**: Filenames are validated to prevent directory traversal attacks
- **Validation**: `validateFilename()` function blocks patterns like `../`, `./`, null bytes, and invalid characters

```typescript
// src/lib/security/validation.ts
export function validateFilename(filename: string): boolean {
  const dangerousPatterns = [
    /\.\./,  // Parent directory
    /\//,    // Directory separator
    /\\/,    // Windows separator
    /\0/,    // Null byte
    /[<>:"|?*]/,  // Invalid filename characters
  ];
  return !dangerousPatterns.some(pattern => pattern.test(filename));
}
```

### Recommendations
- Implement authentication and authorization for admin pages
- Add session management with secure cookies
- Implement role-based access control (RBAC) for different user types

---

## A02:2021 – Cryptographic Failures

### Current Implementation
- **HTTPS Enforcement**: Strict-Transport-Security header configured
- **Secure Headers**: Content security headers prevent protocol downgrade

### Recommendations
- Encrypt sensitive data at rest (user credentials, API keys)
- Use environment variables for secrets (never commit to repository)
- Implement proper key management for production environments
- Use secure random number generation for tokens and IDs

---

## A03:2021 – Injection

### Implementation

#### XSS Prevention
- **Input Sanitization**: All user inputs are sanitized before rendering
- **HTML Escaping**: `sanitizeHtml()` function escapes dangerous characters

```typescript
// src/lib/security/sanitization.ts
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
```

#### SQL Injection Prevention
- **Search Query Sanitization**: Removes SQL keywords and special characters
- **Prepared Statements**: Use parameterized queries when implementing database layer

### Recommendations
- Use ORM/query builders with parameterized queries
- Validate and sanitize all inputs on both client and server
- Use Content Security Policy to prevent script injection

---

## A04:2021 – Insecure Design

### Implementation

#### File Upload Security
- **MIME Type Validation**: Only allows specific image types
- **File Extension Validation**: Ensures extension matches MIME type
- **Size Limits**: Maximum 10MB per file to prevent DoS

```typescript
// src/lib/security/validation.ts
const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
] as const;

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
export const MAX_FILES_PER_UPLOAD = 10;
```

### Recommendations
- Implement virus scanning for uploaded files
- Store uploaded files outside web root
- Generate unique, unpredictable filenames
- Implement file content validation (magic byte checking)

---

## A05:2021 – Security Misconfiguration

### Implementation

#### Security Headers
All routes include comprehensive security headers:

```typescript
// next.config.ts
async headers() {
  return [
    {
      source: '/:path*',
      headers: [
        {
          key: 'Strict-Transport-Security',
          value: 'max-age=63072000; includeSubDomains; preload',
        },
        {
          key: 'X-Frame-Options',
          value: 'DENY',
        },
        {
          key: 'X-Content-Type-Options',
          value: 'nosniff',
        },
        {
          key: 'Referrer-Policy',
          value: 'strict-origin-when-cross-origin',
        },
        {
          key: 'Permissions-Policy',
          value: 'camera=(), microphone=(), geolocation=()',
        },
      ],
    },
  ];
}
```

#### Content Security Policy
Prevents XSS, clickjacking, and code injection:

```typescript
// src/lib/security/headers.ts
export const contentSecurityPolicy = {
  'default-src': ["'self'"],
  'script-src': ["'self'", "'unsafe-eval'", "'unsafe-inline'"],
  'style-src': ["'self'", "'unsafe-inline'"],
  'img-src': ["'self'", 'data:', 'blob:'],
  'frame-ancestors': ["'none'"],
  'object-src': ["'none'"],
  'upgrade-insecure-requests': [],
};
```

#### Rate Limiting
Prevents brute force and DoS attacks:

```typescript
// src/lib/security/rate-limit.ts
export const rateLimitPresets = {
  upload: {
    maxRequests: 10,
    windowMs: 15 * 60 * 1000, // 15 minutes
  },
  api: {
    maxRequests: 100,
    windowMs: 15 * 60 * 1000,
  },
};
```

### Recommendations
- Remove unnecessary features and services
- Keep dependencies up to date
- Implement security logging and monitoring
- Use environment-specific configurations

---

## A06:2021 – Vulnerable and Outdated Components

### Current State
- Using latest Next.js 15.4.4
- React 19.1.0
- All dependencies are current

### Recommendations
- Regularly run `npm audit` to check for vulnerabilities
- Keep dependencies updated with security patches
- Remove unused dependencies
- Monitor security advisories for used packages

```bash
# Check for vulnerabilities
npm audit

# Fix automatically where possible
npm audit fix

# Update dependencies
npm update
```

---

## A07:2021 – Identification and Authentication Failures

### Current Implementation
- Client-side validation for all user inputs
- Secure password input handling (when implemented)

### Recommendations
- Implement multi-factor authentication
- Use secure session management
- Implement account lockout after failed attempts
- Use strong password policies
- Implement secure password recovery
- Never store passwords in plain text (use bcrypt/argon2)

---

## A08:2021 – Software and Data Integrity Failures

### Implementation
- File integrity validation through MIME type and extension checking
- Input validation prevents data corruption

### Recommendations
- Implement subresource integrity (SRI) for external resources
- Use digital signatures for critical updates
- Verify uploaded files don't contain malicious content
- Implement checksum validation for file uploads

---

## A09:2021 – Security Logging and Monitoring Failures

### Recommendations
- Log all authentication attempts (success and failure)
- Log file upload attempts and validation failures
- Monitor for suspicious patterns
- Implement alerting for security events
- Regular security log review
- Protect logs from tampering

Example logging structure:
```typescript
interface SecurityLog {
  timestamp: Date;
  event: 'upload' | 'auth' | 'validation_error';
  userId?: string;
  ip: string;
  details: Record<string, any>;
  severity: 'low' | 'medium' | 'high' | 'critical';
}
```

---

## A10:2021 – Server-Side Request Forgery (SSRF)

### Implementation
- URL validation prevents open redirects
- Restricted URL protocols to http/https only

```typescript
// src/lib/security/sanitization.ts
export function validateUrl(url: string, allowedDomains?: string[]): boolean {
  try {
    if (url.startsWith('/') && !url.startsWith('//')) {
      return true; // Relative URLs are safe
    }
    
    const parsed = new URL(url);
    
    // Only allow http and https
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return false;
    }
    
    // Check against allowlist if provided
    if (allowedDomains) {
      return allowedDomains.some(domain => parsed.hostname === domain);
    }
    
    return true;
  } catch {
    return false;
  }
}
```

### Recommendations
- Implement URL allowlisting for external resources
- Validate and sanitize all user-supplied URLs
- Disable or restrict HTTP redirects
- Use network segmentation to isolate services

---

## Security Testing Checklist

### File Upload Security
- [x] MIME type validation
- [x] File size limits
- [x] File extension validation
- [x] Filename sanitization
- [x] Path traversal prevention
- [ ] Virus scanning
- [ ] Magic byte verification
- [ ] File content analysis

### Input Validation
- [x] HTML escaping
- [x] Tag sanitization
- [x] Text input length limits
- [x] URL validation
- [x] Email validation (structure)
- [ ] Server-side validation for all inputs

### Security Headers
- [x] HSTS (Strict-Transport-Security)
- [x] X-Frame-Options
- [x] X-Content-Type-Options
- [x] Referrer-Policy
- [x] Permissions-Policy
- [ ] Content-Security-Policy (needs CSP header in Next.js config)

### Rate Limiting
- [x] Rate limit utilities implemented
- [ ] API route rate limiting
- [ ] Upload rate limiting (needs API route)

---

## Production Deployment Security

### Environment Variables
```env
# Never commit these to repository!
DATABASE_URL=
JWT_SECRET=
API_KEY=
UPLOAD_SECRET=
```

### Security Headers in Production
Ensure all security headers are properly configured in production environment.

### HTTPS Configuration
- Enable HTTPS only
- Configure SSL/TLS certificates
- Enable HSTS preloading

### Monitoring
- Set up error tracking (e.g., Sentry)
- Configure security event logging
- Set up alerting for suspicious activities

---

## Quick Reference: Security Functions

### File Validation
```typescript
import { validateFile, validateFiles } from '@/lib/security/validation';

const result = validateFile(file);
if (!result.valid) {
  console.error(result.errors);
}
```

### Input Sanitization
```typescript
import { 
  sanitizeHtml, 
  sanitizeTags, 
  sanitizeTextInput 
} from '@/lib/security/sanitization';

const safeTags = sanitizeTags(userInput);
const safeText = sanitizeHtml(userInput);
```

### Rate Limiting
```typescript
import { isRateLimited, rateLimitPresets } from '@/lib/security/rate-limit';

const limited = isRateLimited({
  identifier: userIp,
  ...rateLimitPresets.upload,
});
```

---

## Resources

- [OWASP Top 10 2021](https://owasp.org/Top10/)
- [OWASP Cheat Sheet Series](https://cheatsheetseries.owasp.org/)
- [Next.js Security Best Practices](https://nextjs.org/docs/app/building-your-application/configuring/security-headers)
- [Content Security Policy Reference](https://content-security-policy.com/)
- [Security Headers Quick Reference](https://securityheaders.com/)
