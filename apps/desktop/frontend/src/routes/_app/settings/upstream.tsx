import { useUpdateConfig } from '#/api/config.mutation'
import { SettingsForm } from '#/components/app/settings-form'
import { Field, FieldContent, FieldDescription, FieldError, FieldLabel } from '#/components/ui/field'
import { Input } from '#/components/ui/input'
import { Switch } from '#/components/ui/switch'
import { ConfigBasic, configSchemaBasic } from '#/config'
import { zodResolver } from "@hookform/resolvers/zod"
import { createFileRoute, getRouteApi } from '@tanstack/react-router'
import { Controller, SubmitHandler, useForm } from "react-hook-form"

export const Route = createFileRoute('/_app/settings/upstream')({
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
    } = useForm<ConfigBasic>({
        defaultValues: {
            endpoint: config.endpoint,
            token: config.token,
            insecureSkipVerify: config.insecureSkipVerify,
        },
        resolver: zodResolver(configSchemaBasic),
    })

    const onSubmit: SubmitHandler<ConfigBasic> = (values) => save.mutate(
        { ...config, ...values },
        { onSuccess: () => reset(values) },
    )

    return (
        <SettingsForm
            title='Upstream Settings'
            onSubmit={handleSubmit(onSubmit)}
            isDirty={isDirty}
            isPending={save.isPending}
            error={save.error}
        >
            <Field>
                <FieldLabel>
                    Endpoint
                </FieldLabel>
                <Controller
                    control={control}
                    name='endpoint'
                    render={({ field }) => <Input type='url' {...field} />}
                />
                <FieldDescription>
                    Endpoint of your private DNS worker instance
                </FieldDescription>
                {errors.endpoint && <FieldError>{errors.endpoint.message}</FieldError>}
            </Field>
            <Field>
                <FieldLabel>
                    Authorization Token
                </FieldLabel>
                <Controller
                    control={control}
                    name='token'
                    render={({ field }) => <Input type='password' {...field} />}
                />
                <FieldDescription>
                    A token used to authenticate against the DNS worker
                </FieldDescription>
                {errors.token && <FieldError>{errors.token.message}</FieldError>}
            </Field>
            <Field orientation='horizontal'>
                <FieldContent>
                    <FieldLabel htmlFor='insecureSkipVerify'>
                        Skip TLS verification
                    </FieldLabel>
                    <FieldDescription>
                        Accept any certificate, e.g. self-signed. Only use this on networks you trust.
                    </FieldDescription>
                </FieldContent>
                <Controller
                    control={control}
                    name='insecureSkipVerify'
                    render={({ field }) => (
                        <Switch
                            id='insecureSkipVerify'
                            checked={field.value}
                            onCheckedChange={field.onChange}
                        />
                    )}
                />
            </Field>
        </SettingsForm>
    )
}
