import { toast } from '#/components/ui/toast'
import { DnsService } from '#bindings/internal/service'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'

/**
 * Deletes all config and data and returns to the setup page.
 * Removing the resolver entry asks for the admin password.
 */
export function useResetApp() {
    const queryClient = useQueryClient()
    const navigate = useNavigate()

    return useMutation({
        mutationKey: ["app", "reset"],
        mutationFn: () => toast.promise(DnsService.Reset(), {
            loading: 'Resetting',
            success: 'Application reset',
            error: 'Reset failed',
        }),
        onSuccess: async () => {
            queryClient.clear()
            await navigate({ to: '/setup' })
        },
    })
}
