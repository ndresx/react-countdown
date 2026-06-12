import * as React from 'react';
import { useEffect, useImperativeHandle, useRef, useSyncExternalStore } from 'react';

import CountdownJs, { CountdownApi, CountdownProps } from './CountdownJs';

/**
 * The imperative handle exposed through a `ref` on `<Countdown />`.
 *
 * The countdown control API lives at `.api`, mirroring the `api` field that
 * the `renderer` render props and the `useCountdown` hook return, so the same
 * `CountdownApi` is reached the same way across every surface.
 */
export interface CountdownHandle {
  readonly api: CountdownApi;
}

/**
 * A customizable countdown component for React.
 *
 * @export
 */
function Countdown(props: CountdownProps, ref: React.Ref<CountdownHandle>): React.ReactNode {
  const countdownRef = useRef<CountdownJs | null>(null);
  const mountedRef = useRef(false);

  // Create the instance on first render. A `key` change remounts the component
  // (handled by React), which naturally gives us a fresh instance — the restart
  // mechanism, identical to the previous class component.
  if (!countdownRef.current) {
    countdownRef.current = new CountdownJs(props);
  }

  const countdown = countdownRef.current;

  // Subscribe to the countdown store; re-render whenever its state changes.
  useSyncExternalStore(countdown.subscribe, countdown.getState, countdown.getState);

  // Expose the control API directly on the ref as `ref.current.api`.
  useImperativeHandle(ref, () => ({ api: countdown.getApi() }), [countdown]);

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

  const { renderer } = props;
  const renderProps = countdown.getRenderProps();

  if (renderer) return renderer(renderProps);

  const { days, hours, minutes, seconds } = renderProps.formatted;

  return (
    <>
      {renderProps.total < 0 ? '-' : ''}
      {days}
      {days ? ':' : ''}
      {hours}:{minutes}:{seconds}
    </>
  );
}

export default React.forwardRef(Countdown);
