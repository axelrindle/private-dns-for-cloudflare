import { createMiddleware } from 'hono/factory'
import { HEADER_CONTENT_TYPE, HonoBindings } from '../constants'

export const requireContentType = (contentType: string) => {
  return createMiddleware<HonoBindings>(async (c, next) => {
    if (c.req.header(HEADER_CONTENT_TYPE) !== contentType) {
      return c.text('Unsupported Media Type', 415)
    }

    await next()
  })
}
