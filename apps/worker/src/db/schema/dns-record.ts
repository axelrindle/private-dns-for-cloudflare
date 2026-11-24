import { int, sqliteTable, text } from 'drizzle-orm/sqlite-core'

export const dnsRecords = sqliteTable('dns_records', {
  id: int().primaryKey({ autoIncrement: true }),
  type: text({ enum: ['A', 'AAAA', 'CNAME', 'TXT'] }).notNull(),
  name: text().notNull().unique(),
  content: text().notNull(),
  ttl: int(),
})
