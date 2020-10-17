import {
  calcTimeDelta,
  CountdownTimeDelta,
  CountdownTimeDeltaFormatted,
  CountdownTimeDeltaFormatOptions,
  timeDeltaFormatOptionsDefaults,
  formatTimeDelta,
} from './utils';

export interface CountdownProps extends CountdownTimeDeltaFormatOptions {
  readonly date: Date | number | string;
  readonly key?: React.Key;
  readonly controlled?: boolean;
  readonly raf?: boolean;
  readonly intervalDelay?: number;
  readonly precision?: number;
  readonly autoStart?: boolean;
  readonly overtime?: boolean;
  readonly children?: React.ReactElement<unknown>;
  readonly renderer?: CountdownRendererFn;
  readonly now?: () => number;
  readonly pure?: boolean;
  readonly onMount?: CountdownTimeDeltaFn;
  readonly onStart?: CountdownTimeDeltaFn;
  readonly onPause?: CountdownTimeDeltaFn;
  readonly onStop?: CountdownTimeDeltaFn;
  readonly onTick?: CountdownTimeDeltaFn;
  readonly onComplete?: CountdownTimeDeltaFn;
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
}

export type StateUpdaterFn = (state: CountdownState, callback?: () => void) => void;

/**
 * A customizable countdown component for React.
 *
 * @export
 * @class Countdown
 * @extends {React.Component}
 */
export default class CountdownJs {
  props: CountdownProps;
  state: CountdownState;
  stateUpdater: StateUpdaterFn;

  initialized = false;
  timer: number | undefined;
  api: CountdownApi | undefined;

  initialTimestamp = 0;
  offsetStartTimestamp = 0;
  offsetTime = 0;

  constructor(props: CountdownProps, stateUpdater: StateUpdaterFn) {
    this.props = this.computeProps(props);

    this.initialTimestamp = this.calcOffsetStartTimestamp();
    this.offsetStartTimestamp = this.props.autoStart ? 0 : this.initialTimestamp;

    const timeDelta = this.calcTimeDelta();
    this.state = {
      timeDelta,
      status: timeDelta.completed ? CountdownStatus.COMPLETED : CountdownStatus.STOPPED,
    };

    this.stateUpdater = stateUpdater;
  }

  init = (): void => {
    this.initialized = true;
    if (this.props.onMount) this.props.onMount(this.calcTimeDelta());
    if (this.props.autoStart) this.start();
  };

  update = (props: CountdownProps): boolean => {
    const nextProps = this.computeProps(props);

    if (nextProps.pure && !this.shallowCompare(nextProps, this.computeProps(this.props))) {
      if (this.props.date !== nextProps.date) {
        this.initialTimestamp = this.calcOffsetStartTimestamp();
        this.offsetStartTimestamp = this.initialTimestamp;
        this.offsetTime = 0;
      }

      this.setProps(nextProps);
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

  rafTick = (): void => {
    this.tick();

    if (this.timer) {
      this.timer = window.requestAnimationFrame(this.rafTick);
    }
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
    this.timer = this.props.raf
      ? window.requestAnimationFrame(this.rafTick)
      : window.setInterval(this.tick, this.props.intervalDelay);
  }

  clearTimer(): void {
    if (this.timer) {
      if (this.props.raf) {
        window.cancelAnimationFrame(this.timer);
      } else {
        window.clearInterval(this.timer);
      }

      this.timer = undefined;
    }
  }

  computeProps(props: CountdownProps): CountdownProps {
    return {
      ...timeDeltaFormatOptionsDefaults,
      controlled: false,
      raf: true,
      intervalDelay: 1000,
      precision: 0,
      autoStart: true,
      pure: true,
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

  isStatus(status: CountdownStatus): boolean {
    return this.state.status === status;
  }

  // eslint-disable-next-line @typescript-eslint/ban-types
  shallowCompare(objA: object, objB: object): boolean {
    const keysA = Object.keys(objA);
    return (
      keysA.length === Object.keys(objB).length &&
      !keysA.some((keyA) => {
        const valueA = objA[keyA];
        const valueB = objB[keyA];
        return (
          !objB.hasOwnProperty(keyA) ||
          !(valueA === valueB || (valueA !== valueA && valueB !== valueB)) // NaN !== NaN
        );
      })
    );
  }

  handleOnComplete = (timeDelta: CountdownTimeDelta): void => {
    if (this.props.onComplete) this.props.onComplete(timeDelta);
  };

  setTimeDeltaState(
    timeDelta: CountdownTimeDelta,
    status?: CountdownStatus,
    callback?: (timeDelta: CountdownTimeDelta) => void
  ): void {
    if (!this.initialized) return;

    let completedCallback: this['handleOnComplete'] | undefined;

    if (!this.state.timeDelta.completed && timeDelta.completed) {
      if (!this.props.overtime) this.clearTimer();
      completedCallback = this.handleOnComplete;
    }

    const onDone = () => {
      if (callback) callback(this.state.timeDelta);
      if (completedCallback) completedCallback(this.state.timeDelta);
    };

    this.setState((prevState) => {
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

  getProps = (): CountdownProps => {
    return this.props;
  };

  setProps = (props: CountdownProps): void => {
    this.props = this.computeProps(props);
  };

  getState = (): CountdownState => {
    return this.state;
  };

  setState = (
    state: (prevState: CountdownState) => Partial<CountdownState>,
    callback?: () => void
  ): void => {
    this.state = { ...this.state, ...state(this.state) };
    this.stateUpdater(this.state, callback);
  };
}
