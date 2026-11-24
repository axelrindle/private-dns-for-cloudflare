import { configOptions } from '#/api/config.query'
import { useToggleDns } from '#/api/dns.mutation'
import { statsHistoryOptions } from '#/api/stats.query'
import { AppIcon } from '#/components/app/app-icon'
import { Centered } from '#/components/app/centered'
import { QueryChart } from '#/components/app/query-chart'
import { Button } from '#/components/ui/button'
import { useDnsRunning } from '#/hooks/use-dns-running'
import { useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/_app/')({
  component: RouteComponent,
  loader: async ({ context: { queryClient } }) => {
    const config = await queryClient.query(configOptions)
    if (config.type === "none") {
      throw redirect({ to: '/setup' })
    }
    if (config.type === "error") {
        // TODO: Error page with reset button
        throw redirect({ to: '/setup' })
    }
    await queryClient.query(statsHistoryOptions)
  },
})

function RouteComponent() {
    const isRunning = useDnsRunning()
    const { data: history } = useSuspenseQuery({
        ...statsHistoryOptions,
        // while stopped only the time window moves on
        refetchInterval: isRunning ? 5_000 : 60_000,
    })

    const toggle = useToggleDns()

    return (
        <Centered>
            <AppIcon
                size={96}
                status={isRunning ? 'connected' : 'disconnected'}
                className='text-kumo-brand'
            />

            <Button
                disabled={toggle.isPending}
                onClick={() => toggle.mutate(!isRunning)}
            >
                {isRunning ? 'Stop' : 'Start'}
            </Button>

            {toggle.error && (
                <p className='text-sm text-destructive'>
                    {toggle.error.message}
                </p>
            )}

            {history === null
                ? null
                : <QueryChart history={history} />}

            <div className="flex-1"></div>

            <p className='text-sm text-muted-foreground'>
                Not affiliated with Cloudflare, Inc.
            </p>
        </Centered>
    )
}
