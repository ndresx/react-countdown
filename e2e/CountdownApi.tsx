import * as React from 'react';

import Countdown, { CountdownRendererFn } from '../dist';

interface CountdownApiExampleState {
  readonly date: number;
}

export default class CountdownApiExample extends React.Component<
  unknown,
  CountdownApiExampleState
> {
  state = { date: Date.now() + 10000 };

  handleResetClick = (): void => {
    this.setState({ date: Date.now() + 10000 });
  };

  renderer: CountdownRendererFn = ({ api, formatted }) => {
    const { hours, minutes, seconds } = formatted;
    const completed = api.isCompleted();
    return (
      <div>
        <span>
          {hours}:{minutes}:{seconds}
        </span>
        <div>
          <button type="button" onClick={api.start} disabled={api.isStarted() || completed}>
            Start
          </button>{' '}
          <button
            type="button"
            onClick={api.pause}
            disabled={api.isPaused() || api.isStopped() || completed}
          >
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
    return <Countdown date={this.state.date} autoStart={false} renderer={this.renderer} />;
  }
}
