import { createMiddleware } from 'hono/factory'
import { AppBindings, HonoBindings } from '../constants'
import { bearerAuth } from 'hono/bearer-auth'
import { Context } from 'hono'

type Options = {
  getToken: (ctx: Context<{ Bindings: AppBindings }>) => string
}

export const authorize = ({ getToken }: Options) => {
  return createMiddleware<HonoBindings>(async (c, next) => {
    const token = getToken(c)
    const handler = bearerAuth<{ Bindings: AppBindings }>({ token })
    return handler(c, next)
  })
}
