import { AutostartService } from '#bindings/internal/service'
import { queryOptions } from '@tanstack/react-query'

export const autostartOptions = queryOptions({
    queryKey: ["app", "autostart"],
    queryFn: () => AutostartService.IsEnabled(),
})
