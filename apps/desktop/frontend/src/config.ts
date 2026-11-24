import z from 'zod'

export const configSchemaBasic = z.strictObject({
    endpoint: z.url(),
    token: z.string(),
    insecureSkipVerify: z.boolean(),
})

export const configSchemaAdvanced = z.strictObject({
    port: z.int().min(1).max(65535),
    tld: z.string()
        .max(253)
        .regex(/^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)*$/, 'Lowercase domain without leading or trailing dot, e.g. "home.arpa"'),
})

export const configSchema = z.strictObject({
    ...configSchemaBasic.shape,
    ...configSchemaAdvanced.shape,
})

export type ConfigBasic = z.infer<typeof configSchemaBasic>
export type ConfigAdvanced = z.infer<typeof configSchemaAdvanced>
export type Config = z.infer<typeof configSchema>
