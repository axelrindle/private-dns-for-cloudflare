import { CloudCheckIcon, CloudIcon, CloudSlashIcon, type Icon } from '@phosphor-icons/react'
import { cn } from 'cn'

export type AppIconStatus = 'connected' | 'disconnected'

type AppIconProps = {
    /** Omit to render the neutral cloud. */
    status?: AppIconStatus
    size?: number
    className?: string
}

type Variant = {
    icon: Icon
    status: AppIconStatus | undefined
    /** Classes applied while this variant is not shown. */
    hidden: string
}

const variants: Array<Variant> = [
    { icon: CloudIcon, status: undefined, hidden: 'opacity-0 scale-50' },
    { icon: CloudCheckIcon, status: 'connected', hidden: 'opacity-0 scale-50 -rotate-45' },
    { icon: CloudSlashIcon, status: 'disconnected', hidden: 'opacity-0 scale-50 rotate-45' },
]

const labels: Record<AppIconStatus, string> = {
    connected: 'Connected',
    disconnected: 'Disconnected',
}

export function AppIcon({ status, size = 48, className }: AppIconProps) {
    return (
        <div
            role={status ? 'img' : undefined}
            aria-label={status ? labels[status] : undefined}
            aria-hidden={status ? undefined : true}
            className={cn('grid w-fit *:col-start-1 *:row-start-1', className)}
        >
            {variants.map((variant) => (
                <variant.icon
                    key={variant.status ?? 'neutral'}
                    size={size}
                    weight='duotone'
                    aria-hidden
                    className={cn(
                        'transition-all duration-300 ease-out',
                        variant.status === status ? 'opacity-100 scale-100 rotate-0' : variant.hidden,
                    )}
                />
            ))}
        </div>
    )
}
