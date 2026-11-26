import { buildInfoOptions } from '#/api/build-info.query'
import { AppIcon } from '#/components/app/app-icon'
import { Centered } from '#/components/app/centered'
import { Button } from '#/components/ui/button'
import { Card, CardContent } from '#/components/ui/card'
import { ArrowSquareOutIcon, CloudIcon, GithubLogoIcon, Icon } from '@phosphor-icons/react'
import { useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { Browser } from '@wailsio/runtime'

export const Route = createFileRoute('/_app/about')({
    component: RouteComponent,
    loader: ({ context: { queryClient } }) => queryClient.query(buildInfoOptions),
})

// Dev builds without ldflags keep the Go placeholder, which is not a date.
function formatTimestamp(value: string) {
    const date = new Date(value)
    return Number.isNaN(date.getTime()) ? value : date.toLocaleString()
}

const links: Array<{ label: string, url: string, icon: Icon }> = [
    {
        label: 'Source on GitHub',
        url: 'https://github.com/axelrindle/private-dns-for-cloudflare',
        icon: GithubLogoIcon,
    },
    {
        label: 'Cloudflare Dashboard',
        url: 'https://dash.cloudflare.com',
        icon: CloudIcon,
    },
]

function RouteComponent() {
    const { data: buildInfo } = useSuspenseQuery(buildInfoOptions)

    return (
        <Centered>
            <AppIcon size={96} className='text-kumo-brand' />

            <div className='flex flex-col items-center gap-1 text-center'>
                <h1 className='text-xl font-medium'>
                    Private DNS for Cloudflare
                </h1>
                <p className='text-sm text-muted-foreground'>
                    Version {buildInfo.version}
                </p>
                <p className='text-xs text-muted-foreground'>
                    Commit <span className='font-mono'>{buildInfo.commitHash}</span>
                    {' · '}
                    Built {formatTimestamp(buildInfo.buildTimestamp)}
                </p>
            </div>

            <Card className='w-full'>
                <CardContent className='text-sm text-muted-foreground'>
                    <p className='text-center'>
                        Connect to a DNS-over-HTTPS (DoH) worker on Cloudflare
                    </p>
                </CardContent>
            </Card>

            <div className='flex flex-wrap justify-center gap-2'>
                {links.map(({ label, url, icon: LinkIcon }) => (
                    <Button
                        key={url}
                        variant='outline'
                        onClick={() => Browser.OpenURL(url)}
                    >
                        <LinkIcon />
                        {label}
                        <ArrowSquareOutIcon className='text-muted-foreground' />
                    </Button>
                ))}
            </div>

            <p className='text-xs text-muted-foreground text-center'>
                Not affiliated with, endorsed by or sponsored by Cloudflare, Inc.
                Cloudflare and the Cloudflare logo are trademarks of Cloudflare, Inc.
            </p>
        </Centered>
    )
}
