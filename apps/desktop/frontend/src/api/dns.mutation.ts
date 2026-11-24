import { toast } from '#/components/ui/toast'
import { DnsService } from '#bindings/internal/service'
import { useMutation } from '@tanstack/react-query'

/**
 * Starts or stops the DNS service. The running state is updated via the "dns:running" event.
 */
export function useToggleDns() {
    return useMutation({
        mutationKey: ["dns", "toggle"],
        mutationFn: async (run: boolean) => {
            if (run) {
                await toast.promise(DnsService.Start(), {
                    loading: 'Starting',
                    success: 'DNS service running',
                    error: 'DNS startup failed',
                })
            } else {
                await toast.promise(DnsService.Stop(), {
                    loading: 'Stopping',
                    success: 'DNS service stopped',
                    error: 'DNS shutdown failed',
                })
            }
        },
    })
}
