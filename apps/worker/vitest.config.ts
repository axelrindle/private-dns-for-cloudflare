import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { defineConfig } from 'vitest/config'
import { cloudflareTest, type D1Migration } from '@cloudflare/vitest-pool-workers'

// Drizzle keeps every migration in its own directory as `<name>/migration.sql`
// with `--> statement-breakpoint` between statements, so `readD1Migrations()`
// from the pool package cannot read them.
function readDrizzleMigrations(dir: string): D1Migration[] {
  return readdirSync(dir, { withFileTypes: true })
    .filter(entry => entry.isDirectory())
    .map(entry => entry.name)
    .sort()
    .map(name => ({
      name,
      queries: readFileSync(join(dir, name, 'migration.sql'), 'utf8')
        .split('--> statement-breakpoint')
        .map(query => query.trim())
        .filter(query => query.length > 0),
    }))
}

// Tests run fully local: define the bindings via miniflare instead of
// reading wrangler.jsonc (which references deployment specific variables).
// The cloudflareTest plugin also wires the pool and provides the
// `cloudflare:test` module.
export default defineConfig({
  plugins: [
    cloudflareTest({
      miniflare: {
        compatibilityDate: '2026-07-24',
        d1Databases: ['db'],
        kvNamespaces: ['kv'],
        bindings: {
          APP_ENV: 'test',
          AUTH_TOKEN_DNS: 'test-token-dns',
          AUTH_TOKEN_DDNS: 'test-token-ddns',
          TELEGRAM_BOT_TOKEN: 'test-bot',
          TELEGRAM_CHAT_ID: 'test-chat',
          TEST_MIGRATIONS: readDrizzleMigrations(join(import.meta.dirname, 'drizzle')),
        },
      },
    }),
  ],
  test: {
    setupFiles: ['./test/setup.ts'],
  },
})
