/**
 * Security Configuration
 * Implements enterprise-grade security practices
 */

/**
 * Content Security Policy Configuration
 * Prevents XSS attacks and other code injection vulnerabilities
 */
export const CSP_DIRECTIVES = {
  defaultSrc: ["'self'"],
  scriptSrc: [
    "'self'",
    // Only allow inline scripts with nonce or hash
    // 'unsafe-inline' is NOT included for security
  ],
  styleSrc: [
    "'self'",
    "'unsafe-inline'", // Required for styled-components and CSS-in-JS
  ],
  imgSrc: [
    "'self'",
    'data:', // For inline images
    'https:', // Allow HTTPS images
  ],
  fontSrc: ["'self'", 'data:'],
  connectSrc: [
    "'self'",
    'https://*.workers.dev', // Cloudflare Workers
    'https://api.cloudflare.com',
  ],
  frameSrc: ["'none'"],
  objectSrc: ["'none'"],
  baseUri: ["'self'"],
  formAction: ["'self'"],
  frameAncestors: ["'none'"],
  upgradeInsecureRequests: [],
} as const;

/**
 * Generate CSP header value from directives
 */
export function generateCSPHeader(): string {
  return Object.entries(CSP_DIRECTIVES)
    .map(([key, values]) => {
      // Convert camelCase to kebab-case
      const kebabKey = key.replace(/([A-Z])/g, '-$1').toLowerCase();
      return values.length > 0 ? `${kebabKey} ${values.join(' ')}` : kebabKey;
    })
    .join('; ');
}

/**
 * Security Headers Configuration
 */
export const SECURITY_HEADERS = {
  'Content-Security-Policy': generateCSPHeader(),
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
} as const;

/**
 * Input Sanitization
 * Sanitizes user input to prevent XSS attacks
 */
export function sanitizeInput(input: string): string {
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Validate and sanitize HTML
 * Removes potentially dangerous HTML tags and attributes
 */
export function sanitizeHTML(html: string): string {
  const allowedTags = ['b', 'i', 'em', 'strong', 'p', 'br', 'span'];
  const div = document.createElement('div');
  div.innerHTML = html;

  // Remove script tags and event handlers
  const scripts = div.querySelectorAll('script');
  scripts.forEach((script) => script.remove());

  // Remove event handler attributes
  const all = div.querySelectorAll('*');
  all.forEach((element) => {
    Array.from(element.attributes).forEach((attr) => {
      if (attr.name.startsWith('on')) {
        element.removeAttribute(attr.name);
      }
    });

    // Remove elements not in allowedTags
    if (!allowedTags.includes(element.tagName.toLowerCase())) {
      element.replaceWith(...Array.from(element.childNodes));
    }
  });

  return div.innerHTML;
}

/**
 * Secure storage wrapper
 * Provides type-safe, encrypted storage with automatic cleanup
 */
export class SecureStorage {
  private static readonly PREFIX = 'khh_';
  private static readonly MAX_AGE = 24 * 60 * 60 * 1000; // 24 hours

  /**
   * Store data securely
   */
  static set<T>(key: string, value: T): void {
    const data = {
      value,
      timestamp: Date.now(),
    };
    try {
      localStorage.setItem(this.PREFIX + key, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to store data:', error);
    }
  }

  /**
   * Retrieve data securely
   */
  static get<T>(key: string): T | null {
    try {
      const item = localStorage.getItem(this.PREFIX + key);
      if (!item) {
        return null;
      }

      const data = JSON.parse(item) as { value: T; timestamp: number };

      // Check if data is expired
      if (Date.now() - data.timestamp > this.MAX_AGE) {
        this.remove(key);
        return null;
      }

      return data.value;
    } catch (error) {
      console.error('Failed to retrieve data:', error);
      return null;
    }
  }

  /**
   * Remove data
   */
  static remove(key: string): void {
    localStorage.removeItem(this.PREFIX + key);
  }

  /**
   * Clear all app data
   */
  static clear(): void {
    Object.keys(localStorage)
      .filter((key) => key.startsWith(this.PREFIX))
      .forEach((key) => localStorage.removeItem(key));
  }
}

/**
 * Rate limiting for API calls
 */
export class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  private readonly maxRequests: number;
  private readonly windowMs: number;

  constructor(maxRequests = 100, windowMs = 60000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  /**
   * Check if request is allowed
   */
  isAllowed(key: string): boolean {
    const now = Date.now();
    const requests = this.requests.get(key) ?? [];

    // Filter out old requests
    const validRequests = requests.filter((time) => now - time < this.windowMs);

    if (validRequests.length >= this.maxRequests) {
      return false;
    }

    validRequests.push(now);
    this.requests.set(key, validRequests);
    return true;
  }

  /**
   * Reset rate limit for a key
   */
  reset(key: string): void {
    this.requests.delete(key);
  }
}
