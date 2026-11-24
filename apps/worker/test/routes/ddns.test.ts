import { env } from 'cloudflare:workers'
import { describe, expect, it, vi } from 'vitest'
import { request } from '../helpers'

const auth = { Authorization: `Bearer ${env.AUTH_TOKEN_DDNS}` }

describe('GET /ddns/get', () => {
  it('rejects requests without token', async () => {
    const res = await request('/ddns/get')

    expect(res.status).toBe(401)
  })

  it('rejects the dns token', async () => {
    const res = await request('/ddns/get', { headers: { Authorization: `Bearer ${env.AUTH_TOKEN_DNS}` } })

    expect(res.status).toBe(401)
  })

  it('returns 404 before the first update', async () => {
    const res = await request('/ddns/get', { headers: auth })

    expect(res.status).toBe(404)
  })

  it('returns the stored address', async () => {
    await env.kv.put('publicIpv6Address', 'fd00::1')

    const res = await request('/ddns/get', { headers: auth })

    expect(res.status).toBe(200)
    expect(await res.text()).toBe('fd00::1')
  })
})

describe('POST /ddns/update', () => {
  const body = {
    ipv6: 'fd00::2',
    zones: [
      { token: 'cf-token-a', zoneId: 'zone-a', records: ['rec-1', 'rec-2'] },
      { token: 'cf-token-b', zoneId: 'zone-b', records: ['rec-3'] },
    ],
  }

  function update(payload: unknown, headers: Record<string, string> = auth) {
    return request('/ddns/update', {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
  }

  it('rejects requests without token', async () => {
    const res = await update(body, {})

    expect(res.status).toBe(401)
  })

  it.each([
    ['invalid address', { ...body, ipv6: '10.0.0.1' }],
    ['missing zones', { ipv6: body.ipv6 }],
    ['unknown keys', { ...body, extra: true }],
    ['empty record id', { ...body, zones: [{ ...body.zones[0], records: [''] }] }],
  ])('rejects %s', async (_, payload) => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch')

    const res = await update(payload)

    expect(res.status).toBe(400)
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('patches every zone, stores the address and notifies telegram', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(async () => Promise.resolve(Response.json({ success: true })))

    const res = await update(body)

    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ success: true })
    expect(await env.kv.get('publicIpv6Address')).toBe('fd00::2')

    expect(fetchSpy).toHaveBeenCalledTimes(3)

    const [zoneA, zoneB, telegram] = fetchSpy.mock.calls
    expect(zoneA[0]).toBe('https://api.cloudflare.com/client/v4/zones/zone-a/dns_records/batch')
    expect(zoneA[1]?.headers).toMatchObject({ Authorization: 'Bearer cf-token-a' })
    expect(JSON.parse(zoneA[1]?.body as string)).toEqual({
      patches: [
        { id: 'rec-1', content: 'fd00::2' },
        { id: 'rec-2', content: 'fd00::2' },
      ],
    })

    expect(zoneB[0]).toBe('https://api.cloudflare.com/client/v4/zones/zone-b/dns_records/batch')
    expect(zoneB[1]?.headers).toMatchObject({ Authorization: 'Bearer cf-token-b' })

    expect(telegram[0]).toBe(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`)
    expect(JSON.parse(telegram[1]?.body as string)).toEqual({
      chat_id: env.TELEGRAM_CHAT_ID,
      text: 'New public IPv6 address: fd00::2',
    })
  })

  it('stops at the first failing zone and keeps the old address', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    await env.kv.put('publicIpv6Address', 'fd00::1')
    const cfError = { success: false, errors: [{ code: 1000, message: 'nope' }] }
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(() => Promise.resolve(Response.json(cfError, { status: 403 })))

    const res = await update(body)

    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({ success: false, status: 403, meta: cfError })
    expect(fetchSpy).toHaveBeenCalledTimes(1)
    expect(await env.kv.get('publicIpv6Address')).toBe('fd00::1')
  })
})
