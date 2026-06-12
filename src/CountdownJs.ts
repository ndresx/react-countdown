import {
  calcTimeDelta,
  CountdownTimeDelta,
  CountdownTimeDeltaFormatted,
  CountdownTimeDeltaFormatOptions,
  CountdownTimeDeltaOptions,
  timeDeltaFormatOptionsDefaults,
  formatTimeDelta,
} from './utils';

// `now`, `precision`, `controlled`, and `overtime` are shared with
// `calcTimeDelta`; reuse its options type so the two never drift. `offsetTime`
// is internal to the engine and not a public prop, hence the `Omit`.
export interface CountdownProps
  extends CountdownTimeDeltaFormatOptions, Omit<CountdownTimeDeltaOptions, 'offsetTime'> {
  readonly date: Date | number | string;
  readonly resetKey?: string | number;
  readonly intervalDelay?: number;
  readonly autoStart?: boolean;
  readonly renderer?: CountdownRendererFn;
  readonly freezeProps?: boolean;
  readonly onMount?: CountdownTimeDeltaFn;
  readonly onStart?: CountdownTimeDeltaFn;
  readonly onPause?: CountdownTimeDeltaFn;
  readonly onStop?: CountdownTimeDeltaFn;
  readonly onTick?: CountdownTimeDeltaFn;
  readonly onComplete?: (timeDelta: CountdownTimeDelta, completedOnStart: boolean) => void;
}

export interface CountdownRenderProps extends CountdownTimeDelta {
  readonly api: CountdownApi;
  readonly props: CountdownProps;
  readonly formatted: CountdownTimeDeltaFormatted;
}

export type CountdownRendererFn = (props: CountdownRenderProps) => React.ReactNode;

export type CountdownTimeDeltaFn = (timeDelta: CountdownTimeDelta) => void;

export enum CountdownStatus {
  STARTED = 'STARTED',
  PAUSED = 'PAUSED',
  STOPPED = 'STOPPED',
  COMPLETED = 'COMPLETED',
}

export interface CountdownState {
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
  readonly getStatus: () => CountdownStatus;
}

/**
 * Framework-agnostic countdown engine and external store.
 *
 * Holds all countdown logic and state, exposes a `subscribe`/`getState`/
 * `setState` store interface plus the control API, and knows nothing about
 * React. The `useCountdown` Hook is the React adapter on top of it.
 *
 * @export
 * @class CountdownJs
 */
export default class CountdownJs {
  props: CountdownProps;
  state: CountdownState;

  initialized = false;
  timerId: number | undefined;
  api: CountdownApi | undefined;

  initialTimestamp = 0;
  offsetStartTimestamp = 0;
  offsetTime = 0;

  listeners = new Set<() => void>();

  constructor(props: CountdownProps) {
    this.props = this.computeProps(props);

    this.initialTimestamp = this.calcOffsetStartTimestamp();
    this.offsetStartTimestamp = this.props.autoStart ? 0 : this.initialTimestamp;

    const timeDelta = this.calcTimeDelta();
    this.state = {
      timeDelta,
      status: timeDelta.completed ? CountdownStatus.COMPLETED : CountdownStatus.STOPPED,
    };
  }

  init = (): void => {
    this.initialized = true;
    if (this.props.onMount) this.props.onMount(this.calcTimeDelta());
    if (this.props.autoStart) this.start();
  };

  update = (props: CountdownProps): boolean => {
    const nextProps = this.computeProps(props);

    if (!nextProps.freezeProps && !this.shallowCompare(nextProps, this.props)) {
      if (this.props.date !== nextProps.date) {
        this.initialTimestamp = this.calcOffsetStartTimestamp();
        this.offsetStartTimestamp = this.initialTimestamp;
        this.offsetTime = 0;
      }

      this.props = nextProps;
      this.setTimeDeltaState(this.calcTimeDelta());
      return true;
    }

    return false;
  };

  destroy = (): void => {
    this.initialized = false;
    this.clearTimer();
  };

  tick = (): void => {
    const timeDelta = this.calcTimeDelta();
    const callback = timeDelta.completed && !this.props.overtime ? undefined : this.props.onTick;
    this.setTimeDeltaState(timeDelta, undefined, callback);
  };

  calcTimeDelta(): CountdownTimeDelta {
    const { date, now, precision, controlled, overtime } = this.props;
    return calcTimeDelta(date, {
      now,
      precision,
      controlled,
      offsetTime: this.offsetTime,
      overtime,
    });
  }

  calcOffsetStartTimestamp(): number {
    return (this.props.now ?? Date.now)();
  }

  start = (): void => {
    if (this.isStarted()) return;

    const prevOffsetStartTimestamp = this.offsetStartTimestamp;
    this.offsetStartTimestamp = 0;
    this.offsetTime += prevOffsetStartTimestamp
      ? this.calcOffsetStartTimestamp() - prevOffsetStartTimestamp
      : 0;

    const timeDelta = this.calcTimeDelta();
    this.setTimeDeltaState(timeDelta, CountdownStatus.STARTED, () => {
      if (this.props.onStart) this.props.onStart(this.state.timeDelta);

      if (!this.props.controlled && (!this.state.timeDelta.completed || this.props.overtime)) {
        this.clearTimer();
        this.startTimer();
      }
    });
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

  startTimer(): void {
    this.timerId = window.setInterval(this.tick, this.props.intervalDelay);
  }

  clearTimer(): void {
    window.clearInterval(this.timerId);
  }

  computeProps(props: CountdownProps): CountdownProps {
    return {
      ...timeDeltaFormatOptionsDefaults,
      controlled: false,
      intervalDelay: 1000,
      precision: 0,
      autoStart: true,
      overtime: false,
      freezeProps: false,
      ...props,
    };
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

  getStatus = (): CountdownStatus => {
    return this.state.status;
  };

  isStatus(status: CountdownStatus): boolean {
    return this.state.status === status;
  }

  shallowCompare(objA: object, objB: object): boolean {
    const keysA = Object.keys(objA);
    return (
      keysA.length === Object.keys(objB).length &&
      // Object.is treats NaN as equal to itself, which a plain === would not.
      !keysA.some((key) => !objB.hasOwnProperty(key) || !Object.is(objA[key], objB[key]))
    );
  }

  setTimeDeltaState(
    timeDelta: CountdownTimeDelta,
    status?: CountdownStatus,
    callback?: (timeDelta: CountdownTimeDelta) => void
  ): void {
    if (!this.initialized) return;

    const completing = timeDelta.completed && !this.state.timeDelta.completed;
    const completedOnStart = timeDelta.completed && status === CountdownStatus.STARTED;

    if (completing && !this.props.overtime) {
      this.clearTimer();
    }

    let newStatus = status || this.state.status;
    if (timeDelta.completed && !this.props.overtime) {
      newStatus = CountdownStatus.COMPLETED;
    } else if (!status && newStatus === CountdownStatus.COMPLETED) {
      newStatus = CountdownStatus.STOPPED;
    }

    this.setState({ timeDelta, status: newStatus }, () => {
      if (callback) callback(this.state.timeDelta);

      if (this.props.onComplete && (completing || completedOnStart)) {
        this.props.onComplete(timeDelta, completedOnStart);
      }
    });
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
      getStatus: this.getStatus,
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

  getProps = (): CountdownProps => {
    return this.props;
  };

  getState = (): CountdownState => {
    return this.state;
  };

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  setState = (partialState: Partial<CountdownState>, callback?: () => void): void => {
    this.state = { ...this.state, ...partialState };
    this.listeners.forEach((listener) => listener());
    if (callback) callback();
  };
}
