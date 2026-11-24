import { subscribeDnsEvents } from '#/api/dns.query'
import { queryClient, router } from '#/providers'
import { QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from '@tanstack/react-router'
import React, { useEffect } from 'react'

export default function App() {
    useEffect(() => subscribeDnsEvents(queryClient), [])

    return (
        <React.Fragment>
            <QueryClientProvider client={queryClient}>
                <RouterProvider
                    router={router}
                />
            </QueryClientProvider>
        </React.Fragment>
    )
}
