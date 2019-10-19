import React from 'react';
import PropTypes from 'prop-types';

import CountdownJs, { CountdownProps, CountdownApi } from './CountdownJs';

/**
 * A customizable countdown component for React.
 *
 * @export
 * @class Countdown
 * @extends {React.Component}
 */
export default class Countdown extends React.Component<CountdownProps> {
  static propTypes = {
    date: PropTypes.oneOfType([PropTypes.instanceOf(Date), PropTypes.string, PropTypes.number])
      .isRequired,
    daysInHours: PropTypes.bool,
    zeroPadTime: PropTypes.number,
    zeroPadDays: PropTypes.number,
    controlled: PropTypes.bool,
    intervalDelay: PropTypes.number,
    precision: PropTypes.number,
    autoStart: PropTypes.bool,
    children: PropTypes.element,
    renderer: PropTypes.func,
    now: PropTypes.func,
    onMount: PropTypes.func,
    onStart: PropTypes.func,
    onPause: PropTypes.func,
    onTick: PropTypes.func,
    onComplete: PropTypes.func,
  };

  countdown: CountdownJs;

  constructor(props: CountdownProps) {
    super(props);
    this.countdown = new CountdownJs(this.props, this.updater);
  }

  componentDidMount(): void {
    this.countdown.mount();
  }

  componentDidUpdate(): void {
    this.countdown.update(this.props);
  }

  componentWillUnmount(): void {
    this.countdown.unmount();
  }

  updater = (callback?: () => void): void => {
    this.forceUpdate(callback);
  };

  getApi(): CountdownApi {
    return this.countdown.getApi();
  }

  render(): React.ReactNode {
    const { children, renderer } = this.props;
    const renderProps = this.countdown.getRenderProps();

    if (renderer) {
      return renderer(renderProps);
    }

    if (children && this.countdown.getState().timeDelta.completed) {
      return React.cloneElement(children, { countdown: renderProps });
    }

    const { days, hours, minutes, seconds } = renderProps.formatted;
    return (
      <span>
        {days}
        {days ? ':' : ''}
        {hours}:{minutes}:{seconds}
      </span>
    );
  }
}
