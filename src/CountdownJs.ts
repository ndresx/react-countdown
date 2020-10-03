import Countdown from './Countdown';
import {
  calcTimeDelta,
  CountdownTimeDelta,
  CountdownTimeDeltaFormatted,
  CountdownTimeDeltaFormatOptions,
  timeDeltaFormatOptionsDefaults,
  formatTimeUnits,
} from './utils';

export interface CountdownProps extends React.Props<Countdown>, CountdownTimeDeltaFormatOptions {
  readonly date: Date | number | string;
  readonly key?: React.Key;
  readonly controlled?: boolean;
  readonly raf?: boolean;
  readonly intervalDelay?: number;
  readonly unit?: 'd' | 'h' | 'm' | 's' | 'ms';
  readonly precision?: number;
  readonly autoStart?: boolean;
  readonly children?: React.ReactElement<unknown>;
  readonly renderer?: (props: CountdownRenderProps) => React.ReactNode;
  readonly now?: () => number;
  readonly pure?: boolean;
  readonly onMount?: CountdownTimeDeltaFn;
  readonly onStart?: CountdownTimeDeltaFn;
  readonly onPause?: CountdownTimeDeltaFn;
  readonly onTick?: CountdownTimeDeltaFn;
  readonly onComplete?: CountdownTimeDeltaFn;
}

export interface CountdownRenderProps extends CountdownTimeDelta {
  readonly api: CountdownApi;
  readonly props: CountdownProps;
  readonly formatted: CountdownTimeDeltaFormatted;
}

export type CountdownTimeDeltaFn = (timeDelta: CountdownTimeDelta) => void;

export interface CountdownState {
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

  constructor(props: CountdownProps, stateUpdater: StateUpdaterFn) {
    this.props = this.computeProps(props);
    this.state = {
      timeDelta: this.calcTimeDelta(),
      offsetStart: this.props.autoStart ? 0 : this.calcOffsetStart(),
      offsetTime: 0,
    };
    this.stateUpdater = stateUpdater;
  }

  init = (): void => {
    this.initialized = true;
    this.props.autoStart && this.start();
    this.props.onMount && this.props.onMount(this.calcTimeDelta());
  };

  update = (props: CountdownProps): boolean => {
    const nextProps = this.computeProps(props);

    if (nextProps.pure && !this.shallowCompareProps(nextProps, this.computeProps(this.props))) {
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
    const { onTick } = this.props;
    const timeDelta = this.calcTimeDelta();

    this.setTimeDeltaState(timeDelta);

    if (onTick && timeDelta.total > 0) {
      onTick(timeDelta);
    }
  };

  rafTick = (): void => {
    this.tick();

    if (this.timer) {
      this.timer = requestAnimationFrame(this.rafTick);
    }
  };

  calcTimeDelta(): CountdownTimeDelta {
    const { date, now, unit, precision, controlled } = this.props;
    return calcTimeDelta(date, {
      now,
      unit,
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
        offsetTime: offsetTime + (offsetStart ? this.calcOffsetStart() - offsetStart : 0),
      }),
      () => {
        const timeDelta = this.calcTimeDelta();
        this.setTimeDeltaState(timeDelta);
        this.props.onStart && this.props.onStart(timeDelta);

        if (!this.props.controlled) {
          this.timer = this.startTimer();
        }
      }
    );
  };

  pause = (): void => {
    this.clearTimer();
    this.setState({ offsetStart: this.calcOffsetStart() }, () => {
      const timeDelta = this.calcTimeDelta();
      this.setTimeDeltaState(timeDelta);
      this.props.onPause && this.props.onPause(timeDelta);
    });
  };

  startTimer(): number {
    this.clearTimer();
    return this.props.raf
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

    if (!this.isCompleted() && timeDelta.completed) {
      this.clearTimer();

      callback = (): void => this.props.onComplete && this.props.onComplete(timeDelta);
    }

    if (this.initialized) {
      this.setState({ timeDelta }, callback);
    }
  }

  getApi = (): CountdownApi => {
    return (this.api = this.api || {
      start: this.start,
      pause: this.pause,
      isPaused: this.isPaused,
      isCompleted: this.isCompleted,
    });
  };

  getRenderProps = (): CountdownRenderProps => {
    const { zeroPadTime, zeroPadDays } = this.props;
    const { timeDelta } = this.state;
    return {
      ...timeDelta,
      api: this.getApi(),
      props: this.props,
      formatted: formatTimeUnits(timeDelta, {
        zeroPadTime,
        zeroPadDays,
      }),
    };
  };

  getProps = (): CountdownProps => {
    return this.props;
  };

  setProps(props: CountdownProps): void {
    this.props = this.computeProps(props);
  }

  getState = (): CountdownState => {
    return this.state;
  };

  setState = (
    state: Partial<CountdownState> | ((prevState: CountdownState) => Partial<CountdownState>),
    callback?: () => void
  ): void => {
    this.state = {
      ...this.state,
      ...(typeof state === 'function' ? state(this.state) : state),
    };

    this.stateUpdater(this.state, callback);
  };
}
