import { AppIcon } from '#/components/app/app-icon'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '#/components/ui/collapsible'
import { Separator } from '#/components/ui/separator'
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarMenuSub, SidebarMenuSubButton, SidebarMenuSubItem } from '#/components/ui/sidebar'
import type { FileRouteTypes } from '#/routeTree.gen'
import { CaretRightIcon, GearIcon, GlobeIcon, Icon, InfoIcon } from '@phosphor-icons/react'
import { Link, useLocation } from '@tanstack/react-router'
import { cn } from 'cn'
import { useState } from 'react'

type SidebarLink = {
    label: string
    to: FileRouteTypes['to']
    icon?: Icon
}

type SidebarLinkGroup = {
    label: string
    icon?: Icon
    children: Array<SidebarLink>
}

type SidebarEntry = SidebarLink | SidebarLinkGroup

const sidebarLinks: Array<SidebarEntry> = [
    {
        to: '/',
        label: 'Home',
        icon: GlobeIcon,
    },
    {
        label: 'Settings',
        icon: GearIcon,
        children: [
            {
                to: '/settings/upstream',
                label: 'Upstream',
            },
            {
                to: '/settings/application',
                label: 'Application',
            },
            {
                to: '/settings/advanced',
                label: 'Advanced',
            },
        ],
    },
    {
        to: '/about',
        label: 'About',
        icon: InfoIcon,
    },
]

export function AppSidebar() {
    const route = useLocation()

    function isHere(link: SidebarLink): boolean {
        return route.pathname === link.to
    }

    return (
        <Sidebar>
            <SidebarHeader className='bg-kumo-brand'>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <AppIcon size={48} className='text-white mx-auto' />
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>
            <Separator />
            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {sidebarLinks.map((item, key) => 'children' in item ? (
                                <SidebarGroupItem key={key} group={item} isHere={isHere} />
                            ) : (
                                <SidebarMenuItem key={key}>
                                    <SidebarMenuButton
                                        render={<Link to={item.to} />}
                                        isActive={isHere(item)}
                                    >
                                        {item.icon ? <item.icon /> : null}
                                        {item.label}
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>
        </Sidebar>
    )
}

type SidebarGroupItemProps = {
    group: SidebarLinkGroup
    isHere: (link: SidebarLink) => boolean
}

function SidebarGroupItem({ group, isHere }: SidebarGroupItemProps) {
    const containsHere = group.children.some(isHere)
    const [open, setOpen] = useState(containsHere)

    return (
        <Collapsible
            // stay open while one of the children is the current page
            open={open || containsHere}
            onOpenChange={setOpen}
            render={<SidebarMenuItem />}
        >
            <SidebarMenuButton render={<CollapsibleTrigger />}>
                {group.icon ? <group.icon /> : null}
                {group.label}
                <CaretRightIcon
                    className={cn(
                        'ml-auto transition-transform',
                        (open || containsHere) && 'rotate-90',
                    )}
                />
            </SidebarMenuButton>
            <CollapsibleContent>
                <SidebarMenuSub>
                    {group.children.map((child, key) => (
                        <SidebarMenuSubItem key={key}>
                            <SidebarMenuSubButton
                                render={<Link to={child.to}>{child.label}</Link>}
                                isActive={isHere(child)}
                            />
                        </SidebarMenuSubItem>
                    ))}
                </SidebarMenuSub>
            </CollapsibleContent>
        </Collapsible>
    )
}
