import * as React from 'react';
import * as PropTypes from 'prop-types';

const isEqual = require('lodash.isequal');

import {
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
  readonly autoStart?: boolean;
  readonly children?: React.ReactElement<any>;
  readonly renderer?: ((props: CountdownRenderProps) => React.ReactNode);
  readonly now?: () => number;
  readonly onMount?: (delta: CountdownTimeDelta) => void;
  readonly onStart?: (delta: CountdownTimeDelta) => void;
  readonly onPause?: (delta: CountdownTimeDelta) => void;
  readonly onTick?: (delta: CountdownTimeDelta) => void;
  readonly onComplete?: (delta: CountdownTimeDelta) => void;
}

export interface CountdownRenderProps extends CountdownTimeDelta {
  readonly api: CountdownApi;
  readonly formatted: CountdownTimeDeltaFormatted;
}

interface CountdownState {
  readonly timeDelta: CountdownTimeDelta;
  readonly offsetStart: number;
  readonly offsetTime: number;
}

interface CountdownApi {
  readonly start: () => void;
  readonly pause: () => void;
  readonly isPaused: () => void;
  readonly isCompleted: () => void;
}

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
    autoStart: true,
  };

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
    render: PropTypes.func,
    now: PropTypes.func,
    onMount: PropTypes.func,
    onStart: PropTypes.func,
    onPause: PropTypes.func,
    onTick: PropTypes.func,
    onComplete: PropTypes.func,
  };

  mounted = false;
  interval: number | undefined;
  api: CountdownApi;

  constructor(props: CountdownProps) {
    super(props);
    this.state = {
      timeDelta: this.calcTimeDelta(),
      offsetStart: props.autoStart ? 0 : this.calcOffsetStart(),
      offsetTime: 0,
    };
  }

  componentDidMount(): void {
    this.mounted = true;
    this.props.autoStart && this.start();
    this.props.onMount && this.props.onMount(this.calcTimeDelta());
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

  tick = (): void => {
    const { onTick } = this.props;
    const delta = this.calcTimeDelta();

    this.setTimeDeltaState({ ...delta });

    if (onTick && delta.total > 0) {
      onTick(delta);
    }
  };

  calcTimeDelta(): CountdownTimeDelta {
    const { date, now, precision, controlled } = this.props;
    return calcTimeDelta(date, {
      now,
      precision,
      controlled,
      offsetTime: this.state ? this.state.offsetTime : 0,
    });
  }

  calcOffsetStart(): number {
    return Date.now();
  }

  start = (): void => {
    this.setState(
      ({ offsetStart, offsetTime }: CountdownState) => ({
        offsetStart: 0,
        offsetTime: offsetTime + (offsetStart ? Date.now() - offsetStart : 0),
      }),
      () => {
        const timeDelta = this.calcTimeDelta();
        this.setTimeDeltaState(timeDelta);
        this.props.onStart && this.props.onStart(timeDelta);

        if (!this.props.controlled) {
          this.clearInterval();
          this.interval = window.setInterval(this.tick, this.props.intervalDelay);
        }
      }
    );
  };

  pause = (): void => {
    this.setState({ offsetStart: this.calcOffsetStart() }, () => {
      this.clearInterval();
      this.props.onPause && this.props.onPause(this.calcTimeDelta());
    });
  };

  clearInterval(): void {
    window.clearInterval(this.interval);
  }

  isPaused = (): boolean => {
    return this.state.offsetStart > 0;
  };

  isCompleted = (): boolean => {
    return this.state.timeDelta.completed;
  };

  setTimeDeltaState(delta: CountdownTimeDelta): void {
    let callback;

    if (!this.state.timeDelta.completed && delta.completed) {
      this.clearInterval();

      callback = () => this.props.onComplete && this.props.onComplete(delta);
    }

    if (this.mounted) {
      return this.setState({ timeDelta: delta }, callback);
    }
  }

  getApi(): CountdownApi {
    return (this.api = this.api || {
      start: this.start,
      pause: this.pause,
      isPaused: this.isPaused,
      isCompleted: this.isCompleted,
    });
  }

  getRenderProps(): CountdownRenderProps {
    const { daysInHours, zeroPadTime, zeroPadDays } = this.props;
    const { timeDelta } = this.state;
    return {
      ...timeDelta,
      api: this.getApi(),
      formatted: formatTimeDelta(timeDelta, {
        daysInHours,
        zeroPadTime,
        zeroPadDays,
      }),
    };
  }

  render(): React.ReactNode {
    const { children, renderer } = this.props;
    const renderProps = this.getRenderProps();

    if (renderer) {
      return renderer(renderProps);
    }

    if (children && this.state.timeDelta.completed) {
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
