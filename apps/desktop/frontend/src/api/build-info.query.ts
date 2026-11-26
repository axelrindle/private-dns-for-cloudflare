import { BuildInfoService } from '#bindings/internal/service'
import { queryOptions } from '@tanstack/react-query'

export const buildInfoOptions = queryOptions({
    queryKey: ["app", "build-info"],
    queryFn: () => BuildInfoService.Get(),
    // Fixed at build time.
    staleTime: Infinity,
})
