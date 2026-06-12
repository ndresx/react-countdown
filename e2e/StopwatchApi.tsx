import * as React from 'react';

import Countdown, { CountdownRendererFn } from '../dist/component';

interface StopwatchApiExampleState {
  readonly date: number;
}

/**
 * A stopwatch is an `overtime` countdown anchored at `now`, so the delta starts
 * at zero and counts up. `formatted` is abs-based, so rendering it reads as a
 * normal count-up timer (no leading minus sign). Pause/resume excludes the
 * paused gap, and the Clear button (`stop()`) resets the elapsed time to zero.
 */
export default class StopwatchApiExample extends React.Component<
  unknown,
  StopwatchApiExampleState
> {
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
            {api.isPaused() ? 'Resume' : 'Start'}
          </button>{' '}
          <button type="button" onClick={api.pause} disabled={api.isPaused() || api.isStopped()}>
            Pause
          </button>{' '}
          <button type="button" onClick={api.stop} disabled={api.isStopped()}>
            Clear
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
