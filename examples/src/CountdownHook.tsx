import React from 'react';

import { useCountdown, CountdownProps } from 'react-countdown-now';

const CountdownHook: React.FC<CountdownProps> = props => {
  const { renderProps } = useCountdown(props);
  const { days, hours, minutes, seconds } = renderProps.formatted;
  return (
    <span>
      {days}
      {days ? ':' : ''}
      {hours}:{minutes}:{seconds}
    </span>
  );
};

export default CountdownHook;
