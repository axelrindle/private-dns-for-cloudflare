// Replaced at build time via `define` in vite.config.ts.
// Vitest does not load that config, so the fallbacks apply in tests.
declare const __BUILD_VERSION__: string
declare const __BUILD_COMMIT__: string
declare const __BUILD_TIMESTAMP__: string

export const buildInfo = {
  version: typeof __BUILD_VERSION__ !== 'undefined' ? __BUILD_VERSION__ : 'dev',
  commit: typeof __BUILD_COMMIT__ !== 'undefined' ? __BUILD_COMMIT__ : 'unknown',
  timestamp: typeof __BUILD_TIMESTAMP__ !== 'undefined' ? __BUILD_TIMESTAMP__ : null,
} as const
