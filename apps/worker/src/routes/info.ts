import { Hono } from 'hono'
import { HonoBindings } from '../constants'
import { authorize } from '../middleware/authorize'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { buildInfo } from '../build-info'

const app = new Hono<HonoBindings>()
  .use(authorize({
    getToken: ctx => ctx.env.AUTH_TOKEN_DNS,
  }))
  .get('/', zValidator('header', z.object({
    'Cfpd-Nonce': z.uuidv7(),
  })), (c) => {
    const h = c.req.valid('header')
    return c.json({
      ...buildInfo,
      nonce: h['Cfpd-Nonce'],
    })
  })

export {
  app as appInfo,
}
