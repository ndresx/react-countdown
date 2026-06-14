import * as React from 'react';
import { useImperativeHandle } from 'react';

import { CountdownApi, CountdownProps } from './CountdownJs';
import useCountdown from './useCountdown';

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
  const renderProps = useCountdown(props);

  // Expose the control API on the ref as `ref.current.api`.
  useImperativeHandle(ref, () => ({ api: renderProps.api }), [renderProps.api]);

  const { renderer } = props;

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
