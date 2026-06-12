import { useEffect, useRef, useSyncExternalStore } from 'react';

import CountdownJs, { CountdownProps, CountdownRenderProps } from './CountdownJs';

export interface UseCountdownProps extends Omit<CountdownProps, 'renderer'> {}

export interface UseCountdownResult extends CountdownRenderProps {}

export default function useCountdown(props: UseCountdownProps): UseCountdownResult {
  const countdownRef = useRef<CountdownJs | null>(null);
  const keyRef = useRef(props.key);
  const mountedRef = useRef(false);

  // Create the instance on first render, and recreate it when `key` changes (restart).
  if (!countdownRef.current || keyRef.current !== props.key) {
    keyRef.current = props.key;
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
