import React, { useRef } from 'react';

import { useCountdown, CountdownProps } from '../dist';

export const CountdownHookBasicUsage: React.FC<CountdownProps> = (props) => {
  const { hours, minutes, seconds } = useCountdown(props);
  return (
    <>
      {hours}:{minutes}:{seconds}
    </>
  );
};

export const CountdownHookCompletionist: React.FC<CountdownProps> = () => {
  const props = useRef({ date: Date.now() + 5000 });
  // eslint-disable-next-line react/prop-types
  const { hours, minutes, seconds, api } = useCountdown(props.current);
  return <span>{api.isCompleted() ? 'Completionist!' : `${hours}:${minutes}:${seconds}`}</span>;
};
