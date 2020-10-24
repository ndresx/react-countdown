import * as React from 'react';
import * as PropTypes from 'prop-types';

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
    overtime: PropTypes.bool,
    renderer: PropTypes.func,
    now: PropTypes.func,
    pure: PropTypes.bool,
    onMount: PropTypes.func,
    onStart: PropTypes.func,
    onPause: PropTypes.func,
    onStop: PropTypes.func,
    onTick: PropTypes.func,
    onComplete: PropTypes.func,
  };

  constructor(props: CountdownProps) {
    super(props);
    this.countdown = new CountdownJs(props, (state, callback) => this.setState(state, callback));
  }

  componentDidMount(): void {
    this.countdown.init();
  }

  componentDidUpdate(): void {
    this.countdown.update(this.props);
  }

  componentWillUnmount(): void {
    this.countdown.destroy();
  }

  getApi(): CountdownApi {
    return this.countdown.getApi();
  }

  render(): React.ReactNode {
    const { renderer } = this.props;
    const renderProps = this.countdown.getRenderProps();

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
}
