import '#/gen/bindings/events'
import { DnsService } from '#bindings/internal/service'
import { Events } from '@wailsio/runtime'
import { QueryClient, queryOptions } from '@tanstack/react-query'

export const dnsRunningOptions = queryOptions({
    queryKey: ["dns", "running"],
    queryFn: () => DnsService.IsRunning(),
})

/**
 * Keeps the running state in sync with the Go side.
 * Returns a function that removes the listener.
 */
export function subscribeDnsEvents(queryClient: QueryClient) {
    return Events.On("dns:running", (ev) => {
        queryClient.setQueryData(dnsRunningOptions.queryKey, ev.data)
    })
}
