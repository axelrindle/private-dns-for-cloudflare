import { drizzle } from 'drizzle-orm/d1'
import { Hono } from 'hono'
import { logger } from 'hono/logger'
import { requestId } from 'hono/request-id'
import { timeout } from 'hono/timeout'
import { HonoBindings, scalarConfiguration } from './constants'
import { appAddress } from './routes/ddns/address'
import { appUpdate } from './routes/ddns/update'
import { appInfo } from './routes/info'
import { appDnsQuery } from './routes/dns/query'
import { openAPIRouteHandler } from 'hono-openapi'
import { description, version } from '../package.json'
import { Scalar } from '@scalar/hono-api-reference'
import { onlyDevelopment } from './middleware/development'

const app = new Hono<HonoBindings>()

app.use(logger())
app.use(requestId())
app.use(timeout(5000))

// populate global context
app.use(async (c, next) => {
  const db = drizzle(c.env.db)
  c.env.drizzle = db
  await next()
})

app.route('/.well-known/info', appInfo)

app.route('/ddns/get', appAddress)
app.route('/ddns/update', appUpdate)

app.route('/dns/query', appDnsQuery)

app.get('/api/v1.json', onlyDevelopment, openAPIRouteHandler(app, {
  documentation: {
    info: {
      title: 'Private DNS for Cloudflare',
      description,
      version,
    },
    components: {
      securitySchemes: {
        Token: {
          type: 'http',
          scheme: 'Bearer',
        },
      },
    },
  },
}))

app.get('/api/v1.html', onlyDevelopment, Scalar({
  ...scalarConfiguration,
  url: '/api/v1.json',
}))

export default app
