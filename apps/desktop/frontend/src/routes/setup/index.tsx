import { useUpdateConfig } from '#/api/config.mutation'
import { AppIcon } from '#/components/app/app-icon'
import { TldInfo } from '#/components/app/tld-info'
import { Button } from '#/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '#/components/ui/card'
import { Field, FieldContent, FieldDescription, FieldError, FieldGroup, FieldLabel } from '#/components/ui/field'
import { Input } from '#/components/ui/input'
import { Switch } from '#/components/ui/switch'
import { toast } from '#/components/ui/toast'
import { Config, configSchema } from '#/config'
import { UpstreamService } from '#bindings/internal/service'
import { zodResolver } from "@hookform/resolvers/zod"
import { CheckCircleIcon, HandWavingIcon } from '@phosphor-icons/react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import * as React from 'react'
import { Control, Controller, FieldErrors, useForm } from "react-hook-form"

export const Route = createFileRoute('/setup/')({
  component: RouteComponent,
})

type StepProps = {
    control: Control<Config>
    errors: FieldErrors<Config>
}

type Step = {
    title: string
    description: string
    content: React.ComponentType<StepProps>

    /** Fields checked against the schema before validate runs. */
    fields: Array<keyof Config>

    /**
     * Runs after the schema check passed. Return or throw an error message
     * to stay on this step.
     */
    validate?: (values: Config) => Promise<string | void> | string | void
}

const steps: Array<Step> = [
    {
        title: 'Upstream',
        description: 'Connect to your private DNS worker.',
        fields: ['endpoint', 'token', 'insecureSkipVerify'],
        content: UpstreamStep,
        async validate({ endpoint, token, insecureSkipVerify }) {
            const version = await UpstreamService.Verify(endpoint, token, insecureSkipVerify)
            toast.add({
                title: 'Connected to upstream',
                description: `DNS worker version ${version}`,
                type: 'success',
            })
        },
    },
    {
        title: 'Local resolver',
        description: 'Choose where the forwarder listens and which domain it serves.',
        fields: ['port', 'tld'],
        content: LocalStep,
    },
]

function RouteComponent() {
    const {
        control,
        getValues,
        trigger,
        formState: { errors },
    } = useForm<Config>({
        defaultValues: {
            endpoint: '',
            token: '',
            insecureSkipVerify: false,
            port: 15353,
            tld: 'home',
        },
        resolver: zodResolver(configSchema),
    })
    const save = useUpdateConfig()

    // steps.length is the success screen
    const [index, setIndex] = React.useState(-1)
    const [validating, setValidating] = React.useState(false)
    const [stepError, setStepError] = React.useState<string | null>(null)

    if (index === -1) {
        return <WelcomeScreen onBegin={() => setIndex(0)} />
    }

    if (index === steps.length) {
        return <SuccessScreen />
    }

    const step = steps[index]
    const isLast = index === steps.length - 1
    const error = stepError ?? save.error?.message
    const busy = validating || save.isPending

    async function next(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setStepError(null)
        save.reset()

        if (!await trigger(step.fields)) {
            return
        }

        const values = getValues()
        if (step.validate) {
            setValidating(true)
            try {
                const message = await step.validate(values)
                if (message) {
                    setStepError(message)
                    return
                }
            } catch (err) {
                setStepError(err instanceof Error ? err.message : String(err))
                return
            } finally {
                setValidating(false)
            }
        }

        if (isLast) {
            save.mutate(values, { onSuccess: () => setIndex(index + 1) })
        } else {
            setIndex(index + 1)
        }
    }

    function back() {
        setStepError(null)
        save.reset()
        setIndex(index - 1)
    }

    return (
        <div className="py-4">
            <AppIcon className='text-kumo-brand mx-auto mb-4' />

            <Card className='max-w-sm mx-auto'>
                <CardHeader>
                    <CardTitle>
                        {step.title}
                    </CardTitle>
                    <CardDescription>
                        Step {index + 1} of {steps.length}: {step.description}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={next}>
                        <FieldGroup>
                            <step.content control={control} errors={errors} />
                        </FieldGroup>

                        <div className='mt-4 flex gap-2'>
                            {index > 0 && (
                                <Button
                                    type='button'
                                    variant='outline'
                                    className='flex-1'
                                    disabled={busy}
                                    onClick={back}
                                >
                                    Back
                                </Button>
                            )}
                            <Button
                                type='submit'
                                className='flex-1'
                                disabled={busy}
                            >
                                {isLast ? 'Save' : 'Next'}
                            </Button>
                        </div>

                        {error && (
                            <p className='mt-2 text-sm text-destructive'>
                                {error}
                            </p>
                        )}
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}

type WelcomeScreenProps = {
    onBegin: () => void
}

function WelcomeScreen({ onBegin }: WelcomeScreenProps) {
    return (
        <div className="py-4">
            <AppIcon className='text-kumo-brand mx-auto mb-4' />

            <Card className='max-w-sm mx-auto'>
                <CardContent className='text-center gap-0 prose'>
                    <HandWavingIcon size={64} weight='duotone' className='text-kumo-brand mx-auto origin-[70%_70%] motion-safe:animate-wave' />
                    <h1>
                        Welcome
                    </h1>
                    <p>
                        We'll need to do some basic configuration before you can start
                        using the application.
                    </p>
                    <p>
                        The next few screens will guide you through the process.
                    </p>
                    <Button className='w-full' onClick={onBegin}>
                        Start Setup
                    </Button>
                </CardContent>
            </Card>
        </div>
    )
}

function UpstreamStep({ control, errors }: StepProps) {
    return (
        <React.Fragment>
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
        </React.Fragment>
    )
}

function LocalStep({ control, errors }: StepProps) {
    return (
        <React.Fragment>
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
                    Names below this domain are resolved through the forwarder. Saving asks for your password.
                </FieldDescription>
                {errors.tld && <FieldError>{errors.tld.message}</FieldError>}
            </Field>
        </React.Fragment>
    )
}

function SuccessScreen() {
    const navigate = useNavigate()

    return (
        <div className="py-4">
            <AppIcon className='text-kumo-brand mx-auto mb-4' />

            <Card className='max-w-sm mx-auto'>
                <CardContent className='flex flex-col items-center gap-4 text-center'>
                    <CheckCircleIcon size={64} weight='duotone' className='text-kumo-brand' />
                    <CardTitle>
                        Setup complete
                    </CardTitle>
                    <p className='text-sm text-muted-foreground'>
                        Your settings are saved. You can now start the DNS forwarder.
                    </p>
                    <Button className='w-full' onClick={() => navigate({ to: '/' })}>
                        Open app
                    </Button>
                </CardContent>
            </Card>
        </div>
    )
}
