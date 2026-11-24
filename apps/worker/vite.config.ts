import { defineConfig, Plugin } from 'vite'
import { cloudflare } from '@cloudflare/vite-plugin'
import basicSsl from '@vitejs/plugin-basic-ssl'
import { execSync } from 'node:child_process'
import pkg from './package.json' with { type: 'json' }
import dotenv from 'dotenv'

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

const wranglerEnv: Plugin = {
  name: 'wrangler-env',
  generateBundle: (_opts, bundle, _write) => {
    const wrangler = bundle['wrangler.json']

    if (wrangler.type !== 'asset') {
      return
    }

    let source = ''
    if (typeof wrangler.source === 'string') {
      source = wrangler.source
    }
    else if (wrangler.source instanceof Uint8Array) {
      source = wrangler.source.toString()
    }
    else {
      throw new Error('failed to read wrangler.json source')
    }

    dotenv.config({
      quiet: true,
      path: [
        'wrangler.env',
        'wrangler.env.production',
      ],
      override: true,
    })

    wrangler.source = source.replaceAll(/\$\{(?<var>[A-Z0-9_]+)\}/g, function (_, v) {
      return process.env[`CF_${v}`] ?? '__UNKNOWN__'
    })
  },
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
    wranglerEnv,
    cloudflare(),
    basicSsl(),
  ],
})
