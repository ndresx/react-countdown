import React, { useRef } from 'react';

import { useCountdown, CountdownProps } from 'react-countdown-now';

const CountdownHook: React.FC<CountdownProps> = () => {
  const props = useRef({ date: Date.now() + 5000 });
  const { hours, minutes, seconds, api } = useCountdown(props.current);
  return <span>{api.isCompleted() ? 'Completionist!' : `${hours}:${minutes}:${seconds}`} </span>;
};

export default CountdownHook;
