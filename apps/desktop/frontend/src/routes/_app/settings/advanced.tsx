import { useResetApp } from '#/api/app.mutation'
import { useUpdateConfig } from '#/api/config.mutation'
import { SettingsForm } from '#/components/app/settings-form'
import { TldInfo } from '#/components/app/tld-info'
import { Alert, AlertDescription } from '#/components/ui/alert'
import { Button } from '#/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '#/components/ui/card'
import { Field, FieldDescription, FieldError, FieldLabel } from '#/components/ui/field'
import { Input } from '#/components/ui/input'
import { ConfigAdvanced, configSchemaAdvanced } from '#/config'
import { zodResolver } from "@hookform/resolvers/zod"
import { WarningCircleIcon } from '@phosphor-icons/react'
import { createFileRoute, getRouteApi } from '@tanstack/react-router'
import { Controller, SubmitHandler, useForm } from "react-hook-form"
import { Fragment, useState } from 'react'

export const Route = createFileRoute('/_app/settings/advanced')({
    component: RouteComponent,
})

const settingsRoute = getRouteApi('/_app/settings')

function RouteComponent() {
    const config = settingsRoute.useLoaderData()
    const save = useUpdateConfig()
    const {
        control,
        handleSubmit,
        reset,
        formState: { errors, isDirty },
    } = useForm<ConfigAdvanced>({
        defaultValues: {
            port: config.port,
            tld: config.tld,
        },
        resolver: zodResolver(configSchemaAdvanced),
    })

    const onSubmit: SubmitHandler<ConfigAdvanced> = (values) => save.mutate(
        { ...config, ...values },
        { onSuccess: () => reset(values) },
    )

    return (
        <Fragment>
            <SettingsForm
                title='Advanced Settings'
                onSubmit={handleSubmit(onSubmit)}
                isDirty={isDirty}
                isPending={save.isPending}
                error={save.error}
            >
                <Alert variant="destructive">
                    <WarningCircleIcon />
                    <AlertDescription>
                        Do not change settings on this page unless you know what you're doing!
                    </AlertDescription>
                </Alert>
                <Field>
                    <FieldLabel>
                        Port
                    </FieldLabel>
                    <Controller
                        control={control}
                        name='port'
                        render={({ field }) => (
                            <Input
                                type='number'
                                min={1}
                                max={65535}
                                {...field}
                                onChange={(e) => field.onChange(e.target.valueAsNumber)}
                            />
                        )}
                    />
                    <FieldDescription>
                        Local port the DNS forwarder listens on
                    </FieldDescription>
                    {errors.port && <FieldError>{errors.port.message}</FieldError>}
                </Field>
                <Field>
                    <FieldLabel>
                        Domain
                        <TldInfo />
                    </FieldLabel>
                    <Controller
                        control={control}
                        name='tld'
                        render={({ field }) => <Input {...field} />}
                    />
                    <FieldDescription>
                        Names below this domain are resolved through the forwarder
                    </FieldDescription>
                    {errors.tld && <FieldError>{errors.tld.message}</FieldError>}
                </Field>
            </SettingsForm>

            <ResetCard />
        </Fragment>
    )
}

function ResetCard() {
    const resetApp = useResetApp()
    const [confirming, setConfirming] = useState(false)

    return (
        <Card className='max-w-sm mx-auto mt-8'>
            <CardHeader>
                <CardTitle>
                    Reset application
                </CardTitle>
            </CardHeader>
            <CardContent className='flex flex-col gap-4'>
                <p>
                    Reset the application and delete all configuration and data.
                    This cannot be undone!
                </p>

                {confirming ? (
                    <div className='flex gap-2'>
                        <Button
                            variant="outline"
                            className='flex-1'
                            disabled={resetApp.isPending}
                            onClick={() => setConfirming(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            className='flex-1'
                            disabled={resetApp.isPending}
                            onClick={() => resetApp.mutate()}
                        >
                            Yes, reset
                        </Button>
                    </div>
                ) : (
                    <Button variant="destructive" onClick={() => setConfirming(true)}>
                        Reset
                    </Button>
                )}

                {resetApp.error && (
                    <p className='text-sm text-destructive'>
                        {resetApp.error.message}
                    </p>
                )}
            </CardContent>
        </Card>
    )
}
