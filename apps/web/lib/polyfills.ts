/**
 * Browser Polyfills
 *
 * Provides Node.js APIs that are needed in the browser
 */

import { Buffer } from 'buffer';

// Make Buffer available globally
if (typeof window !== 'undefined') {
  (window as any).Buffer = Buffer;
  (globalThis as any).Buffer = Buffer;
}

export {};
