import { useCallback, useRef } from 'react';

/**
 * Custom hook for debouncing function calls to reduce RPC requests
 * @param callback - Function to debounce
 * @param delay - Delay in milliseconds
 * @returns Debounced function
 */
export function useDebounce<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const timeoutRef = useRef<NodeJS.Timeout>();
  const callbackRef = useRef(callback);

  // Update the callback ref when callback changes
  callbackRef.current = callback;

  const debouncedCallback = useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        callbackRef.current(...args);
      }, delay);
    },
    [delay] // Remove callback from dependencies to prevent infinite loops
  ) as T;

  return debouncedCallback;
}