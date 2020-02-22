import React from 'react';
import PropTypes from 'prop-types';

import CountdownJs, { CountdownProps, CountdownState, CountdownApi } from './CountdownJs';

/**
 * A customizable countdown component for React.
 *
 * @export
 * @class Countdown
 * @extends {React.Component}
 */
export default class Countdown extends React.Component<CountdownProps, CountdownState> {
  countdown: CountdownJs;

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
    pure: PropTypes.bool,
    onMount: PropTypes.func,
    onStart: PropTypes.func,
    onPause: PropTypes.func,
    onTick: PropTypes.func,
    onComplete: PropTypes.func,
  };

  constructor(props: CountdownProps) {
    super(props);
    this.countdown = new CountdownJs(this.props, (state, callback) =>
      this.setState(state, callback)
    );
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

  getApi(): CountdownApi {
    return this.countdown.getApi();
  }

  render(): React.ReactNode {
    const { children, renderer } = this.props;
    const renderProps = this.countdown.getRenderProps();

    if (renderer) {
      return renderer(renderProps);
    }

    if (children && renderProps.completed) {
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
