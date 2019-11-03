import { zeroPad, calcTimeDelta } from './utils';
import { mockDateNow, defaultStats } from './fixtures';

const { timeDiff } = mockDateNow();

describe('utils', () => {
  describe('zeroPad', () => {
    it('should add one 0 in front of "ab" if length is 3', () => {
      expect(zeroPad('ab', 3)).toBe('0ab');
    });

    it('should add two 0s in front of 2 if length is 3', () => {
      expect(zeroPad(2, 3)).toBe('002');
    });

    it('should add one 0 in front of 1 if length is not defined', () => {
      expect(zeroPad(1)).toBe('01');
    });

    it('should add three 0s if value is "" and length is 3', () => {
      expect(zeroPad('', 3)).toBe('000');
    });

    it('should not zero-pad 1 if length is 0 or 1', () => {
      expect(zeroPad(1, 0)).toBe('1');
      expect(zeroPad(1, 1)).toBe('1');
    });

    it('should not zero-pad 123 if length is 3', () => {
      expect(zeroPad(123, 3)).toBe('123');
      expect(zeroPad(123, 4)).toBe('0123');
    });

    it('should zero-pad prefixed numbers', () => {
      expect(zeroPad(-1, 1)).toBe('-1');
      expect(zeroPad(-1, 2)).toBe('-01');
      expect(zeroPad(-1, 3)).toBe('-001');
      expect(zeroPad('+12.34', 1)).toBe('+12.34');
      expect(zeroPad('+12.34', 2)).toBe('+12.34');
      expect(zeroPad('+12.34', 3)).toBe('+012.34');
    });
  });

  describe('calcTimeDelta', () => {
    it('should return a time difference of 0s', () => {
      expect(calcTimeDelta(Date.now())).toEqual({
        ...defaultStats,
        completed: true,
      });
    });

    it('should return a time difference of 0s if values for start and current date are the same', () => {
      expect(calcTimeDelta(Date.now())).toEqual({
        ...defaultStats,
        completed: true,
      });
      expect(calcTimeDelta(Date.now() + 10, { now: () => Date.now() + 10 })).toEqual({
        ...defaultStats,
        completed: true,
      });
    });

    it('should calculate the time difference with a precision of 0', () => {
      expect(calcTimeDelta(Date.now() + timeDiff)).toEqual({
        total: timeDiff - 456,
        days: 1,
        hours: 1,
        minutes: 1,
        seconds: 50,
        milliseconds: 0,
        completed: false,
      });
    });

    it('should calculate the time difference with a precision of 3', () => {
      expect(calcTimeDelta(Date.now() + timeDiff, { precision: 3 })).toEqual({
        total: timeDiff,
        days: 1,
        hours: 1,
        minutes: 1,
        seconds: 50,
        milliseconds: 456,
        completed: false,
      });
    });

    it('should calculate the time difference by passing a date string', () => {
      Date.now = jest.fn(() => new Date('Thu Dec 22 2016 00:36:07').getTime());
      expect(calcTimeDelta('Thu Dec 23 2017 01:38:10:456', { precision: 3 })).toEqual({
        total: 31626123456,
        days: 366,
        hours: 1,
        minutes: 2,
        seconds: 3,
        milliseconds: 456,
        completed: false,
      });
    });

    it('should calculate the time difference when controlled is true', () => {
      const total = 91120003;
      expect(calcTimeDelta(total, { controlled: true })).toEqual({
        total: total - 3,
        days: 1,
        hours: 1,
        minutes: 18,
        seconds: 40,
        milliseconds: 0,
        completed: false,
      });

      expect(calcTimeDelta(total, { precision: 3, controlled: true })).toEqual({
        total,
        days: 1,
        hours: 1,
        minutes: 18,
        seconds: 40,
        milliseconds: 3,
        completed: false,
      });
    });

    it('should return a time difference of 0s', () => {
      const date = new Date();
      date.getTime = jest.fn(() => Date.now() + 1000);
      expect(calcTimeDelta(date)).toEqual({
        total: 1000,
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 1,
        milliseconds: 0,
        completed: false,
      });
    });

    it('should calculate time difference with custom offset', () => {
      const date = new Date();
      date.getTime = jest.fn(() => Date.now() + 1000);
      expect(calcTimeDelta(date, { offsetTime: 1000 })).toEqual({
        total: 2000,
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 2,
        milliseconds: 0,
        completed: false,
      });
    });
  });
});
