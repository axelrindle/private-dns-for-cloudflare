import { encode } from '@dnsquery/dns-packet'
import { describe, expect, it } from 'vitest'
import { decodeQuery, encodeResponse } from '../../src/dns/codec'
import { decodePacket, encodeQuery } from '../helpers'

describe('decodeQuery', () => {
  it('returns id and first question', () => {
    const decoded = decodeQuery(encodeQuery({ type: 'A', name: 'host.example' }, 1234))

    expect(decoded.id).toBe(1234)
    expect(decoded.question).toMatchObject({ type: 'A', name: 'host.example' })
  })

  it('throws when the query has no question', () => {
    const bytes = encode({ type: 'query', id: 1, questions: [] })

    expect(() => decodeQuery(bytes)).toThrow('DNS query has no question')
  })

  it('throws on garbage input', () => {
    expect(() => decodeQuery(new Uint8Array([1, 2, 3]))).toThrow()
  })
})

describe('encodeResponse', () => {
  it.each([
    ['NOERROR', 'NOERROR'],
    ['FORMERR', 'FORMERR'],
    ['SERVFAIL', 'SERVFAIL'],
    ['REFUSED', 'REFUSED'],
  ] as const)('encodes rcode %s', (rcode, expected) => {
    const packet = decodePacket(encodeResponse({ id: 7, rcode, answers: [] }))

    expect(packet.rcode).toBe(expected)
  })

  it('marks the response as authoritative answer', () => {
    const packet = decodePacket(encodeResponse({ id: 7, rcode: 'NOERROR', answers: [] }))

    expect(packet.type).toBe('response')
    expect(packet.flag_aa).toBe(true)
    expect(packet.id).toBe(7)
  })

  it('echoes question and answers', () => {
    const packet = decodePacket(encodeResponse({
      id: 9,
      rcode: 'NOERROR',
      question: { type: 'A', name: 'host.example' },
      answers: [{ type: 'A', name: 'host.example', data: '10.0.0.1', ttl: 60 }],
    }))

    expect(packet.questions).toMatchObject([{ type: 'A', name: 'host.example' }])
    expect(packet.answers).toMatchObject([{ type: 'A', name: 'host.example', data: '10.0.0.1', ttl: 60 }])
  })

  it('omits the question section when none is given', () => {
    const packet = decodePacket(encodeResponse({ id: 0, rcode: 'FORMERR', answers: [] }))

    expect(packet.questions).toEqual([])
  })
})
