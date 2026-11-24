import { routeTree } from '#/routeTree.gen'
import { QueryClient } from '@tanstack/react-query'
import { createHashHistory, createRouter } from '@tanstack/react-router'

const queryClient = new QueryClient()

const routerHistory = createHashHistory()
const router = createRouter({
    routeTree,
    history: routerHistory,
    // let Query decide when data is stale
    defaultPreloadStaleTime: 0,
    context: {
        queryClient,
    },
})

type AppRouter = typeof router

declare module '@tanstack/react-router' {
    interface Register {
        router: AppRouter
    }
}

export {
    queryClient,
    router
}

export type {
    AppRouter
}

