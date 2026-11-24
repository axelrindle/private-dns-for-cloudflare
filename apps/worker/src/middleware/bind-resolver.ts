import { createMiddleware } from 'hono/factory'
import { AppBindings } from '../constants'
import { resolver, Resolver } from '../dns/resolver'

export const bindResolver = createMiddleware<{
  Bindings: AppBindings
  Variables: {
    resolve: Resolver
  }
}>(async (c, next) => {
  c.set('resolve', resolver(c.env))
  await next()
})
