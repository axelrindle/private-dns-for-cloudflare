import { StatsService } from '#bindings/internal/service'
import { queryOptions } from '@tanstack/react-query'

export const statsHistoryOptions = queryOptions({
    queryKey: ["stats", "history"],
    queryFn: () => StatsService.History(),
})
