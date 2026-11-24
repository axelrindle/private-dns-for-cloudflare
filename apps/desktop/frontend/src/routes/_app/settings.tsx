import { configOptions } from '#/api/config.query'
import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/_app/settings')({
    component: RouteComponent,
    loader: async ({ context: { queryClient } }) => {
        const config = await queryClient.query(configOptions)
        if (config.type !== "ok") {
            throw redirect({ to: '/setup' })
        }
        return config.data
    },
})

function RouteComponent() {
    return (
        <div className="py-8 w-full">
            <Outlet />
        </div>
    )
}
