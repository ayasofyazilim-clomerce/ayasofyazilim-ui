/*! tscanify index v1.0.0 | MIT License */

// Export types
export * from './types';

// Re-export opencv-ts for convenience
import type { Mat, MatVector, Size, Rect } from 'opencv-ts';
export type { Mat, MatVector, Size, Rect };

// Dynamic imports based on environment
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let TScanify: any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let TScanifyNode: any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let TScanifyBrowser: any;

// Detect browser environment
const isBrowser =
  typeof window !== 'undefined' && typeof window.document !== 'undefined';

// Use dynamic imports to avoid loading Node.js modules in the browser
if (isBrowser) {
  // In browser environments, only import the browser version
  import('./tscanify-browser').then((module) => {
    TScanifyBrowser = module.TScanifyBrowser;
    TScanify = TScanifyBrowser;
  });
} else {
  // In Node.js environments, we can safely import the Node versions
  import('./tscanify').then((module) => {
    TScanify = module.TScanify;
  });
}

// Use dynamic import approach in function form for better browser bundling
export async function createTScanify() {
  if (isBrowser) {
    const { TScanifyBrowser } = await import('./tscanify-browser');
    return new TScanifyBrowser();
  } else {
    const { TScanify } = await import('./tscanify');
    return new TScanify();
  }
}

// Export for backward compatibility
export { TScanify, TScanifyBrowser, TScanifyNode };

// Default export for backward compatibility
export default TScanify;
