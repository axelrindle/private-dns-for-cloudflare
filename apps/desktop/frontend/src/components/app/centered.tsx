import { PropsWithChildren } from 'react'

export function Centered({ children }: PropsWithChildren) {
    return (
        <div className='max-w-md mx-auto flex flex-col items-center gap-y-8 py-8'>
            {children}
        </div>
    )
}
