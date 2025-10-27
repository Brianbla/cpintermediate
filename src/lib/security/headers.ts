/**
 * Security Headers Configuration
 * Based on OWASP Top 10 2021 - A05:2021 Security Misconfiguration
 */

/**
 * Content Security Policy (CSP)
 * Prevents XSS, clickjacking, and other code injection attacks
 */
export const contentSecurityPolicy = {
  'default-src': ["'self'"],
  'script-src': [
    "'self'",
    "'unsafe-eval'", // Required for Next.js development
    "'unsafe-inline'", // Required for Next.js
  ],
  'style-src': [
    "'self'",
    "'unsafe-inline'", // Required for styled-components and CSS-in-JS
  ],
  'img-src': [
    "'self'",
    'data:', // Allow data URLs for images
    'blob:', // Allow blob URLs for uploaded images
  ],
  'font-src': ["'self'", 'data:'],
  'connect-src': ["'self'"],
  'frame-ancestors': ["'none'"], // Prevent clickjacking
  'base-uri': ["'self'"],
  'form-action': ["'self'"],
  'object-src': ["'none'"],
  'upgrade-insecure-requests': [],
};

/**
 * Generate CSP header value from policy object
 */
export function generateCspHeader(): string {
  return Object.entries(contentSecurityPolicy)
    .map(([key, values]) => {
      if (values.length === 0) {
        return key;
      }
      return `${key} ${values.join(' ')}`;
    })
    .join('; ');
}

/**
 * Security headers to be applied to all responses
 * Based on OWASP Secure Headers Project
 */
export const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: generateCspHeader(),
  },
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on',
  },
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
];
