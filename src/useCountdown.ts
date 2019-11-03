import { useState, useEffect, useRef } from 'react';

import CountdownJs, { CountdownProps, CountdownRenderProps, CountdownState } from './CountdownJs';

export interface UseCountdownProps extends Omit<CountdownProps, 'children' | 'renderer'> {}

export interface UseCountdownResult extends CountdownRenderProps {}

export default function useCountdown(props: UseCountdownProps): UseCountdownResult {
  const [, setState] = useState<Partial<CountdownState>>({});
  const countdownObj = useRef<CountdownJs | null>(null);
  const firstRun = useRef(false);
  const key = useRef(props.key);

  if (!countdownObj.current || key.current !== props.key) {
    if (countdownObj.current) {
      key.current = props.key;
      firstRun.current = false;
    }

    countdownObj.current = new CountdownJs({ ...props }, (state, callback) => {
      setState(state);
      callback && callback();
    });
  }

  const countdown = countdownObj.current as CountdownJs;

  useEffect(() => {
    countdown.mount();

    return () => {
      countdown.unmount();
    };
  }, [countdown]);

  useEffect(() => {
    if (firstRun.current) {
      countdown.update(props);
    } else {
      firstRun.current = true;
    }
  }, [props]);

  return countdown.getRenderProps();
}
