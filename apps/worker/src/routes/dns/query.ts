import { Hono } from 'hono'
import { CONTENT_TYPE_DNS_MESSAGE, HEADER_CONTENT_TYPE, HonoBindings } from '../../constants'
import { authorize } from '../../middleware/authorize'
import { requireContentType } from '../../middleware/content-type'
import { bindResolver } from '../../middleware/bind-resolver'
import { processQuery } from '../../dns/handler'

const app = new Hono<HonoBindings>()
  .use(authorize({
    getToken: ctx => ctx.env.AUTH_TOKEN_DNS,
  }))
  .use(requireContentType(CONTENT_TYPE_DNS_MESSAGE))
  .use(bindResolver)
  .post('/', async (c) => {
    const body = new Uint8Array(await c.req.arrayBuffer())
    const response = await processQuery(body, c.get('resolve'))

    return new Response(response, {
      status: 200,
      headers: {
        [HEADER_CONTENT_TYPE]: CONTENT_TYPE_DNS_MESSAGE,
      },
    })
  })

export {
  app as appDnsQuery,
}
