import { configOptions } from '#/api/config.query'
import { toast } from '#/components/ui/toast'
import { Config } from '#/config'
import { DnsService } from '#bindings/internal/service'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from '@tanstack/react-router'

/**
 * Stores the full config. The DNS service restarts if it is running.
 */
export function useUpdateConfig() {
    const queryClient = useQueryClient()
    const router = useRouter()

    return useMutation({
        mutationKey: ["app", "config", "update"],
        mutationFn: (values: Config) => toast.promise(DnsService.UpdateConfig(values), {
            loading: 'Saving settings',
            success: 'Settings saved',
            error: 'Saving settings failed',
        }),
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: configOptions.queryKey })
            await router.invalidate()
        },
    })
}
