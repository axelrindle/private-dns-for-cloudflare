import { env } from 'cloudflare:workers'
import { describe, expect, it } from 'vitest'
import { decodePacket, encodeQuery, insertRecord, request } from '../helpers'

function query(body: BodyInit, headers: Record<string, string> = {}) {
  return request('/dns/query', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.AUTH_TOKEN_DNS}`,
      'Content-Type': 'application/dns-message',
      ...headers,
    },
    body,
  })
}

describe('POST /dns/query', () => {
  it('rejects requests without token', async () => {
    const res = await request('/dns/query', {
      method: 'POST',
      headers: { 'Content-Type': 'application/dns-message' },
      body: encodeQuery({ type: 'A', name: 'host.example' }),
    })

    expect(res.status).toBe(401)
  })

  it('rejects the ddns token', async () => {
    const res = await query(encodeQuery({ type: 'A', name: 'host.example' }), {
      Authorization: `Bearer ${env.AUTH_TOKEN_DDNS}`,
    })

    expect(res.status).toBe(401)
  })

  it('rejects other content types', async () => {
    const res = await query('host.example', { 'Content-Type': 'text/plain' })

    expect(res.status).toBe(415)
  })

  it('resolves a known record', async () => {
    await insertRecord({ type: 'A', name: 'host.example', content: '10.0.0.1', ttl: 60 })

    const res = await query(encodeQuery({ type: 'A', name: 'host.example' }, 77))

    expect(res.status).toBe(200)
    expect(res.headers.get('Content-Type')).toBe('application/dns-message')

    const packet = decodePacket(await res.arrayBuffer())
    expect(packet.id).toBe(77)
    expect(packet.rcode).toBe('NOERROR')
    expect(packet.answers).toMatchObject([{ type: 'A', name: 'host.example', data: '10.0.0.1', ttl: 60 }])
  })

  it('refuses an unknown record', async () => {
    const res = await query(encodeQuery({ type: 'A', name: 'unknown.example' }))

    const packet = decodePacket(await res.arrayBuffer())
    expect(packet.rcode).toBe('REFUSED')
  })

  it('answers malformed packets with FORMERR', async () => {
    const res = await query(new Uint8Array([0, 1, 2]))

    expect(res.status).toBe(200)
    const packet = decodePacket(await res.arrayBuffer())
    expect(packet.rcode).toBe('FORMERR')
  })
})
