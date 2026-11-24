import { dnsRunningOptions } from '#/api/dns.query'
import { DnsProvider } from '#/components/app/dns-provider'
import { AppSidebar } from '#/components/app/sidebar'
import { SidebarProvider } from '#/components/ui/sidebar'
import { createFileRoute, Outlet } from '@tanstack/react-router'

export const Route = createFileRoute('/_app')({
    component: RouteComponent,
    loader: ({ context: { queryClient } }) => queryClient.query(dnsRunningOptions),
})

function RouteComponent() {
    return (
        <DnsProvider>
            <SidebarProvider>
                <AppSidebar />
                <Outlet />
            </SidebarProvider>
        </DnsProvider>
    )
}
