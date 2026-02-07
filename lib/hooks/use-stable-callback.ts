import { useRef, useCallback, useLayoutEffect } from 'react'

/**
 * Creates a stable callback that doesn't change between renders
 * but always calls the latest version of the provided callback.
 * 
 * This is useful for event handlers that you want to pass to child
 * components without causing them to re-render when the callback changes.
 * 
 * @example
 * const handleClick = useStableCallback((id: string) => {
 *   // This function can use any props/state
 *   // but the returned callback reference never changes
 *   console.log(id, someState)
 * })
 */
export function useStableCallback<T extends (...args: any[]) => any>(callback: T): T {
    const callbackRef = useRef(callback)

    useLayoutEffect(() => {
        callbackRef.current = callback
    })

    // eslint-disable-next-line react-hooks/exhaustive-deps
    return useCallback((...args: Parameters<T>) => callbackRef.current(...args), []) as T
}
