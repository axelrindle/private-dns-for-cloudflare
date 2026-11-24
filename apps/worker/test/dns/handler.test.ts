import { describe, expect, it, vi } from 'vitest'
import { processQuery } from '../../src/dns/handler'
import type { Resolver } from '../../src/dns/resolver'
import { decodePacket, encodeQuery } from '../helpers'

describe('processQuery', () => {
  it('answers with FORMERR for undecodable input', async () => {
    const resolve = vi.fn<Resolver>()

    const packet = decodePacket(await processQuery(new Uint8Array([0xff]), resolve))

    expect(packet.rcode).toBe('FORMERR')
    expect(packet.id).toBe(0)
    expect(resolve).not.toHaveBeenCalled()
  })

  it('passes the question to the resolver and encodes its result', async () => {
    const resolve = vi.fn<Resolver>().mockResolvedValue({
      rcode: 'NOERROR',
      answers: [{ type: 'A', name: 'host.example', data: '10.0.0.1', ttl: 60 }],
    })

    const packet = decodePacket(await processQuery(encodeQuery({ type: 'A', name: 'host.example' }, 55), resolve))

    expect(resolve).toHaveBeenCalledWith(expect.objectContaining({ type: 'A', name: 'host.example' }))
    expect(packet.id).toBe(55)
    expect(packet.rcode).toBe('NOERROR')
    expect(packet.questions).toMatchObject([{ type: 'A', name: 'host.example' }])
    expect(packet.answers).toMatchObject([{ data: '10.0.0.1' }])
  })

  it('answers with SERVFAIL when the resolver throws', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const resolve = vi.fn<Resolver>().mockRejectedValue(new Error('boom'))

    const packet = decodePacket(await processQuery(encodeQuery({ type: 'A', name: 'host.example' }, 56), resolve))

    expect(packet.id).toBe(56)
    expect(packet.rcode).toBe('SERVFAIL')
    expect(packet.answers).toEqual([])
  })
})
