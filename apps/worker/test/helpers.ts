import { decode, encode, RECURSION_DESIRED, type Question } from '@dnsquery/dns-packet'
import { env } from 'cloudflare:workers'
import { drizzle } from 'drizzle-orm/d1'
import type { AppBindings } from '../src/constants'
import { dnsRecords } from '../src/db'
import app from '../src/index'

export function bindings(): AppBindings {
  return {
    ...env,
    drizzle: drizzle(env.db),
  }
}

export async function insertRecord(record: typeof dnsRecords.$inferInsert) {
  await drizzle(env.db).insert(dnsRecords).values(record)
}

export function encodeQuery(question: Question, id = 4242): Uint8Array {
  return encode({
    type: 'query',
    id,
    flags: RECURSION_DESIRED,
    questions: [question],
  })
}

export function decodePacket(bytes: ArrayBuffer | Uint8Array) {
  return decode(bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes))
}

export function request(path: string, init?: RequestInit) {
  return app.request(path, init, { ...env })
}
