import React, { Component } from 'react';

import Countdown, { CountdownApi } from 'react-countdown-now';

export default class CountdownApiExample extends Component {
  countdownApi: CountdownApi | null = null;
  state = { date: Date.now() + 10000 };

  handleStartClick = (): void => {
    this.countdownApi && this.countdownApi.start();
  };

  handlePauseClick = (): void => {
    this.countdownApi && this.countdownApi.pause();
  };

  handleResetClick = (): void => {
    this.setState({ date: Date.now() + 10000 });
  };

  handleUpdate = (): void => {
    this.forceUpdate();
  };

  setRef = (countdown: Countdown | null): void => {
    if (countdown) {
      this.countdownApi = countdown.getApi();
    }
  };

  isPaused(): boolean {
    return !!(this.countdownApi && this.countdownApi.isPaused());
  }

  isCompleted(): boolean {
    return !!(this.countdownApi && this.countdownApi.isCompleted());
  }

  render() {
    return (
      <>
        <h3>Countdown with Start, Pause and Reset Controls</h3>
        <Countdown
          key={this.state.date}
          ref={this.setRef}
          date={this.state.date}
          onMount={this.handleUpdate}
          onStart={this.handleUpdate}
          onPause={this.handleUpdate}
          onComplete={this.handleUpdate}
          autoStart={false}
        />
        <div>
          <button
            type="button"
            onClick={this.handleStartClick}
            disabled={!this.isPaused() || this.isCompleted()}
          >
            Start
          </button>{' '}
          <button
            type="button"
            onClick={this.handlePauseClick}
            disabled={this.isPaused() || this.isCompleted()}
          >
            Pause
          </button>{' '}
          <button type="button" onClick={this.handleResetClick}>
            Reset
          </button>
        </div>
      </>
    );
  }
}
