import React, { Component } from 'react';

import Countdown from 'react-countdown';

interface ControlledCountdownState {
  readonly date: number;
}

export default class ControlledCountdown extends Component<{}, ControlledCountdownState> {
  state = { date: 5000 };
  countdownInterval = 0;

  componentDidMount() {
    this.start();
  }

  componentWillUnmount(): void {
    this.clearInterval();
  }

  start(): void {
    this.countdownInterval = window.setInterval(() => {
      if (this.state.date <= 0) {
        return this.clearInterval();
      }

      this.setState(({ date }) => ({ date: date - 1000 }));
    }, 1000);
  }

  clearInterval(): void {
    window.clearInterval(this.countdownInterval);
  }

  render() {
    return (
      <>
        <h3>Controlled Countdown</h3>
        {this.state.date > 0 ? (
          <Countdown date={this.state.date} controlled={true} />
        ) : (
          'Completed!'
        )}
      </>
    );
  }
}
