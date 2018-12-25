export interface CountdownTimeDeltaOptions {
  readonly now?: () => number;
  readonly precision?: number;
  readonly controlled?: boolean;
}

export interface CountdownTimeDelta {
  readonly total: number;
  readonly days: number;
  readonly hours: number;
  readonly minutes: number;
  readonly seconds: number;
  readonly milliseconds: number;
  readonly completed: boolean;
}

export interface CountdownTimeDeltaFormatted {
  readonly days: string;
  readonly hours: string;
  readonly minutes: string;
  readonly seconds: string;
}

export interface CountdownTimeDeltaFormatOptions {
  readonly daysInHours?: boolean;
  readonly zeroPadLength?: number;
  readonly zeroPadDaysLength?: number;
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
  return strValue.length >= length ? strValue : ('0'.repeat(length) + strValue).slice(length * -1);
}

export const timeDeltaFormatOptionsDefaults: CountdownTimeDeltaFormatOptions = {
  daysInHours: false,
  zeroPadLength: 2,
};

/**
 * Calculates the time difference between a given end date and the current date.
 *
 * @export
 * @param {Date|number|string} date Date or timestamp representation of the end date.
 * @param {Object} [{ now = Date.now, precision = 0, controlled = false }={}]
 *  {function} [date=Date.now] Alternative function for returning the current date.
 *  {number} [precision=0] The precision on a millisecond basis.
 *  {boolean} [controlled=false] Defines whether the calculated value is already provided as the time difference or not.
 * @param {number} [precision=0] The precision on a millisecond basis.
 * @param {boolean} [controlled=false] Defines whether the calculated value is already provided as the time difference or not.
 * @returns Object that includes details about the time difference.
 */
export function calcTimeDelta(
  date: Date | string | number,
  { now = Date.now, precision = 0, controlled = false }: CountdownTimeDeltaOptions = {}
): CountdownTimeDelta {
  let startTimestamp: number;

  if (typeof date === 'string') {
    startTimestamp = new Date(date).getTime();
  } else if (date instanceof Date) {
    startTimestamp = date.getTime();
  } else {
    startTimestamp = date;
  }

  const total = Math.round(
    parseFloat(
      (Math.max(0, controlled ? startTimestamp : startTimestamp - now()) / 1000).toFixed(
        Math.max(0, Math.min(20, precision))
      )
    ) * 1000
  );

  const seconds = total / 1000;

  return {
    total,
    days: Math.floor(seconds / (3600 * 24)),
    hours: Math.floor((seconds / 3600) % 24),
    minutes: Math.floor((seconds / 60) % 60),
    seconds: Math.floor(seconds % 60),
    milliseconds: Number(((seconds % 1) * 1000).toFixed()),
    completed: total <= 0,
  };
}

/**
 * Formats a given countdown time delta object
 *
 * @export
 * @param {CountdownTimeDelta} delta
 * @param {CountdownTimeDeltaFormatOptions} [options]
 * @returns {CountdownTimeDeltaFormatted} Formatted time delta object.
 */
export function formatTimeDelta(
  delta: CountdownTimeDelta,
  options?: CountdownTimeDeltaFormatOptions
): CountdownTimeDeltaFormatted {
  const { days, hours, minutes, seconds } = delta;
  const { daysInHours, zeroPadLength, zeroPadDaysLength = zeroPadLength } = {
    ...timeDeltaFormatOptionsDefaults,
    ...options,
  };
  const formattedHours = daysInHours
    ? zeroPad(hours + days * 24, zeroPadLength)
    : zeroPad(hours, Math.min(2, zeroPadLength));

  return {
    days: daysInHours ? '' : zeroPad(days, zeroPadDaysLength),
    hours: formattedHours,
    minutes: zeroPad(minutes, Math.min(2, zeroPadLength)),
    seconds: zeroPad(seconds, Math.min(2, zeroPadLength)),
  };
}
