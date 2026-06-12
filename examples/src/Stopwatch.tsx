import React from 'react';

import Countdown, { CountdownRendererFn } from 'react-countdown';

interface StopwatchExampleState {
  readonly date: number;
}

/**
 * A stopwatch is just an `overtime` countdown that starts at `now`: the delta
 * immediately crosses zero and keeps ticking, so the elapsed time counts up.
 *
 * `formatted` is derived from the absolute value of the delta, so rendering it
 * (instead of the default renderer, which prefixes a `-` once `total` goes
 * negative) reads as a normal count-up timer. `daysInHours` folds days into the
 * hours field for a classic HH:MM:SS display.
 */
export default class StopwatchExample extends React.Component<unknown, StopwatchExampleState> {
  state = { date: Date.now() };

  handleResetClick = (): void => {
    this.setState({ date: Date.now() });
  };

  renderer: CountdownRendererFn = ({ api, formatted }) => {
    const { hours, minutes, seconds } = formatted;
    return (
      <div>
        <span>
          {hours}:{minutes}:{seconds}
        </span>
        <div>
          <button type="button" onClick={api.start} disabled={api.isStarted()}>
            Start
          </button>{' '}
          <button type="button" onClick={api.pause} disabled={api.isPaused() || api.isStopped()}>
            Pause
          </button>{' '}
          <button type="button" onClick={api.stop} disabled={api.isStopped()}>
            Stop
          </button>{' '}
          <button type="button" onClick={this.handleResetClick}>
            Reset
          </button>
        </div>
      </div>
    );
  };

  render(): React.ReactNode {
    return (
      <Countdown
        date={this.state.date}
        autoStart={false}
        overtime
        daysInHours
        renderer={this.renderer}
      />
    );
  }
}
