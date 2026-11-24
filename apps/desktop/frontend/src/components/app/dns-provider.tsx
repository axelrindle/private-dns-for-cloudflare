import { dnsRunningOptions } from '#/api/dns.query'
import { DnsRunningContext } from '#/hooks/use-dns-running'
import { useSuspenseQuery } from '@tanstack/react-query'
import type { ReactNode } from 'react'

export function DnsProvider({ children }: { children: ReactNode }) {
    const { data: isRunning } = useSuspenseQuery(dnsRunningOptions)

    return (
        <DnsRunningContext.Provider value={isRunning}>
            {children}
        </DnsRunningContext.Provider>
    )
}
