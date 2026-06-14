import React, { useRef } from 'react';

import Countdown, { CountdownHandle } from 'react-countdown';

// Controls the countdown imperatively through a `ref`. `ref.current.api` exposes
// the same control API that is also available via the render props and the
// `useCountdown` Hook.
export default function CountdownRef(): React.ReactNode {
  const countdownRef = useRef<CountdownHandle>(null);

  return (
    <>
      <Countdown ref={countdownRef} date={Date.now() + 10000} autoStart={false} />
      <div>
        <button type="button" onClick={() => countdownRef.current?.api.start()}>
          Start
        </button>{' '}
        <button type="button" onClick={() => countdownRef.current?.api.pause()}>
          Pause
        </button>{' '}
        <button type="button" onClick={() => countdownRef.current?.api.stop()}>
          Stop
        </button>
      </div>
    </>
  );
}
