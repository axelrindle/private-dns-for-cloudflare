import { bindings, defineConfig } from 'cf/config'
import dotenv from 'dotenv'

// Deployment specific values live in cloudflare.env / cloudflare.env.production
// (the latter wins), prefixed with CF_.
dotenv.config({
  quiet: true,
  path: [
    'cloudflare.env',
    'cloudflare.env.production',
  ],
  override: true,
})

function env(name: string): string {
  const fqn = `CF_${name}`
  const value = process.env[fqn]
  if (value === undefined || value === '') {
    throw new Error(`${fqn} is not set, see cloudflare.env.example`)
  }

  return value
}

export default defineConfig({
  worker: {
    name: 'private-dns',
    compatibilityDate: '2026-07-24',
    entrypoint: 'src/index.ts',
    observability: {
      enabled: true,
      logs: {
        enabled: true,
        persist: true,
      },
    },
    domains: [
      {
        hostname: env('ROUTE_DOMAIN'),
        previews: true,
        production: true,
      },
    ],
    env: {
      db: bindings.d1({
        name: 'private-dns',
        id: env('D1_DATABASE_ID'),
        dev: {
          remote: false,
        },
      }),
      kv: bindings.kv({
        id: env('KV_DATABASE_ID'),
        dev: {
          remote: false,
        },
      }),

      APP_ENV: bindings.secret(),
      AUTH_TOKEN_DNS: bindings.secret(),
      AUTH_TOKEN_DDNS: bindings.secret(),
      TELEGRAM_BOT_TOKEN: bindings.secret(),
      TELEGRAM_CHAT_ID: bindings.secret(),
    },
  },
})
