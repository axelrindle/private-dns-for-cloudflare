import { createContext, useContext } from 'react'

export const DnsRunningContext = createContext<boolean | null>(null)

/**
 * Whether the DNS service is currently running.
 * Must be used inside a `DnsProvider`.
 */
export function useDnsRunning() {
    const isRunning = useContext(DnsRunningContext)
    if (isRunning === null) {
        throw new Error('useDnsRunning must be used within a DnsProvider')
    }
    return isRunning
}
