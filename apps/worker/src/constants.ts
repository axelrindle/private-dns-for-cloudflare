import { HtmlRenderingConfiguration } from '@scalar/types/api-reference'
import { DatabaseClient } from './init/db'

export type AppBindings = Cloudflare.Env & {
  drizzle: DatabaseClient
}

export type HonoBindings = {
  Bindings: AppBindings
}

export const HEADER_CONTENT_TYPE = 'Content-Type'

export const CONTENT_TYPE_DNS_MESSAGE = 'application/dns-message'

export const KV_KEY_IPV6 = 'publicIpv6Address'

export const scalarConfiguration = {
  theme: 'mars',
  hideSearch: true,
  hideClientButton: true,
  persistAuth: true,
  mcp: {
    disabled: true,
  },
  agent: {
    disabled: true,
  },
  showDeveloperTools: 'never',
} satisfies Partial<HtmlRenderingConfiguration>
