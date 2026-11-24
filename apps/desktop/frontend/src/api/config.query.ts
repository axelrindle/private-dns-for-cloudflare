import { Config } from '#/config'
import { KeyringService } from '#bindings/internal/service'
import { queryOptions } from '@tanstack/react-query'

type Result<T> =
    | { type: 'none' }
    | { type: 'error', error: Error }
    | { type: 'ok', data: T }

export const configOptions = queryOptions({
    queryKey: ["app", "config"],
    queryFn: async (): Promise<Result<Config>> => {
        try {
            const data = await KeyringService.ReadConfig()
            return data === null ? { type: "none" } : { type: "ok", data }
        } catch (e) {
            console.error(e)
            return { type: "error", error: e instanceof Error ? e : new Error(String(e)) }
        }
    },
})
