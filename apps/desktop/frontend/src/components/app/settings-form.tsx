import { Button } from '#/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '#/components/ui/card'
import { FieldGroup } from '#/components/ui/field'
import * as React from 'react'

type SettingsFormProps = {
    title: string
    onSubmit: React.FormEventHandler<HTMLFormElement>
    isDirty: boolean
    isPending: boolean
    error: Error | null
    children: React.ReactNode
}

export function SettingsForm({ title, onSubmit, isDirty, isPending, error, children }: SettingsFormProps) {
    return (
        <Card className='max-w-sm mx-auto'>
            <CardHeader>
                <CardTitle>
                    {title}
                </CardTitle>
                <CardDescription>
                    Saving restarts the DNS service if it is running.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={onSubmit}>
                    <FieldGroup>
                        {children}
                    </FieldGroup>

                    <Button
                        type='submit'
                        className="mt-4 w-full"
                        disabled={!isDirty || isPending}
                    >
                        Save
                    </Button>

                    {error && (
                        <p className='mt-2 text-sm text-destructive'>
                            {error.message}
                        </p>
                    )}
                </form>
            </CardContent>
        </Card>
    )
}
