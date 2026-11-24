import { zValidator } from '@hono/zod-validator'
import { Hono } from 'hono'
import { describeRoute, resolver } from 'hono-openapi'
import z from 'zod'
import { sendMessage } from '../../init/telegram'
import { HonoBindings, KV_KEY_IPV6 } from '../../constants'
import { authorize } from '../../middleware/authorize'

const bodySchema = z.strictObject({
  ipv6: z.ipv6(),
  zones: z.array(z.strictObject({
    token: z.string().nonempty(),
    zoneId: z.string().nonempty(),
    records: z.array(z.string().nonempty()),
  })),
})

const description = `
Allows mass updating multiple DNS records across multiple zones on Cloudflare.
`

const app = new Hono<HonoBindings>()
  .post('/', describeRoute({
    summary: 'Mass update DNS records',
    description,
    security: [
      {
        Token: [],
      },
    ],
    requestBody: {
      content: {
        'application/json': {
          schema: resolver(bodySchema),
        },
      },
    },
    responses: {
      200: {
        description: 'Mass update succeeded',
        content: {
          'application/json': {
            schema: resolver(z.strictObject({
              success: z.literal(true),
            })),
          },
        },
      },
      400: {
        description: `
Cloudflare failed to update one or more records.

For more information view the [Cloudflare API documentation](https://developers.cloudflare.com/api/resources/dns/subresources/records/methods/batch/)
`,
        content: {
          'application/json': {
            schema: resolver(z.strictObject({
              success: z.literal(false),
              status: z.number(),
              meta: z.object().describe('The response from Cloudflare'),
            })),
          },
        },
      },
      500: {
        description: 'Something else went wrong',
      },
    },
  }), authorize({
    getToken: ctx => ctx.env.AUTH_TOKEN_DDNS,
  }), zValidator('json', bodySchema), async (c) => {
    const { ipv6, zones } = c.req.valid('json')

    // we can only batch a single zone, so we loop through the requested zone updates
    // and hope for the best
    for (const { zoneId, token, records } of zones) {
      const patches = records.map(id => ({ id, content: ipv6 }))

      const url = `https://api.cloudflare.com/client/v4/zones/${zoneId}/dns_records/batch`
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ patches }),
      })

      if (res.status !== 200) {
        const meta = await res.json()
        console.error('Update failed', meta)
        return c.json({
          success: false,
          status: res.status,
          meta,
        }, 400)
      }
    }

    await c.env.kv.put(KV_KEY_IPV6, ipv6)

    const tgMsg = `New public IPv6 address: ${ipv6}`
    await sendMessage(
      c.env.TELEGRAM_BOT_TOKEN,
      c.env.TELEGRAM_CHAT_ID,
      tgMsg,
    )

    return c.json({ success: true })
  })

export {
  app as appUpdate,
}
