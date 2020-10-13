import { renderHook, act, cleanup } from '@testing-library/react-hooks';

const classSpies = {
  mount: jest.fn(),
  update: jest.fn(),
  unmount: jest.fn(),
};

const CountdownJs = jest.requireActual('./CountdownJs').default;

jest.mock('./CountdownJs', () => {
  return jest.fn().mockImplementation((props, updater) => {
    const countdown = new CountdownJs(props, updater);
    Object.keys(classSpies).forEach((key) => {
      const fn = countdown[key];
      countdown[key] = function (...args): void {
        fn(...args);
        classSpies[key](...args);
      };
    });
    return countdown;
  });
});

import useCountdown, { UseCountdownProps } from './useCountdown';
import { calcTimeDelta } from './utils';
import { mockDateNow, defaultStats } from './fixtures';

const { now, timeDiff } = mockDateNow();

describe('useCountdown', () => {
  jest.useFakeTimers();

  let countdownDate: number;
  const countdownMs = 10000;

  beforeEach(() => {
    Date.now = now;
    const date = Date.now() + countdownMs;
    countdownDate = date;
  });

  const hookCallback = (props: UseCountdownProps) => useCountdown(props); // eslint-disable-line

  it('should use countdown', () => {
    const { result } = renderHook(hookCallback, { initialProps: { date: countdownDate } });
    expect(result.current).toMatchSnapshot();
  });

  it('should update props', () => {
    const { result, rerender } = renderHook(hookCallback, {
      initialProps: { date: countdownDate },
    });
    const prevDate = result.current.props.date;
    expect(prevDate).toBe(1482363377071);

    expect(classSpies.mount).toHaveBeenCalledTimes(1);
    expect(classSpies.update).toHaveBeenCalledTimes(0);
    expect(classSpies.unmount).toHaveBeenCalledTimes(0);

    const nextProps = { date: countdownDate + timeDiff };
    rerender(nextProps);

    const nextDate = result.current.props.date;
    expect(nextDate).not.toEqual(prevDate);
    expect(nextDate).toBe(1482453487527);

    expect(classSpies.mount).toHaveBeenCalledTimes(1);
    expect(classSpies.update).toHaveBeenCalledTimes(1);
    expect(classSpies.update).toHaveBeenLastCalledWith(nextProps);
    expect(classSpies.unmount).toHaveBeenCalledTimes(0);
  });

  it('should respect hook lifecycle', async () => {
    const { result, rerender } = renderHook(hookCallback, {
      initialProps: { date: countdownDate, intervalDelay: 1111 },
    });

    expect(classSpies.mount).toHaveBeenCalledTimes(1);
    expect(classSpies.update).toHaveBeenCalledTimes(0);
    expect(classSpies.unmount).toHaveBeenCalledTimes(0);

    rerender({ date: countdownDate, intervalDelay: 1111 });

    act(() => {
      // Forward 6s in time
      now.mockReturnValue(countdownDate - 6000);
      jest.advanceTimersByTime(6000);
    });

    expect(classSpies.mount).toHaveBeenCalledTimes(1);
    expect(classSpies.update).toHaveBeenCalledTimes(1);
    expect(classSpies.unmount).toHaveBeenCalledTimes(0);
    expect(result.current.total).toBe(6000);

    // Respect key-prop change and re-instantiate countdown
    rerender({ date: countdownDate, key: Math.random(), intervalDelay: 1111 });

    expect(classSpies.mount).toHaveBeenCalledTimes(2);
    expect(classSpies.update).toHaveBeenCalledTimes(1);
    expect(classSpies.unmount).toHaveBeenCalledTimes(1);
    expect(result.current.total).toBe(6000);
  });

  [true, false].forEach((shouldUnmount) => {
    it(`should update (unmount => ${shouldUnmount}) time total`, () => {
      const { result, unmount } = renderHook(hookCallback, {
        initialProps: { date: countdownDate, intervalDelay: 2222 },
      });

      act(() => {
        now.mockReturnValue(countdownDate - 6000);
        jest.advanceTimersByTime(6000);
      });

      expect(result.current.total).toBe(6000);

      shouldUnmount && unmount();

      act(() => {
        now.mockReturnValue(countdownDate - 3000);
        jest.advanceTimersByTime(3000);
      });

      expect(result.current.total).toBe(shouldUnmount ? 6000 : 3000);
    });
  });

  it('should trigger onTick and onComplete callbacks', () => {
    const onTick = jest.fn((stats) => {
      expect(stats).toEqual(calcTimeDelta(countdownDate));
    });

    const onComplete = jest.fn((stats) => {
      expect(stats.total).toEqual(0);
    });

    const { result } = renderHook(hookCallback, {
      initialProps: { date: countdownDate, onTick, onComplete },
    });

    act(() => {
      // Forward 6s in time
      now.mockReturnValue(countdownDate - 6000);
      jest.advanceTimersByTime(6000);
    });

    expect(onTick.mock.calls.length).toBe(6);
    expect(result.current.total).toBe(6000);

    act(() => {
      // Forward 3 more seconds
      now.mockReturnValue(countdownDate - 1000);
      jest.advanceTimersByTime(3000);
    });

    expect(onTick.mock.calls.length).toBe(9);
    expect(result.current.total).toBe(1000);

    act(() => {
      // The End: onComplete callback gets triggered instead of onTick
      now.mockReturnValue(countdownDate);
      jest.advanceTimersByTime(1000);
    });

    expect(onTick.mock.calls.length).toBe(9);
    expect(onTick).toBeCalledWith({
      ...defaultStats,
      total: 1000,
      seconds: 1,
    });

    expect(onComplete.mock.calls.length).toBe(1);
    expect(onComplete).toBeCalledWith({ ...defaultStats, completed: true });
    expect(result.current.completed).toBe(true);
  });

  afterEach(async () => {
    await cleanup();
    jest.clearAllMocks();
  });
});
