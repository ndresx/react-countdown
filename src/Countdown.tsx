import * as React from 'react';
import * as PropTypes from 'prop-types';

import LegacyCountdown, { CountdownProps as LegacyCountdownProps } from './LegacyCountdown';

import {
  calcTimeDelta,
  CountdownTimeDelta,
  CountdownTimeDeltaFormatted,
  CountdownTimeDeltaFormatOptions,
  timeDeltaFormatOptionsDefaults,
  formatTimeDelta,
} from './utils';

export interface CountdownProps
  extends React.PropsWithoutRef<Countdown>,
    CountdownTimeDeltaFormatOptions,
    Omit<LegacyCountdownProps, 'onComplete'> {
  readonly date: Date | number | string;
  readonly controlled?: boolean;
  readonly intervalDelay?: number;
  readonly precision?: number;
  readonly autoStart?: boolean;
  readonly overtime?: boolean;
  readonly className?: string;
  readonly children?: React.ReactElement<any>;
  readonly renderer?: CountdownRendererFn;
  readonly now?: () => number;
  readonly onMount?: CountdownTimeDeltaFn;
  readonly onStart?: CountdownTimeDeltaFn;
  readonly onPause?: CountdownTimeDeltaFn;
  readonly onStop?: CountdownTimeDeltaFn;
  readonly onTick?: CountdownTimeDeltaFn;
  readonly onComplete?:
    | ((timeDelta: CountdownTimeDelta, completedOnStart: boolean) => void)
    | LegacyCountdownProps['onComplete'];
}

export interface CountdownRenderProps extends CountdownTimeDelta {
  readonly api: CountdownApi;
  readonly props: CountdownProps;
  readonly formatted: CountdownTimeDeltaFormatted;
}

export type CountdownRendererFn = (props: CountdownRenderProps) => React.ReactNode;

export type CountdownTimeDeltaFn = (timeDelta: CountdownTimeDelta) => void;

const enum CountdownStatus {
  STARTED = 'STARTED',
  PAUSED = 'PAUSED',
  STOPPED = 'STOPPED',
  COMPLETED = 'COMPLETED',
}

interface CountdownState {
  readonly timeDelta: CountdownTimeDelta;
  readonly status: CountdownStatus;
}

