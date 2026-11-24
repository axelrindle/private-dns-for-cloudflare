import { AppIcon } from '#/components/app/app-icon'
import { Centered } from '#/components/app/centered'
import { Button } from '#/components/ui/button'
import { Card, CardContent } from '#/components/ui/card'
import { ArrowSquareOutIcon, CloudIcon, GithubLogoIcon, Icon } from '@phosphor-icons/react'
import { createFileRoute } from '@tanstack/react-router'
import { Browser } from '@wailsio/runtime'

export const Route = createFileRoute('/_app/about')({
    component: RouteComponent,
})

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
    return (
        <Centered>
            <AppIcon size={96} className='text-kumo-brand' />

            <div className='flex flex-col items-center gap-1 text-center'>
                <h1 className='text-xl font-medium'>
                    Private DNS for Cloudflare
                </h1>
                <p className='text-sm text-muted-foreground'>
                    Version {__APP_VERSION__}
                </p>
            </div>

            <Card className='w-full'>
                <CardContent className='text-sm text-muted-foreground'>
                    <p>
                        Runs a local DNS resolver that forwards queries for your private
                        domains to a DNS-over-HTTPS worker on Cloudflare. All other queries
                        go to the system resolver as usual.
                    </p>
                    <p>
                        Records live in your own Cloudflare account, so every device running
                        this app resolves the same names without a self-hosted DNS server.
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
