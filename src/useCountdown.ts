import { useState, useMemo, useEffect } from 'react';

import CountdownJs, { CountdownProps, CountdownApi, CountdownRenderProps } from './CountdownJs';

export interface UseCountdownProps extends Omit<CountdownProps, 'children' | 'renderer'> {}

export interface UseCountdownResult {
  readonly countdown: CountdownJs;
  readonly api: CountdownApi;
  readonly renderProps: CountdownRenderProps;
}

export default function useCountdown(props: UseCountdownProps): UseCountdownResult {
  const [, forceUpdate] = useState({});
  const countdown = useMemo(
    () =>
      new CountdownJs(props, callback => {
        forceUpdate({});
        callback && callback();
      }),
    []
  );

  useEffect(() => {
    countdown.mount();
    return countdown.unmount;
  }, []);

  useEffect(() => {
    countdown.update(props);
  }, [props]);

  return {
    countdown,
    api: countdown.getApi(),
    renderProps: countdown.getRenderProps(),
  };
}
