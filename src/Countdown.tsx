import * as React from 'react';
import * as PropTypes from 'prop-types';

const isEqual = require('lodash.isequal');

import {
  zeroPad,
  calcTimeDelta,
  CountdownTimeDelta,
  CountdownTimeDeltaFormatted,
  CountdownTimeDeltaFormatOptions,
  timeDeltaFormatOptionsDefaults,
  formatTimeDelta,
} from './utils';

export interface CountdownProps extends React.Props<Countdown>, CountdownTimeDeltaFormatOptions {
  readonly date: Date | number | string;
  readonly controlled?: boolean;
  readonly intervalDelay?: number;
  readonly precision?: number;
  readonly children?: React.ReactElement<any>;
  readonly renderer?: ((props: CountdownRenderProps) => React.ReactNode);
  readonly now?: () => number;
  readonly onTick?: (delta: CountdownTimeDelta) => void;
  readonly onComplete?: (delta: CountdownTimeDelta) => void;
}

export interface CountdownRenderProps extends CountdownState {
  formatted: CountdownTimeDeltaFormatted;
}

interface CountdownState extends CountdownTimeDelta {}

/**
 * A customizable countdown component for React.
 *
 * @export
 * @class Countdown
 * @extends {React.Component}
 */
export default class Countdown extends React.Component<CountdownProps, CountdownState> {
  static defaultProps: Partial<CountdownProps> = {
    ...timeDeltaFormatOptionsDefaults,
    controlled: false,
    intervalDelay: 1000,
    precision: 0,
  };

  static propTypes = {
    date: PropTypes.oneOfType([PropTypes.instanceOf(Date), PropTypes.string, PropTypes.number])
      .isRequired, // eslint-disable-line react/no-unused-prop-types
    daysInHours: PropTypes.bool,
    zeroPadLength: PropTypes.number,
    controlled: PropTypes.bool,
    intervalDelay: PropTypes.number,
    precision: PropTypes.number,
    children: PropTypes.element,
    render: PropTypes.func,
    now: PropTypes.func, // eslint-disable-line react/no-unused-prop-types
    onTick: PropTypes.func,
    onComplete: PropTypes.func,
  };

  mounted = false;
  interval: number | undefined;

  constructor(props: CountdownProps) {
    super(props);
    this.state = {
      ...this.calcTimeDelta(),
    };
  }

  componentDidMount(): void {
    this.mounted = true;

    if (!this.props.controlled) {
      this.interval = window.setInterval(this.tick, this.props.intervalDelay);
    }
  }

  componentDidUpdate(prevProps: CountdownProps): void {
    if (!isEqual(this.props, prevProps)) {
      this.setTimeDeltaState(this.calcTimeDelta());
    }
  }

  componentWillUnmount(): void {
    this.mounted = false;
    this.clearInterval();
  }

  setTimeDeltaState(delta: CountdownTimeDelta): void {
    if (!this.state.completed && delta.completed) {
      this.clearInterval();

      if (this.props.onComplete) {
        this.props.onComplete(delta);
      }
    }

    if (this.mounted) {
      return this.setState({ ...delta });
    }
  }

  getRenderProps(): CountdownRenderProps {
    const { daysInHours, zeroPadLength, zeroPadDaysLength } = this.props;
    return {
      ...this.state,
      formatted: formatTimeDelta(this.state, {
        daysInHours,
        zeroPadLength,
        zeroPadDaysLength,
      }),
    };
  }

  calcTimeDelta(): CountdownTimeDelta {
    const { date, now, precision, controlled, onTick } = this.props;
    return calcTimeDelta(date, {
      now,
      precision,
      controlled,
    });
  }

  clearInterval(): void {
    window.clearInterval(this.interval);
    delete this.interval;
  }

  tick = (): void => {
    const { onTick } = this.props;
    const delta = this.calcTimeDelta();

    this.setTimeDeltaState({ ...delta });

    if (onTick && delta.total > 0) {
      onTick(delta);
    }
  };

  render(): React.ReactNode {
    const { children, renderer } = this.props;
    const renderProps = this.getRenderProps();

    if (renderer) {
      return renderer(renderProps);
    }

    if (children && this.state.completed) {
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
