import type { Answer, Question } from '@dnsquery/dns-packet'
import { eq } from 'drizzle-orm'
import { AppBindings } from '../constants'
import { dnsRecords } from '../db'

type DnsRecord = typeof dnsRecords.$inferSelect

export interface Resolution {
  rcode: 'NOERROR' | 'REFUSED'
  answers: Answer[]
}

const DEFAULT_TTL = 300

export type Resolver = (question: Question) => Promise<Resolution>

export function resolver({ drizzle: db, kv }: AppBindings) {
  const lookup = async (name: string) => {
    const results = await db.select()
      .from(dnsRecords)
      .where(eq(dnsRecords.name, name))
      .limit(1)

    switch (results.length) {
      case 0:
        return undefined
      case 1:
        return results[0]
    }
  }

  return async (question: Question): Promise<Resolution> => {
    const row = await lookup(question.name)
    if (!row) {
      return { rcode: 'REFUSED', answers: [] }
    }

    // handle dynamic content
    if (row.content.startsWith('::')) {
      const match = /^::(?<type>\w+)::(?<key>\w+)$/g.exec(row.content)
      if (match !== null) {
        const { type, key } = match.groups as { type: string, key: string }
        switch (type) {
          case 'kv':
            const result = await kv.get(key)
            if (result !== null) {
              console.debug(`modified row content with value from kv namespace: ${key} => ${result}`)
              row.content = result
            }
            break
          default:
            console.warn(`unsupported dynamic handler ${type}`)
            break
        }
      }
    }

    const ttl = row.ttl ?? DEFAULT_TTL
    if (row.type === question.type) {
      return {
        rcode: 'NOERROR',
        answers: [toAnswer(row, ttl)],
      }
    }
    if (row.type === 'CNAME' && question.type !== 'CNAME') {
      return {
        rcode: 'NOERROR',
        answers: [toAnswer(row, ttl)],
      }
    }

    // NODATA: name exists, no matching type
    return {
      rcode: 'NOERROR',
      answers: [],
    }
  }
}

function toAnswer(row: DnsRecord, ttl: number): Answer {
  return {
    type: row.type,
    name: row.name,
    data: row.content,
    ttl,
  }
}
