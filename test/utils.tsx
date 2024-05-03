import { act, fireEvent, render } from '@testing-library/react'
import { expect, vi } from 'vitest'

export const mockConsoleForHydrationErrors = () => {
    vi.spyOn(console, 'error').mockImplementation(() => { })
    return () => {
        // It should not have any hydration warnings.
        expect(
            // @ts-expect-error
            console.error.mock.calls.find(([err]) => {
                return (
                    err?.message?.includes(
                        'Text content does not match server-rendered HTML.'
                    ) ||
                    err?.message?.includes(
                        'Hydration failed because the initial UI does not match what was rendered on the server.'
                    )
                )
            })
        ).toBeFalsy()

        // @ts-expect-error
        console.error.mockRestore()
    }
}
export function sleep(time: number) {
    return new Promise<void>(resolve => setTimeout(resolve, time))
}
export const nextTick = () => act(() => sleep(1))
