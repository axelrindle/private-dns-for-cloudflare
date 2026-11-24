import { useToggleAutostart } from '#/api/autostart.mutation'
import { autostartOptions } from '#/api/autostart.query'
import { Card, CardContent, CardHeader, CardTitle } from '#/components/ui/card'
import { Field, FieldContent, FieldDescription, FieldError, FieldGroup, FieldLabel } from '#/components/ui/field'
import { Switch } from '#/components/ui/switch'
import { useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_app/settings/application')({
    component: RouteComponent,
    loader: ({ context: { queryClient } }) => queryClient.query(autostartOptions),
})

function RouteComponent() {
    const { data: autostart } = useSuspenseQuery(autostartOptions)

    const toggleAutostart = useToggleAutostart()

    return (
        <Card className='max-w-sm mx-auto'>
            <CardHeader>
                <CardTitle>
                    Application Settings
                </CardTitle>
            </CardHeader>
            <CardContent>
                <FieldGroup>
                    <Field orientation='horizontal'>
                        <FieldContent>
                            <FieldLabel htmlFor='autostart'>
                                Autostart
                            </FieldLabel>
                            <FieldDescription>
                                Launch the app when you log in
                            </FieldDescription>
                        </FieldContent>
                        <Switch
                            id='autostart'
                            checked={autostart}
                            disabled={toggleAutostart.isPending}
                            onCheckedChange={(checked) => toggleAutostart.mutate(checked)}
                        />
                    </Field>
                    {toggleAutostart.error && <FieldError>{toggleAutostart.error.message}</FieldError>}
                </FieldGroup>
            </CardContent>
        </Card>
    )
}
