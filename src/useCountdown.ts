import { useEffect, useRef, useSyncExternalStore } from 'react';

import CountdownJs, { CountdownProps, CountdownRenderProps } from './CountdownJs';

export type UseCountdownProps = Omit<CountdownProps, 'renderer'>;

export type UseCountdownResult = CountdownRenderProps;

export default function useCountdown(props: UseCountdownProps): UseCountdownResult {
  const countdownRef = useRef<CountdownJs | null>(null);
  const resetKeyRef = useRef(props.resetKey);
  const mountedRef = useRef(false);

  // Create the instance on first render, and recreate it when `resetKey` changes (restart).
  if (!countdownRef.current || resetKeyRef.current !== props.resetKey) {
    resetKeyRef.current = props.resetKey;
    mountedRef.current = false;
    countdownRef.current = new CountdownJs(props);
  }

  const countdown = countdownRef.current;

  // Subscribe to the countdown store; re-render whenever its state changes.
  useSyncExternalStore(countdown.subscribe, countdown.getState, countdown.getState);

  useEffect(() => {
    countdown.init();
    return countdown.destroy;
  }, [countdown]);

  // Skip the run that pairs with init(); only forward genuine prop updates afterwards.
  useEffect(() => {
    if (mountedRef.current) {
      countdown.update(props);
    } else {
      mountedRef.current = true;
    }
  }, [countdown, props]);

  return countdown.getRenderProps();
}
