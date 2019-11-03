const isEqual = require('lodash.isequal');

import Countdown from './Countdown';
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
  readonly key?: React.Key;
  readonly controlled?: boolean;
  readonly intervalDelay?: number;
  readonly precision?: number;
  readonly autoStart?: boolean;
  readonly children?: React.ReactElement<any>;
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

  mounted = false;
  interval: number | undefined;
  api: CountdownApi | undefined;

  constructor(props: CountdownProps, stateUpdater: StateUpdaterFn) {
    this.props = this.computeProps(props);
    this.state = {
      timeDelta: this.calcTimeDelta(),
      offsetStart: props.autoStart ? 0 : this.calcOffsetStart(),
      offsetTime: 0,
    };
    this.stateUpdater = stateUpdater;
  }

  mount = (): void => {
    this.mounted = true;
    this.props.autoStart && this.start();
    this.props.onMount && this.props.onMount(this.calcTimeDelta());
  };

  update = (props: CountdownProps): boolean => {
    const nextProps = this.computeProps(props);

    if (nextProps.pure && !isEqual(nextProps, this.computeProps(this.props))) {
      this.setProps(nextProps);
      this.setTimeDeltaState(this.calcTimeDelta());
      return true;
    }

    return false;
  };

  unmount = (): void => {
    this.mounted = false;
    this.clearInterval();
  };

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
        offsetTime: offsetTime + (offsetStart ? this.calcOffsetStart() - offsetStart : 0),
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

  clearInterval(): void {
    window.clearInterval(this.interval);
  }

  computeProps(props: CountdownProps): CountdownProps {
    return {
      ...timeDeltaFormatOptionsDefaults,
      controlled: false,
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

  getApi = (): CountdownApi => {
    return (this.api = this.api || {
      start: this.start,
      pause: this.pause,
      isPaused: this.isPaused,
      isCompleted: this.isCompleted,
    });
  };

  getRenderProps = (): CountdownRenderProps => {
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
    state: (Partial<CountdownState> | (prevState: CountdownState) => Partial<CountdownState>),
    callback?: () => void
  ): void => {
    this.state = {
      ...this.state,
      ...(typeof state === 'function' ? state(this.state) : state),
    };

    this.stateUpdater(this.state, callback);
  }
}
