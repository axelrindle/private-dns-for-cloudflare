import { autostartOptions } from '#/api/autostart.query'
import { AutostartService } from '#bindings/internal/service'
import { useMutation, useQueryClient } from '@tanstack/react-query'

export function useToggleAutostart() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationKey: ["app", "autostart", "toggle"],
        mutationFn: (enable: boolean) => enable ? AutostartService.Enable() : AutostartService.Disable(),
        onSettled: () => queryClient.invalidateQueries({ queryKey: autostartOptions.queryKey }),
    })
}
