import React from 'react';
import PropTypes from 'prop-types';

/**
 * Pads a given string or number with zeros.
 *
 * @param {any} value Value to zero-pad.
 * @param {number} [length=2] Amount of characters to pad.
 * @returns Left-padded string.
 */
export const zeroPad = (value, length = 2) => {
  const strValue = String(value);
  return strValue.length >= length ? strValue : ('0'.repeat(length) + strValue).slice(length * -1);
};

/**
 * Calculates the time difference between a given start date and the current date.
 *
 * @param {any} date Date or timestamp representation of the end date.
 * @param {any} [now=Date.now] Alternative function for returning the current date.
 * @param {number} [precision=0] The precision on a millisecond basis.
 * @param {boolean} [controlled=false] Defines whether the calculated value is already provided as the time difference or not.
 * @returns Object that includes details about the time difference.
 */
export const getTimeDifference = (date, now = Date.now, precision = 0, controlled = false) => {
  const startDate = typeof date === 'string' ? new Date(date) : date;
  const total = parseInt(
    (Math.max(0, controlled ? startDate : startDate - now()) / 1000).toFixed(precision) * 1000,
    10
  );

  const seconds = total / 1000;

  return {
    total,
    days: Math.floor(seconds / (3600 * 24)),
    hours: Math.floor(seconds / 3600 % 24),
    minutes: Math.floor(seconds / 60 % 60),
    seconds: Math.floor(seconds % 60),
    milliseconds: Number((seconds % 1 * 1000).toFixed()),
  };
};

export default class Countdown extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      ...getTimeDifference(props.date, props.now, props.precision, this.props.controlled),
    };
  }

  componentDidMount() {
    if (!this.props.controlled) {
      this.interval = setInterval(this.tick, this.props.intervalDelay);
    }
  }

  componentWillReceiveProps(nextProps) {
    this.setDeltaState(
      getTimeDifference(nextProps.date, nextProps.now, nextProps.precision, nextProps.controlled)
    );
  }

  componentWillUnmount() {
    this.clearInterval();
  }

  setDeltaState(delta) {
    if (this.state.total > 0 && delta.total <= 0) {
      this.clearInterval();

      if (this.props.onComplete) {
        this.props.onComplete(delta);
      }
    }

    this.setState({ ...delta });
  }

  getFormattedDelta() {
    let { days, hours } = this.state;
    const { minutes, seconds } = this.state;
    const { daysInHours, zeroPadLength } = this.props;

    if (daysInHours) {
      hours += days * 24;
      days = null;
    } else {
      days = zeroPad(days, zeroPadLength);
    }

    return {
      days,
      hours: zeroPad(hours, zeroPadLength),
      minutes: zeroPad(minutes, Math.min(2, zeroPadLength)),
      seconds: zeroPad(seconds, Math.min(2, zeroPadLength)),
    };
  }

  clearInterval() {
    clearInterval(this.interval);
    delete this.interval;
  }

  tick = () => {
    const delta = getTimeDifference(
      this.props.date,
      this.props.now,
      this.props.precision,
      this.props.controlled
    );
    this.setDeltaState({
      ...delta,
    });

    if (this.props.onTick && delta.total > 0) {
      this.props.onTick(delta);
    }
  };

  render() {
    if (this.props.renderer) {
      return this.props.renderer({ ...this.props, ...this.state });
    }

    const { days, hours, minutes, seconds } = this.getFormattedDelta();
    return <span>{days}{days ? ':' : ''}{hours}:{minutes}:{seconds}</span>;
  }
}

Countdown.propTypes = {
  date: PropTypes.oneOfType([PropTypes.instanceOf(Date), PropTypes.string, PropTypes.number])
    .isRequired, // eslint-disable-line react/no-unused-prop-types
  daysInHours: PropTypes.bool,
  zeroPadLength: PropTypes.number,
  controlled: PropTypes.bool,
  intervalDelay: PropTypes.number,
  precision: PropTypes.number,
  renderer: PropTypes.func,
  now: PropTypes.func, // eslint-disable-line react/no-unused-prop-types
  onTick: PropTypes.func,
  onComplete: PropTypes.func,
};

Countdown.defaultProps = {
  daysInHours: false,
  zeroPadLength: 2,
  controlled: false,
  intervalDelay: 1000,
  precision: 0,
};
