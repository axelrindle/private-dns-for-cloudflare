import { DrizzleD1Database } from 'drizzle-orm/d1'

export type DatabaseClient = DrizzleD1Database & {
  $client: D1Database | D1DatabaseSession
}
