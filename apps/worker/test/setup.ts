import { env } from 'cloudflare:workers'
import { applyD1Migrations } from 'cloudflare:test'
import { afterEach, beforeEach, vi } from 'vitest'

beforeEach(async () => {
  await applyD1Migrations(env.db, env.TEST_MIGRATIONS)
})

afterEach(async () => {
  vi.restoreAllMocks()
  await env.db.exec('DELETE FROM dns_records')
  const { keys } = await env.kv.list()
  await Promise.all(keys.map(({ name }) => env.kv.delete(name)))
})
