import { env } from 'cloudflare:workers'
import { describe, expect, it } from 'vitest'
import { request } from '../helpers'

const auth = { Authorization: `Bearer ${env.AUTH_TOKEN_DNS}` }

describe('GET /.well-known/info', () => {
  const nonce = '019a3b8e-6f4c-7d21-9a5e-0c1b2d3e4f50'

  it('rejects requests without token', async () => {
    const res = await request('/.well-known/info', { headers: { 'Cfpd-Nonce': nonce } })

    expect(res.status).toBe(401)
  })

  it('requires a nonce header', async () => {
    const res = await request('/.well-known/info', { headers: auth })

    expect(res.status).toBe(400)
  })

  it('rejects a nonce that is not a UUIDv7', async () => {
    const res = await request('/.well-known/info', {
      headers: { ...auth, 'Cfpd-Nonce': crypto.randomUUID() },
    })

    expect(res.status).toBe(400)
  })

  it('returns build info and echoes the nonce', async () => {
    const res = await request('/.well-known/info', { headers: { ...auth, 'Cfpd-Nonce': nonce } })

    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({
      version: 'dev',
      commit: 'unknown',
      timestamp: null,
      nonce,
    })
  })
})
