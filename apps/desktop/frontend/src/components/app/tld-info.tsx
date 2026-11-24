import { Tooltip, TooltipContent, TooltipTrigger } from '#/components/ui/tooltip'
import { InfoIcon } from '@phosphor-icons/react'

/**
 * Explains the tld setting next to its label.
 */
export function TldInfo() {
    return (
        <Tooltip>
            <TooltipTrigger
                type='button'
                aria-label='About this setting'
                className='text-muted-foreground hover:text-foreground'
            >
                <InfoIcon />
            </TooltipTrigger>
            <TooltipContent side='right'>
                <div className='flex flex-col gap-1.5'>
                    <p>
                        Lookups for this domain and all names below it go through the forwarder.
                        Every other lookup keeps using your regular DNS.
                    </p>
                    <p>
                        macOS reads this from <code>/etc/resolver/&lt;domain&gt;</code>.
                        Writing that file needs your admin password, so you are asked whenever domain or port change.
                    </p>
                    <p>
                        Pick a domain that does not exist on the internet,
                        e.g. <code>home.arpa</code> (reserved for home networks by RFC 8375) or <code>home</code>.
                    </p>
                </div>
            </TooltipContent>
        </Tooltip>
    )
}
