import React from 'react';
import PropTypes from 'prop-types';

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
  extends React.Props<Countdown>,
    CountdownTimeDeltaFormatOptions,
    Omit<LegacyCountdownProps, 'onComplete'> {
  readonly date?: Date | number | string;
  readonly controlled?: boolean;
  readonly intervalDelay?: number;
  readonly precision?: number;
  readonly autoStart?: boolean;
  readonly children?: React.ReactElement<any>;
  readonly renderer?: (props: CountdownRenderProps) => React.ReactNode;
  readonly now?: () => number;
  readonly onMount?: CountdownTimeDeltaFn;
  readonly onStart?: CountdownTimeDeltaFn;
  readonly onPause?: CountdownTimeDeltaFn;
  readonly onTick?: CountdownTimeDeltaFn;
  readonly onComplete?: CountdownTimeDeltaFn | LegacyCountdownProps['onComplete'];
  readonly className?: string;
}

export interface CountdownRenderProps extends CountdownTimeDelta {
  readonly api: CountdownApi;
  readonly props: CountdownProps;
  readonly formatted: CountdownTimeDeltaFormatted;
}

export type CountdownTimeDeltaFn = (delta: CountdownTimeDelta) => void;

interface CountdownState {
  readonly timeDelta: CountdownTimeDelta;
  readonly offsetStart: number;
  readonly offsetTime: number;
}

export interface CountdownApi {
  readonly start: () => void;
  readonly pause: () => void;
  readonly isPaused: () => boolean;
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
    children: PropTypes.element,
    renderer: PropTypes.func,
    now: PropTypes.func,
    onMount: PropTypes.func,
    onStart: PropTypes.func,
    onPause: PropTypes.func,
    onTick: PropTypes.func,
    onComplete: PropTypes.func,
    className: PropTypes.string,
  };

  mounted = false;
  interval: number | undefined;
  api: CountdownApi | undefined;

  legacyMode = false;
  legacyCountdownRef = React.createRef<LegacyCountdown>();

  constructor(props: CountdownProps) {
    super(props);

    if (props.date) {
      this.state = {
        timeDelta: this.calcTimeDelta(),
        offsetStart: props.autoStart ? 0 : this.calcOffsetStart(),
        offsetTime: 0,
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
    this.props.autoStart && this.start();
    this.props.onMount && this.props.onMount(this.calcTimeDelta());
  }

  componentDidUpdate(prevProps: CountdownProps): void {
    if (this.legacyMode) {
      return;
    }

    if (!this.shallowCompareProps(this.props, prevProps)) {
      this.setTimeDeltaState(this.calcTimeDelta());
    }
  }

  componentWillUnmount(): void {
    if (this.legacyMode) {
      return;
    }

    this.mounted = false;
    this.clearInterval();
  }

  tick = (): void => {
    const { onTick } = this.props;
    const timeDelta = this.calcTimeDelta();
    this.setTimeDeltaState(timeDelta);

    if (onTick && timeDelta.total > 0) {
      onTick(timeDelta);
    }
  };

  calcTimeDelta(): CountdownTimeDelta {
    const { date, now, precision, controlled } = this.props;
    return calcTimeDelta(date!, {
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
    this.clearInterval();
    this.setState({ offsetStart: this.calcOffsetStart() }, () => {
      const timeDelta = this.calcTimeDelta();
      this.setTimeDeltaState(timeDelta);
      this.props.onPause && this.props.onPause(timeDelta);
    });
  };

  addTime(seconds: number): void {
    this.legacyCountdownRef.current!.addTime(seconds);
  }

  clearInterval(): void {
    window.clearInterval(this.interval);
  }

  isPaused = (): boolean => {
    return this.state.offsetStart > 0;
  };

  isCompleted = (): boolean => {
    return this.state.timeDelta.completed;
  };

  shallowCompareProps(propsA: CountdownProps, propsB: CountdownProps): boolean {
    const keysA = Object.keys(propsA);
    return (
      keysA.length === Object.keys(propsB).length &&
      !keysA.some(keyA => {
        const valueA = propsA[keyA];
        const valueB = propsB[keyA];
        return (
          !propsB.hasOwnProperty(keyA) ||
          !(valueA === valueB || (valueA !== valueA && valueB !== valueB)) // NaN !== NaN
        );
      })
    );
  }

  setTimeDeltaState(timeDelta: CountdownTimeDelta): void {
    let callback;

    if (!this.state.timeDelta.completed && timeDelta.completed) {
      this.clearInterval();

      callback = () => this.props.onComplete && this.props.onComplete(timeDelta);
    }

    if (this.mounted) {
      return this.setState({ timeDelta }, callback);
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

    const { children, renderer, className } = this.props;
    const renderProps = this.getRenderProps();

    if (renderer) {
      return renderer(renderProps);
    }

    if (children && this.state.timeDelta.completed) {
      return React.cloneElement(children, { countdown: renderProps });
    }

    const { days, hours, minutes, seconds } = renderProps.formatted;
    return (
      <span className={className}>
        {days}
        {days ? ':' : ''}
        {hours}:{minutes}:{seconds}
      </span>
    );
  }
}
