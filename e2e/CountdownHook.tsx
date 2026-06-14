import React, { useRef } from 'react';

import { useCountdown, UseCountdownProps } from '../dist/hook';

export const CountdownHookBasicUsage: React.FC<UseCountdownProps> = (props) => {
  const { hours, minutes, seconds } = useCountdown(props);
  return (
    <>
      {hours}:{minutes}:{seconds}
    </>
  );
};

export const CountdownHookCompletionist: React.FC<UseCountdownProps> = () => {
  const props = useRef({ date: Date.now() + 5000 });
  const { hours, minutes, seconds, api } = useCountdown(props.current);
  return <span>{api.isCompleted() ? 'Completionist!' : `${hours}:${minutes}:${seconds}`}</span>;
};
