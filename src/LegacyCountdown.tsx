import React from 'react';
import PropTypes from 'prop-types';

export interface CountdownProps {
  readonly count?: number;
  readonly children?: React.ReactElement<any>;
  readonly onComplete?: () => void;
}

interface CountdownState {
  readonly count: number;
}

export default class Countdown extends React.Component<CountdownProps, CountdownState> {
  static propTypes = {
    count: PropTypes.number,
    children: PropTypes.element,
    onComplete: PropTypes.func,
  };

  state: CountdownState = { count: this.props.count || 3 };
  interval: number | undefined;

  addTime = (seconds: number): void => {
    this.stopCountdown();
    this.setState(prevState => ({ count: prevState.count + seconds }), this.startCountdown);
  };

  startCountdown = (): void => {
    this.interval = window.setInterval(() => {
      const count = this.state.count - 1;

      if (count === 0) {
        this.stopCountdown();
        this.props.onComplete && this.props.onComplete();
      } else {
        this.setState({ count });
      }
    }, 1000);
  };

  stopCountdown(): void {
    clearInterval(this.interval);
  }

  componentDidMount(): void {
    this.startCountdown();
  }

  componentWillUnmount(): void {
    clearInterval(this.interval);
  }

  render(): React.ReactNode {
    return this.props.children
      ? React.cloneElement(this.props.children, {
          count: this.state.count,
        })
      : null;
  }
}
