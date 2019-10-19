import { renderHook, act } from '@testing-library/react-hooks';

import useCountdown, { UseCountdownProps } from './useCountdown';
import CountdownJs from './CountdownJs';
import { calcTimeDelta } from './utils';

const timeDiff = 90110456;
const now = jest.fn(() => 1482363367071);
Date.now = now;

const defaultStats = {
  total: 0,
  days: 0,
  hours: 0,
  minutes: 0,
  seconds: 0,
  milliseconds: 0,
  completed: false,
};

describe('useCountdown', () => {
  jest.useFakeTimers();

  let countdownDate;
  const countdownMs = 10000;

  beforeEach(() => {
    Date.now = now;
    const date = Date.now() + countdownMs;
    countdownDate = date;
  });

  const hookCallback = (props: UseCountdownProps) => useCountdown(props);

  it('should use countdown', () => {
    const { result } = renderHook(hookCallback, { initialProps: { date: countdownDate } });
    const { countdown } = result.current;
    expect(countdown).toBeInstanceOf(CountdownJs);
    expect(result.current.api).toEqual(countdown.getApi());
    expect(result.current.renderProps).toEqual(countdown.getRenderProps());
    expect(result.current.renderProps.total).toBe(10000);
  });

  it('should update props', () => {
    const { result, rerender } = renderHook(hookCallback, {
      initialProps: { date: countdownDate },
    });
    const prevProps = result.current.countdown.getProps();
    expect(prevProps.date).toBe(1482363377071);

    rerender({ date: countdownDate + timeDiff });

    const nextProps = result.current.countdown.getProps();
    expect(nextProps).not.toEqual(prevProps);
    expect(nextProps.date).toBe(1482453487527);
  });

  it.only('should not (try to) set state after component unmount', () => {
    const { result, unmount } = renderHook(hookCallback, {
      initialProps: { date: countdownDate },
    });

    act(() => {
      now.mockReturnValue(countdownDate - 6000);
      jest.runTimersToTime(6000);
    });

    expect(result.current.countdown.mounted).toBe(true);
    expect(result.current.renderProps.total).toBe(6000);

    unmount();

    act(() => {
      now.mockReturnValue(countdownDate - 3000);
      jest.runTimersToTime(3000);
    });

    expect(result.current.countdown.mounted).toBe(false);
    expect(result.current.renderProps.total).toBe(6000);
  });

  it('should trigger onTick and onComplete callbacks', () => {
    const onTick = jest.fn(stats => {
      expect(stats).toEqual(calcTimeDelta(countdownDate));
    });

    const onComplete = jest.fn(stats => {
      expect(stats.total).toEqual(0);
    });

    const { result } = renderHook(hookCallback, {
      initialProps: { date: countdownDate, onTick, onComplete },
    });

    act(() => {
      // Forward 6s in time
      now.mockReturnValue(countdownDate - 6000);
      jest.runTimersToTime(6000);
    });

    expect(onTick.mock.calls.length).toBe(6);
    expect(result.current.renderProps.total).toBe(6000);

    act(() => {
      // Forward 3 more seconds
      now.mockReturnValue(countdownDate - 1000);
      jest.runTimersToTime(3000);
    });

    expect(onTick.mock.calls.length).toBe(9);
    expect(result.current.renderProps.total).toBe(1000);

    act(() => {
      // The End: onComplete callback gets triggered instead of onTick
      now.mockReturnValue(countdownDate);
      jest.runTimersToTime(1000);
    });

    expect(onTick.mock.calls.length).toBe(9);
    expect(onTick).toBeCalledWith({
      ...defaultStats,
      total: 1000,
      seconds: 1,
    });

    expect(onComplete.mock.calls.length).toBe(1);
    expect(onComplete).toBeCalledWith({ ...defaultStats, completed: true });
    expect(result.current.renderProps.completed).toBe(true);
  });
});
