import { env } from 'cloudflare:workers'
import { describe, expect, it, vi } from 'vitest'
import { resolver } from '../../src/dns/resolver'
import { bindings, insertRecord } from '../helpers'

describe('resolver', () => {
  it('refuses unknown names', async () => {
    const result = await resolver(bindings())({ type: 'A', name: 'unknown.example' })

    expect(result).toEqual({ rcode: 'REFUSED', answers: [] })
  })

  it('answers a matching record type', async () => {
    await insertRecord({ type: 'A', name: 'host.example', content: '10.0.0.1', ttl: 60 })

    const result = await resolver(bindings())({ type: 'A', name: 'host.example' })

    expect(result).toEqual({
      rcode: 'NOERROR',
      answers: [{ type: 'A', name: 'host.example', data: '10.0.0.1', ttl: 60 }],
    })
  })

  it('falls back to a TTL of 300 seconds', async () => {
    await insertRecord({ type: 'AAAA', name: 'host.example', content: 'fd00::1' })

    const result = await resolver(bindings())({ type: 'AAAA', name: 'host.example' })

    expect(result.answers[0]?.ttl).toBe(300)
  })

  it('answers with the CNAME record for other question types', async () => {
    await insertRecord({ type: 'CNAME', name: 'alias.example', content: 'host.example' })

    const result = await resolver(bindings())({ type: 'A', name: 'alias.example' })

    expect(result).toEqual({
      rcode: 'NOERROR',
      answers: [{ type: 'CNAME', name: 'alias.example', data: 'host.example', ttl: 300 }],
    })
  })

  it('returns NODATA when the name exists with another type', async () => {
    await insertRecord({ type: 'A', name: 'host.example', content: '10.0.0.1' })

    const result = await resolver(bindings())({ type: 'AAAA', name: 'host.example' })

    expect(result).toEqual({ rcode: 'NOERROR', answers: [] })
  })

  describe('dynamic content', () => {
    it('replaces content with the value from the kv namespace', async () => {
      vi.spyOn(console, 'debug').mockImplementation(() => {})
      await env.kv.put('publicIpv6Address', 'fd00::42')
      await insertRecord({ type: 'AAAA', name: 'home.example', content: '::kv::publicIpv6Address' })

      const result = await resolver(bindings())({ type: 'AAAA', name: 'home.example' })

      expect(result.answers).toMatchObject([{ data: 'fd00::42' }])
    })

    it('keeps the original content when the kv key is missing', async () => {
      await insertRecord({ type: 'TXT', name: 'home.example', content: '::kv::missing' })

      const result = await resolver(bindings())({ type: 'TXT', name: 'home.example' })

      expect(result.answers).toMatchObject([{ data: '::kv::missing' }])
    })

    it('ignores unsupported handlers', async () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
      await insertRecord({ type: 'TXT', name: 'home.example', content: '::env::SOMETHING' })

      const result = await resolver(bindings())({ type: 'TXT', name: 'home.example' })

      expect(warn).toHaveBeenCalledWith('unsupported dynamic handler env')
      expect(result.answers).toMatchObject([{ data: '::env::SOMETHING' }])
    })
  })
})
