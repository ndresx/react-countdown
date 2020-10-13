export interface CountdownTimeDeltaOptions {
  readonly now?: () => number;
  readonly precision?: number;
  readonly controlled?: boolean;
  readonly offsetTime?: number;
  readonly overtime?: boolean;
}

export interface CountdownTimeDelta extends CountdownTimeUnits {
  readonly total: number;
  readonly completed: boolean;
}

export interface CountdownTimeUnits<T = number> {
  readonly days: T;
  readonly hours: T;
  readonly minutes: T;
  readonly seconds: T;
  readonly milliseconds: T;
}

export interface CountdownTimeDeltaFormatted
  extends Omit<CountdownTimeUnits<string>, 'milliseconds'> {}

export interface CountdownTimeDeltaFormatOptions {
  readonly daysInHours?: boolean;
  readonly zeroPadTime?: number;
  readonly zeroPadDays?: number;
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
  daysInHours: false,
  zeroPadTime: 2,
};

/**
 * Calculates each time unit of a given timestamp.
 *
 * @export
 * @param {number} timestamp Timestamp of a certain point in time.
 * @returns {CountdownTimeUnits} Object that includes details about each time unit.
 */
export function calcTimeUnits(timestamp: number): CountdownTimeUnits {
  const seconds = timestamp / 1000;

  return {
    days: Math.floor(seconds / (3600 * 24)),
    hours: Math.floor((seconds / 3600) % 24),
    minutes: Math.floor((seconds / 60) % 60),
    seconds: Math.floor(seconds % 60),
    milliseconds: Number(((seconds % 1) * 1000).toFixed()),
  };
}

/**
 * Calculates the time difference between a given end date and the current date.
 *
 * @export
 * @param {Date|number|string} date Date or timestamp representation of the end date.
 * @param {CountdownTimeDeltaOptions} [options]
 *  {function} [now=Date.now] Alternative function for returning the current date.
 *  {number} [precision=0] The precision on a millisecond basis.
 *  {boolean} [controlled=false] Defines whether the calculated value is already provided as the time difference or not.
 *  {number} [offsetTime=0] Defines the offset time that gets added to the start time; only considered if controlled is false.
 *  {boolean} [overtime=false] Defines whether the time delta can go into overtime and become negative or not.
 * @returns Time delta object that includes details about the time difference.
 */
export function calcTimeDelta(
  date: Date | string | number,
  options: CountdownTimeDeltaOptions = {}
): CountdownTimeDelta {
  const { now = Date.now, precision = 0, controlled, offsetTime = 0, overtime } = options;
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

  const timeLeft = controlled ? startTimestamp : startTimestamp - now();
  const clampedPrecision = Math.min(20, Math.max(0, precision));
  const total = Math.round(
    parseFloat(((overtime ? timeLeft : Math.max(0, timeLeft)) / 1000).toFixed(clampedPrecision)) *
      1000
  );

  return {
    ...calcTimeUnits(Math.abs(total)),
    total,
    completed: total <= 0,
  };
}

/**
 * Formats a given countdown time delta object.
 *
 * @export
 * @param {CountdownTimeDelta} timeDelta The time delta object to be formatted.
 * @param {CountdownTimeDeltaFormatOptions} [options]
 *  {boolean} [daysInHours=false] Days are calculated as hours.
 *  {number} [zeroPadTime=2] Length of zero-padded output, e.g.: 00:01:02
 *  {number} [zeroPadDays=zeroPadTime] Length of zero-padded days output, e.g.: 01
 * @returns {CountdownTimeDeltaFormatted} Formatted time delta object.
 */
export function formatTimeDelta(
  timeDelta: CountdownTimeDelta,
  options?: CountdownTimeDeltaFormatOptions
): CountdownTimeDeltaFormatted {
  const { days, hours, minutes, seconds } = timeDelta;
  const { daysInHours, zeroPadTime, zeroPadDays = zeroPadTime } = {
    ...timeDeltaFormatOptionsDefaults,
    ...options,
  };

  const zeroPadTimeLength = Math.min(2, zeroPadTime);
  const formattedHours = daysInHours
    ? zeroPad(hours + days * 24, zeroPadTime)
    : zeroPad(hours, zeroPadTimeLength);

  return {
    days: daysInHours ? '' : zeroPad(days, zeroPadDays),
    hours: formattedHours,
    minutes: zeroPad(minutes, zeroPadTimeLength),
    seconds: zeroPad(seconds, zeroPadTimeLength),
  };
}
