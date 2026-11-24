import { Toaster } from '#/components/ui/toast'
import { TooltipProvider } from '#/components/ui/tooltip'
import { TanStackDevtools } from '@tanstack/react-devtools'
import { QueryClient } from '@tanstack/react-query'
import { ReactQueryDevtoolsPanel } from '@tanstack/react-query-devtools'
import { createRootRouteWithContext, Outlet } from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import * as React from 'react'

type RouterContext = {
    queryClient: QueryClient
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootComponent,
})

function RootComponent() {
    return (
        <React.Fragment>
            <Outlet />

            <TooltipProvider />
            <Toaster />

            <TanStackDevtools
                config={{ position: 'bottom-right', defaultOpen: false, }}
                eventBusConfig={{ connectToServerBus: true }}
                plugins={[
                    {
                        name: 'Router',
                        render: <TanStackRouterDevtoolsPanel />,
                    },
                    {
                        name: 'Query',
                        render: <ReactQueryDevtoolsPanel />,
                    },
                ]}
            />
        </React.Fragment>
    )
}