export interface CountdownApi {
  readonly start: () => void;
  readonly pause: () => void;
  readonly stop: () => void;
  readonly isStarted: () => boolean;
  readonly isPaused: () => boolean;
  readonly isStopped: () => boolean;
  readonly isCompleted: () => boolean;
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
    date: PropTypes.oneOfType([PropTypes.instanceOf(Date), PropTypes.string, PropTypes.number]),
    daysInHours: PropTypes.bool,
    zeroPadTime: PropTypes.number,
    zeroPadDays: PropTypes.number,
    controlled: PropTypes.bool,
    intervalDelay: PropTypes.number,
    precision: PropTypes.number,
    autoStart: PropTypes.bool,
    overtime: PropTypes.bool,
    className: PropTypes.string,
    children: PropTypes.element,
    renderer: PropTypes.func,
    now: PropTypes.func,
    onMount: PropTypes.func,
    onStart: PropTypes.func,
    onPause: PropTypes.func,
    onStop: PropTypes.func,
    onTick: PropTypes.func,
    onComplete: PropTypes.func,
  };

  mounted = false;
  interval: number | undefined;
  api: CountdownApi | undefined;

  initialTimestamp = this.calcOffsetStartTimestamp();
  offsetStartTimestamp = this.props.autoStart ? 0 : this.initialTimestamp;
  offsetTime = 0;

  legacyMode = false;
  legacyCountdownRef = React.createRef<LegacyCountdown>();

  constructor(props: CountdownProps) {
    super(props);

    if (props.date) {
      const timeDelta = this.calcTimeDelta();
      this.state = {
        timeDelta,
        status: timeDelta.completed ? CountdownStatus.COMPLETED : CountdownStatus.STOPPED,
      };
    } else {
      this.legacyMode = true;
    }
  }

  componentDidMount(): void {
    if (this.legacyMode) {
      return;
    }

    this.mounted = true;
    if (this.props.onMount) this.props.onMount(this.calcTimeDelta());
    if (this.props.autoStart) this.start();
  }

  componentDidUpdate(prevProps: CountdownProps): void {
    if (this.legacyMode) {
      return;
    }

    if (this.props.date !== prevProps.date) {
      this.initialTimestamp = this.calcOffsetStartTimestamp();
      this.offsetStartTimestamp = this.initialTimestamp;
      this.offsetTime = 0;

      this.setTimeDeltaState(this.calcTimeDelta());
    }
  }

  componentWillUnmount(): void {
    if (this.legacyMode) {
      return;
    }

    this.mounted = false;
    this.clearTimer();
  }

  tick = (): void => {
    const timeDelta = this.calcTimeDelta();
    const callback = timeDelta.completed && !this.props.overtime ? undefined : this.props.onTick;
    this.setTimeDeltaState(timeDelta, undefined, callback);
  };

  calcTimeDelta(): CountdownTimeDelta {
    const { date, now, precision, controlled, overtime } = this.props;
    return calcTimeDelta(date!, {
      now,
      precision,
      controlled,
      offsetTime: this.offsetTime,
      overtime,
    });
  }

  calcOffsetStartTimestamp(): number {
    return Date.now();
  }

  start = (): void => {
    if (this.isStarted()) return;

    const prevOffsetStartTimestamp = this.offsetStartTimestamp;
    this.offsetStartTimestamp = 0;
    this.offsetTime += prevOffsetStartTimestamp
      ? this.calcOffsetStartTimestamp() - prevOffsetStartTimestamp
      : 0;

    const timeDelta = this.calcTimeDelta();
    this.setTimeDeltaState(timeDelta, CountdownStatus.STARTED, this.props.onStart);

    if (!this.props.controlled && (!timeDelta.completed || this.props.overtime)) {
      this.clearTimer();
      this.interval = window.setInterval(this.tick, this.props.intervalDelay);
    }
  };

  pause = (): void => {
    if (this.isPaused()) return;

    this.clearTimer();
    this.offsetStartTimestamp = this.calcOffsetStartTimestamp();
    this.setTimeDeltaState(this.state.timeDelta, CountdownStatus.PAUSED, this.props.onPause);
  };

  stop = (): void => {
    if (this.isStopped()) return;

    this.clearTimer();
    this.offsetStartTimestamp = this.calcOffsetStartTimestamp();
    this.offsetTime = this.offsetStartTimestamp - this.initialTimestamp;
    this.setTimeDeltaState(this.calcTimeDelta(), CountdownStatus.STOPPED, this.props.onStop);
  };

  addTime(seconds: number): void {
    this.legacyCountdownRef.current!.addTime(seconds);
  }

  clearTimer(): void {
    window.clearInterval(this.interval);
  }

  isStarted = (): boolean => {
    return this.isStatus(CountdownStatus.STARTED);
  };

  isPaused = (): boolean => {
    return this.isStatus(CountdownStatus.PAUSED);
  };

  isStopped = (): boolean => {
    return this.isStatus(CountdownStatus.STOPPED);
  };

  isCompleted = (): boolean => {
    return this.isStatus(CountdownStatus.COMPLETED);
  };

  isStatus(status: CountdownStatus): boolean {
    return this.state.status === status;
  }

  setTimeDeltaState(
    timeDelta: CountdownTimeDelta,
    status?: CountdownStatus,
    callback?: (timeDelta: CountdownTimeDelta) => void
  ): void {
    if (!this.mounted) return;

    const completing = timeDelta.completed && !this.state.timeDelta.completed;
    const completedOnStart = timeDelta.completed && status === CountdownStatus.STARTED;

    if (completing && !this.props.overtime) {
      this.clearTimer();
    }

    const onDone = () => {
      if (callback) callback(this.state.timeDelta);

      if (this.props.onComplete && (completing || completedOnStart)) {
        this.props.onComplete(timeDelta, completedOnStart);
      }
    };

    return this.setState(prevState => {
      let newStatus = status || prevState.status;

      if (timeDelta.completed && !this.props.overtime) {
        newStatus = CountdownStatus.COMPLETED;
      } else if (!status && newStatus === CountdownStatus.COMPLETED) {
        newStatus = CountdownStatus.STOPPED;
      }

      return {
        timeDelta,
        status: newStatus,
      };
    }, onDone);
  }

  getApi(): CountdownApi {
    return (this.api = this.api || {
      start: this.start,
      pause: this.pause,
      stop: this.stop,
      isStarted: this.isStarted,
      isPaused: this.isPaused,
      isStopped: this.isStopped,
      isCompleted: this.isCompleted,
    });
  }

  getRenderProps(): CountdownRenderProps {
    const { daysInHours, zeroPadTime, zeroPadDays } = this.props;
    const { timeDelta } = this.state;
    return {
      ...timeDelta,
      api: this.getApi(),
      props: this.props,
      formatted: formatTimeDelta(timeDelta, {
        daysInHours,
        zeroPadTime,
        zeroPadDays,
      }),
    };
  }

  render(): React.ReactNode {
    if (this.legacyMode) {
      const { count, children, onComplete } = this.props;
      return (
        <LegacyCountdown
          ref={this.legacyCountdownRef}
          count={count}
          onComplete={onComplete as LegacyCountdownProps['onComplete']}
        >
          {children}
        </LegacyCountdown>
      );
    }

    const { className, overtime, children, renderer } = this.props;
    const renderProps = this.getRenderProps();

    if (renderer) {
      return renderer(renderProps);
    }

    if (children && this.state.timeDelta.completed && !overtime) {
      return React.cloneElement(children, { countdown: renderProps });
    }

    const { days, hours, minutes, seconds } = renderProps.formatted;
    return (
      <span className={className}>
        {renderProps.total < 0 ? '-' : ''}
        {days}
        {days ? ':' : ''}
        {hours}:{minutes}:{seconds}
      </span>
    );
  }
}
