import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * A small explicit state machine for async work. The four states are mutually
 * exclusive, so the UI can never show a spinner and an error at the same time.
 *
 * idle -> loading -> success
 *                 -> error
 *
 * This replaces the common pattern of separate loading, error, and data
 * booleans, which is easy to get out of sync and hard for a new developer or an
 * agent to reason about.
 */
export type AsyncState<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; error: unknown; message: string };

export type AsyncResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: unknown; message: string };

type Options = {
  errorMessage?: (error: unknown) => string;
};

function defaultErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Something went wrong.';
}

export function useAsyncAction<TArgs extends unknown[], TResult>(
  action: (...args: TArgs) => Promise<TResult>,
  options?: Options,
) {
  const [state, setState] = useState<AsyncState<TResult>>({ status: 'idle' });

  // Keep the latest options without making the run callback unstable. Event
  // handlers depend on run, and an unstable callback would make every render
  // look like a new action to the rest of the component.
  const optionsRef = useRef(options);
  useEffect(() => {
    optionsRef.current = options;
  }, [options]);

  const run = useCallback(
    async (...args: TArgs): Promise<AsyncResult<TResult>> => {
      setState({ status: 'loading' });

      try {
        const data = await action(...args);
        setState({ status: 'success', data });
        return { ok: true, data };
      } catch (error) {
        const message =
          optionsRef.current?.errorMessage?.(error) ?? defaultErrorMessage(error);
        setState({ status: 'error', error, message });
        return { ok: false, error, message };
      }
    },
    [action],
  );

  const reset = useCallback(() => setState({ status: 'idle' }), []);

  return {
    state,
    run,
    reset,
    isIdle: state.status === 'idle',
    isLoading: state.status === 'loading',
    isSuccess: state.status === 'success',
    isError: state.status === 'error',
    data: state.status === 'success' ? state.data : null,
    error: state.status === 'error' ? state.message : null,
    rawError: state.status === 'error' ? state.error : null,
  };
}
