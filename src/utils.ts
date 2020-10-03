export type CountdownTimeUnit = 'd' | 'h' | 'm' | 's' | 'ms';

export interface CountdownTimeUnits<T = number> {
  readonly days: T;
  readonly hours: T;
  readonly minutes: T;
  readonly seconds: T;
  readonly milliseconds: T;
}

export interface CountdownTimeDeltaOptions {
  readonly now?: () => number;
  readonly unit?: CountdownTimeUnit;
  readonly precision?: number;
  readonly controlled?: boolean;
  readonly offsetTime?: number;
}

export interface CountdownTimeDelta extends CountdownTimeUnits {
  readonly total: number;
  readonly completed: boolean;
}

export interface CountdownTimeDeltaFormatted extends CountdownTimeUnits<string> {}

export interface CountdownTimeDeltaFormatOptions {
  readonly zeroPadDays?: number;
  readonly zeroPadTime?: number;
}

/**
 * Pads a given string or number with zeros.
 *
 * @export
 * @param {number|string} value Value to zero-pad.
 * @param {number} [length=2] Amount of characters to pad.
 * @returns Left-padded number/string.
 */
export function zeroPad(value: number | string, length: number = 2): string {
  const strValue = String(value);
  if (length === 0) return strValue;
  const match = strValue.match(/(.*?)([0-9]+)(.*)/);
  const prefix = match ? match[1] : '';
  const suffix = match ? match[3] : '';
  const strNo = match ? match[2] : strValue;
  const paddedNo =
    strNo.length >= length
      ? strNo
      : ([...Array(length)].map(() => '0').join('') + strNo).slice(length * -1);
  return `${prefix}${paddedNo}${suffix}`;
}

export const timeDeltaFormatOptionsDefaults: CountdownTimeDeltaFormatOptions = {
  zeroPadTime: 2,
};

/**
 * Calculates each time unit of a given timestamp.
 *
 * @export
 * @param {number} timestamp Timestamp of a certain point in time.
 * @returns {CountdownTimeUnits} Object that includes details about each time unit.
 */
export function calcTimeUnits(
  timestamp: number,
  unit: CountdownTimeUnit = 'h'
): CountdownTimeUnits {
  const total = timestamp / 1000;
  let days = Math.floor(total / (3600 * 24));
  let hours = Math.floor((total / 3600) % 24);
  let minutes = Math.floor((total / 60) % 60);
  let seconds = Math.floor(total % 60);
  let milliseconds = Number(((total % 1) * 1000).toFixed());
  console.log(unit);
  if (unit) {
    if (unit !== 'd') {
      hours += days * 24;
      days = 0;
    }

    if (unit !== 'd' && unit !== 'h') {
      minutes += hours * 60;
      hours = 0;
    }

    if (unit !== 'd' && unit !== 'h' && unit !== 'm') {
      seconds += minutes * 60;
      minutes = 0;
    }

    if (unit !== 'd' && unit !== 'h' && unit !== 'm' && unit !== 's') {
      milliseconds += seconds * 1000;
      seconds = 0;
    }
  }

  return {
    days,
    hours,
    minutes,
    seconds,
    milliseconds,
  };
}

/**
 * Formats a given countdown time units object.
 *
 * @export
 * @param {CountdownTimeUnits} units
 * @param {CountdownTimeDeltaFormatOptions} [options]
 * @returns {CountdownTimeDeltaFormatted} Formatted time units object.
 */
export function formatTimeUnits(
  delta: CountdownTimeUnits,
  options?: CountdownTimeDeltaFormatOptions
): CountdownTimeDeltaFormatted {
  const { days, hours, minutes, seconds, milliseconds } = delta;
  const { zeroPadTime, zeroPadDays = zeroPadTime } = {
    ...timeDeltaFormatOptionsDefaults,
    ...options,
  };

  const zeroPadLength = Math.min(2, zeroPadTime);

  return {
    days: zeroPad(days, zeroPadDays),
    hours: zeroPad(hours, zeroPadLength),
    minutes: zeroPad(minutes, zeroPadLength),
    seconds: zeroPad(seconds, zeroPadLength),
    milliseconds: zeroPad(milliseconds, zeroPadLength),
  };
}

/**
 * Calculates the time difference between a given end date and the current date.
 *
 * @export
 * @param {Date|number|string} date Date or timestamp representation of the end date.
 * @param {Object} [{ now = Date.now, precision = 0, controlled = false }={}]
 *  {function} [date=Date.now] Alternative function for returning the current date.
 *  {number} [precision=0] The precision on a millisecond basis.
 *  {boolean} [controlled=false] Defines whether the calculated value is already provided as the time difference or not.
 *  {number} [offsetTime=0] Defines the offset time that gets added to the start time; only considered if controlled is false.
 * @param {number} [precision=0] The precision on a millisecond basis.
 * @param {boolean} [controlled=false] Defines whether the calculated value is already provided as the time difference or not.
 * @returns {CountdownTimeDelta} Object that includes details about the time difference.
 */
export function calcTimeDelta(
  date: Date | string | number,
  {
    now = Date.now,
    unit = 'h',
    precision = 0,
    controlled = false,
    offsetTime = 0,
  }: CountdownTimeDeltaOptions = {}
): CountdownTimeDelta {
  let startTimestamp: number;

  if (date instanceof Date) {
    startTimestamp = date.getTime();
  } else if (typeof date === 'string') {
    startTimestamp = new Date(date).getTime();
  } else {
    startTimestamp = date;
  }

  if (!controlled) {
    startTimestamp += offsetTime;
  }

  const total = Math.round(
    parseFloat(
      (Math.max(0, controlled ? startTimestamp : startTimestamp - now()) / 1000).toFixed(
        Math.max(0, Math.min(20, precision))
      )
    ) * 1000
  );

  return {
    ...calcTimeUnits(total, unit),
    total,
    completed: total <= 0,
  };
}
