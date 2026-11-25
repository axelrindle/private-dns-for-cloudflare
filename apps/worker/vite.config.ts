import { defineConfig } from 'vite'
import { cloudflare } from '@cloudflare/vite-plugin'
import basicSsl from '@vitejs/plugin-basic-ssl'
import { execSync } from 'node:child_process'
import pkg from './package.json' with { type: 'json' }

function resolveCommit(): string {
  if (process.env.GITHUB_SHA) {
    return process.env.GITHUB_SHA
  }

  try {
    return execSync('git rev-parse HEAD', { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim()
  }
  catch {
    return 'unknown'
  }
}

export default defineConfig({
  define: {
    __BUILD_VERSION__: JSON.stringify(pkg.version),
    __BUILD_COMMIT__: JSON.stringify(resolveCommit()),
    __BUILD_TIMESTAMP__: JSON.stringify(new Date().toISOString()),
  },
  build: {
    minify: true,
  },
  plugins: [
    cloudflare(),
    basicSsl(),
  ],
})
