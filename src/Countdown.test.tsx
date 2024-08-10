import * as React from 'react';
import { act, render, RenderResult } from '@testing-library/react';

import Countdown from './Countdown';
import CountdownJs, { CountdownProps, CountdownState, CountdownApi } from './CountdownJs';
import { calcTimeDelta } from './utils';
import { mockDateNow, defaultStats } from './fixtures';

const { now, timeDiff } = mockDateNow();

describe('<Countdown />', () => {
  jest.useFakeTimers();

  let countdownRef: React.RefObject<Countdown>;
  let container: RenderResult['container'];
  let unmount: RenderResult['unmount'];
  let rerender: RenderResult['rerender'];
  let countdownDate: number;
  const countdownMs = 10000;

  function getCountdownJsInstance(): CountdownJs {
    return countdownRef.current!.countdown;
  }

  function getCountdownApi(): CountdownApi {
    return countdownRef.current!.getApi();
  }

  function getCountdownJsState(): CountdownState {
    return getCountdownJsInstance().getState();
  }

  beforeEach(() => {
    Date.now = now;
    countdownDate = Date.now() + countdownMs;
    countdownRef = React.createRef<Countdown>();
  });

  it('should render a simple countdown', () => {
    ({ container } = render(<Countdown ref={countdownRef} date={Date.now() + timeDiff} />));
    expect(container).toMatchSnapshot();
  });

  it('should render custom renderer output', () => {
    ({ container } = render(
      <Countdown
        ref={countdownRef}
        date={Date.now() + timeDiff}
        renderer={(props) => (
          <div>
            {props.days}
            {props.hours}
            {props.minutes}
            {props.seconds}
          </div>
        )}
      />
    ));
    expect(container).toMatchSnapshot();
  });

  it('should render with daysInHours => true', () => {
    ({ container } = render(
      <Countdown ref={countdownRef} date={Date.now() + timeDiff} daysInHours />
    ));
    expect(container).toMatchSnapshot();
  });

  it('should render with zeroPadDays => 3', () => {
    ({ container } = render(
      <Countdown ref={countdownRef} date={Date.now() + 10 * 86400 * 1000} zeroPadDays={3} />
    ));
    expect(container).toMatchSnapshot();
  });

  it('should trigger onTick and onComplete callbacks', () => {
    const onTick = jest.fn((stats) => {
      expect(stats).toEqual(calcTimeDelta(countdownDate));
    });

    const onComplete = jest.fn((stats) => {
      expect(stats.total).toEqual(0);
    });

    act(() => {
      ({ container } = render(
        <Countdown
          ref={countdownRef}
          date={countdownDate}
          onTick={onTick}
          onComplete={onComplete}
        />
      ));
    });

    expect(onTick).not.toHaveBeenCalled();

    // Forward 6s in time
    now.mockReturnValue(countdownDate - 6000);
    act(() => jest.advanceTimersByTime(6000));
    expect(onTick.mock.calls.length).toBe(6);
    expect(getCountdownJsState().timeDelta.total).toBe(6000);

    act(() => getCountdownJsInstance().update({ date: countdownDate }));
    expect(container).toMatchSnapshot();

    // Forward 3 more seconds
    now.mockReturnValue(countdownDate - 1000);
    act(() => jest.advanceTimersByTime(3000));
    expect(onTick.mock.calls.length).toBe(9);
    expect(getCountdownJsState().timeDelta.total).toBe(1000);
    expect(getCountdownJsState().timeDelta.completed).toBe(false);

    // The End: onComplete callback gets triggered instead of the onTick callback
    now.mockReturnValue(countdownDate);
    act(() => jest.advanceTimersByTime(1000));
    expect(onTick.mock.calls.length).toBe(9);
    expect(onTick).toHaveBeenCalledWith({
      ...defaultStats,
      total: 1000,
      seconds: 1,
    });

    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(onComplete).toHaveBeenCalledWith({ ...defaultStats, completed: true }, false);
    expect(getCountdownJsState().timeDelta.completed).toBe(true);
  });

  it('should trigger various callbacks before onComplete is called', () => {
    const calls: string[] = [];

    const onStart = jest.fn().mockImplementation(() => calls.push('onStart'));
    const onTick = jest.fn().mockImplementation(() => calls.push('onTick'));
    const onComplete = jest.fn().mockImplementation(() => calls.push('onComplete'));

    act(() => {
      ({ container } = render(
        <Countdown
          ref={countdownRef}
          date={countdownDate}
          onStart={onStart}
          onTick={onTick}
          onComplete={onComplete}
        />
      ));
    });

    expect(calls).toEqual(['onStart']);

    for (let i = 1; i <= 10; i += 1) {
      now.mockReturnValue(countdownDate - countdownMs + i * 1000);
      act(() => jest.advanceTimersByTime(1000));
    }

    expect(calls).toEqual(['onStart', ...Array(9).fill('onTick'), 'onComplete']);
  });

  it('should trigger onComplete callback on start if date is in the past when countdown starts', () => {
    const calls: string[] = [];

    const onStart = jest.fn().mockImplementation(() => calls.push('onStart'));
    const onTick = jest.fn().mockImplementation(() => calls.push('onTick'));
    const onComplete = jest.fn().mockImplementation(() => calls.push('onComplete'));

    countdownDate = Date.now() - 10000;

    act(() => {
      ({ container } = render(
        <Countdown
          ref={countdownRef}
          date={countdownDate}
          onStart={onStart}
          onTick={onTick}
          onComplete={onComplete}
        />
      ));
    });

    expect(onStart).toHaveBeenCalledTimes(1);
    expect(onTick).not.toHaveBeenCalled();
    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(onComplete).toHaveBeenCalledWith({ ...defaultStats, completed: true }, true);
    expect(calls).toEqual(['onStart', 'onComplete']);
  });

  it('should run through the controlled component by updating the date prop', () => {
    ({ container, rerender } = render(<Countdown ref={countdownRef} date={1000} controlled />));

    const api = getCountdownApi();
    const countdownJsObj = getCountdownJsInstance();

    expect(countdownJsObj.timerId).toBeUndefined();
    expect(getCountdownJsState().timeDelta.completed).toBe(false);
    expect(api.isCompleted()).toBe(false);

    rerender(<Countdown ref={countdownRef} date={0} controlled />);
    expect(getCountdownJsState().timeDelta.total).toBe(0);
    expect(getCountdownJsState().timeDelta.completed).toBe(true);
    expect(api.isCompleted()).toBe(true);
  });

  it('should only re-set time delta state when props have changed', () => {
    ({ container, rerender } = render(<Countdown ref={countdownRef} date={1000} />));

    const countdownJsObj = getCountdownJsInstance();
    countdownJsObj.setTimeDeltaState = jest.fn();

    function mergeProps(partialProps: Partial<CountdownProps>): CountdownProps {
      return { ...countdownJsObj.getProps(), ...partialProps };
    }

    rerender(<Countdown ref={countdownRef} {...mergeProps({ date: 500 })} />);
    expect(countdownJsObj.setTimeDeltaState).toHaveBeenCalledTimes(1);

    rerender(<Countdown ref={countdownRef} {...mergeProps({ intervalDelay: 999 })} />);
    expect(countdownJsObj.setTimeDeltaState).toHaveBeenCalledTimes(2);

    rerender(<Countdown ref={countdownRef} {...mergeProps({ date: 500 })} />);
    expect(countdownJsObj.setTimeDeltaState).toHaveBeenCalledTimes(2);

    rerender(<Countdown ref={countdownRef} {...mergeProps({ precision: NaN })} />);
    expect(countdownJsObj.setTimeDeltaState).toHaveBeenCalledTimes(3);

    rerender(<Countdown ref={countdownRef} {...mergeProps({ precision: NaN })} />);
    expect(countdownJsObj.setTimeDeltaState).toHaveBeenCalledTimes(3);

    rerender(<Countdown ref={countdownRef} {...mergeProps({ precision: 3 })} />);
    expect(countdownJsObj.setTimeDeltaState).toHaveBeenCalledTimes(4);

    rerender(<Countdown ref={countdownRef} {...mergeProps({ date: 750 })} />);
    expect(countdownJsObj.setTimeDeltaState).toHaveBeenCalledTimes(5);
  });

  it('should not (try to) set state after component unmount', () => {
    ({ container, unmount } = render(<Countdown ref={countdownRef} date={countdownDate} />));

    const countdownJsObj = getCountdownJsInstance();
    expect(getCountdownJsState().timeDelta.completed).toBe(false);

    now.mockReturnValue(countdownDate - 6000);
    act(() => jest.advanceTimersByTime(6000));
    expect(countdownJsObj.initialized).toBe(true);
    expect(getCountdownJsState().timeDelta.total).toBe(6000);

    unmount();

    now.mockReturnValue(countdownDate - 3000);
    act(() => jest.advanceTimersByTime(3000));
    expect(countdownJsObj.initialized).toBe(false);
    expect(countdownJsObj.getState().timeDelta.total).toBe(6000);

    countdownJsObj.setTimeDeltaState(defaultStats);
    expect(countdownJsObj.getState().timeDelta).not.toEqual(defaultStats);
  });

  it('should set countdown status to stopped if a prop-update occurs that updates a completed countdown', () => {
    ({ container, rerender } = render(<Countdown ref={countdownRef} date={countdownDate} />));

    const api = getCountdownApi();

    expect(api.isStarted()).toBe(true);

    rerender(<Countdown ref={countdownRef} date={countdownDate + 1000} />);
    expect(api.isStarted()).toBe(true);

    rerender(<Countdown ref={countdownRef} date={0} />);
    expect(api.isCompleted()).toBe(true);

    rerender(<Countdown ref={countdownRef} date={countdownDate + 1000} />);
    expect(api.isStopped()).toBe(true);
  });

  it(`should pause => start => pause => stop and restart countdown`, () => {
    const spies = {
      onMount: jest.fn(),
      onStart: jest.fn(),
      onPause: jest.fn(),
      onStop: jest.fn(),
    };

    ({ container, unmount } = render(
      <Countdown ref={countdownRef} date={countdownDate} {...spies} />
    ));

    const obj = getCountdownJsInstance();
    const api = getCountdownApi();

    expect(obj.offsetStartTimestamp).toBe(0);
    expect(obj.offsetTime).toBe(0);

    expect(api.isStarted()).toBe(true);
    expect(api.isPaused()).toBe(false);
    expect(api.isStopped()).toBe(false);
    expect(api.isCompleted()).toBe(false);
    expect(spies.onMount).toHaveBeenCalledTimes(1);
    expect(spies.onMount).toHaveBeenCalledWith({
      completed: false,
      total: 10000,
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 10,
      milliseconds: 0,
    });
    expect(spies.onStart).toHaveBeenCalledTimes(1);
    expect(spies.onPause).toHaveBeenCalledTimes(0);
    expect(spies.onStop).toHaveBeenCalledTimes(0);

    let runMs = 2000;
    const nowBeforePause = countdownDate - (countdownMs - runMs);
    now.mockReturnValue(nowBeforePause);
    act(() => jest.advanceTimersByTime(runMs));
    expect(getCountdownJsState().timeDelta.total).toBe(countdownMs - runMs);

    act(() => api.pause());
    expect(api.isStarted()).toBe(false);
    expect(api.isPaused()).toBe(true);
    expect(api.isStopped()).toBe(false);
    expect(api.isCompleted()).toBe(false);
    expect(spies.onMount).toHaveBeenCalledTimes(1);
    expect(spies.onStart).toHaveBeenCalledTimes(1);
    expect(spies.onPause).toHaveBeenCalledTimes(1);
    expect(spies.onPause).toHaveBeenCalledWith({
      completed: false,
      total: 8000,
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 8,
      milliseconds: 0,
    });
    expect(spies.onStop).toHaveBeenCalledTimes(0);

    // Calling pause() a 2nd time while paused should return early
    act(() => api.pause());
    expect(api.isPaused()).toBe(true);
    expect(spies.onPause).toHaveBeenCalledTimes(1);
    expect(spies.onPause).toHaveBeenCalledWith(getCountdownJsInstance().calcTimeDelta());

    runMs += 2000;
    const pausedMs = 2000;
    now.mockReturnValue(countdownDate - (countdownMs - runMs));
    act(() => jest.advanceTimersByTime(runMs));
    expect(countdownMs - runMs + pausedMs).toBe(8000);
    expect(getCountdownJsState().timeDelta.total).toBe(8000);
    expect(obj.offsetStartTimestamp).toBe(nowBeforePause);
    expect(obj.offsetTime).toBe(0);

    act(() => api.start());
    expect(api.isStarted()).toBe(true);
    expect(api.isPaused()).toBe(false);
    expect(api.isStopped()).toBe(false);
    expect(api.isCompleted()).toBe(false);
    expect(spies.onMount).toHaveBeenCalledTimes(1);
    expect(spies.onStart).toHaveBeenCalledTimes(2);
    expect(spies.onStart).toHaveBeenCalledWith({
      completed: false,
      total: 8000,
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 8,
      milliseconds: 0,
    });
    expect(spies.onPause).toHaveBeenCalledTimes(1);
    expect(spies.onStop).toHaveBeenCalledTimes(0);

    expect(getCountdownJsState().timeDelta.total).toBe(8000);
    expect(obj.offsetStartTimestamp).toBe(0);
    expect(obj.offsetTime).toBe(pausedMs);

    runMs += 1000;
    now.mockReturnValue(countdownDate - (countdownMs - runMs));
    act(() => jest.advanceTimersByTime(runMs));
    expect(countdownMs - runMs + pausedMs).toBe(7000);
    expect(getCountdownJsState().timeDelta.total).toBe(7000);
    expect(obj.offsetStartTimestamp).toBe(0);
    expect(obj.offsetTime).toBe(pausedMs);

    runMs += 1000;
    now.mockReturnValue(countdownDate - (countdownMs - runMs));
    act(() => jest.advanceTimersByTime(runMs));

    act(() => api.pause());
    expect(obj.offsetStartTimestamp).toBe(now());
    expect(obj.offsetTime).toBe(2000);

    expect(getCountdownJsState().timeDelta).toEqual({
      completed: false,
      total: 6000,
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 6,
      milliseconds: 0,
    });

    runMs += 1000;
    now.mockReturnValue(countdownDate - (countdownMs - runMs));
    act(() => jest.advanceTimersByTime(runMs));

    act(() => api.stop());
    expect(obj.offsetStartTimestamp).toBe(now());
    expect(obj.offsetTime).toBe(runMs);

    expect(api.isStarted()).toBe(false);
    expect(api.isPaused()).toBe(false);
    expect(api.isStopped()).toBe(true);
    expect(api.isCompleted()).toBe(false);
    expect(spies.onMount).toHaveBeenCalledTimes(1);
    expect(spies.onStart).toHaveBeenCalledTimes(2);
    expect(spies.onPause).toHaveBeenCalledTimes(2);
    expect(spies.onStop).toHaveBeenCalledTimes(1);
    expect(spies.onStop).toHaveBeenCalledWith({
      completed: false,
      total: 10000,
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 10,
      milliseconds: 0,
    });

    // Calling stop() a 2nd time while stopped should return early
    act(() => api.stop());
    expect(api.isStopped()).toBe(true);
    expect(spies.onStop).toHaveBeenCalledTimes(1);

    act(() => api.start());

    runMs += 10000;
    now.mockReturnValue(countdownDate + runMs + pausedMs);
    act(() => jest.advanceTimersByTime(countdownMs + pausedMs));

    expect(getCountdownJsState().timeDelta.total).toBe(0);
    expect(getCountdownJsState().timeDelta.completed).toBe(true);
    expect(api.isCompleted()).toBe(true);
    expect(obj.offsetStartTimestamp).toBe(0);
    expect(obj.offsetTime).toBe(7000);

    expect(spies.onMount).toHaveBeenCalledTimes(1);
    expect(spies.onStart).toHaveBeenCalledTimes(3);
    expect(spies.onPause).toHaveBeenCalledTimes(2);
    expect(spies.onStop).toHaveBeenCalledTimes(1);
  });

  it('should update component when pure', () => {
    ({ container, rerender } = render(<Countdown ref={countdownRef} pure date={countdownDate} />));

    const countdownJsObj = getCountdownJsInstance();
    expect(countdownJsObj.getProps().date).toBe(countdownDate);

    rerender(<Countdown ref={countdownRef} pure date={0} />);
    expect(countdownJsObj.getProps().date).toBe(0);
  });

  it('should not update component when impure', () => {
    ({ container, rerender } = render(
      <Countdown ref={countdownRef} pure={false} date={countdownDate} />
    ));

    const countdownJsObj = getCountdownJsInstance();
    expect(countdownJsObj.getProps().date).toBe(countdownDate);

    rerender(<Countdown ref={countdownRef} pure={false} date={0} />);
    expect(countdownJsObj.getProps().date).not.toBe(0);
  });

  it('should auto start countdown', () => {
    const spies = {
      onStart: jest.fn(),
      onPause: jest.fn(),
    };

    ({ container } = render(
      <Countdown ref={countdownRef} date={countdownDate} autoStart={true} {...spies} />
    ));

    const obj = getCountdownJsInstance();
    const api = getCountdownApi();

    expect(spies.onStart).toHaveBeenCalledTimes(1);
    expect(spies.onPause).toHaveBeenCalledTimes(0);
    expect(api.isPaused()).toBe(false);
    expect(obj.offsetStartTimestamp).toBe(0);
    expect(obj.offsetTime).toBe(0);

    act(() => api.pause());
    expect(spies.onStart).toHaveBeenCalledTimes(1);
    expect(spies.onPause).toHaveBeenCalledTimes(1);
    expect(api.isPaused()).toBe(true);
    expect(obj.offsetStartTimestamp).toBe(countdownDate - countdownMs);
    expect(obj.offsetTime).toBe(0);
  });

  it('should not auto start countdown', () => {
    const spies = {
      onStart: jest.fn(),
    };

    ({ container } = render(
      <Countdown ref={countdownRef} date={countdownDate} autoStart={false} {...spies} />
    ));

    const obj = getCountdownJsInstance();
    const api = getCountdownApi();

    expect(spies.onStart).toHaveBeenCalledTimes(0);
    expect(api.isStarted()).toBe(false);
    expect(api.isPaused()).toBe(false);
    expect(api.isStopped()).toBe(true);
    expect(api.isCompleted()).toBe(false);
    expect(obj.offsetStartTimestamp).toBe(countdownDate - countdownMs);
    expect(obj.offsetTime).toBe(0);

    act(() => api.start());
    expect(spies.onStart).toHaveBeenCalledTimes(1);
    expect(api.isStarted()).toBe(true);
    expect(api.isPaused()).toBe(false);
    expect(api.isStopped()).toBe(false);
    expect(api.isCompleted()).toBe(false);
    expect(obj.offsetStartTimestamp).toBe(0);
    expect(obj.offsetTime).toBe(0);

    // Calling start() a 2nd time while started should return early
    act(() => api.start());
    expect(spies.onStart).toHaveBeenCalledTimes(1);
  });

  it('should continuously call the renderer if date is in the future', () => {
    const renderer = jest.fn(() => <div />);

    ({ container } = render(
      <Countdown ref={countdownRef} date={countdownDate} renderer={renderer} />
    ));

    expect(renderer).toHaveBeenCalledTimes(2);

    // Forward 1s
    now.mockReturnValue(countdownDate - 9000);
    act(() => jest.advanceTimersByTime(1000));
    expect(renderer).toHaveBeenCalledTimes(3);

    // Forward 2s
    now.mockReturnValue(countdownDate - 8000);
    act(() => jest.advanceTimersByTime(1000));
    expect(renderer).toHaveBeenCalledTimes(4);

    expect(getCountdownJsState().timeDelta.total).toBe(8000);
    expect(getCountdownJsState().timeDelta.completed).toBe(false);
  });

  it('should stop immediately if date is in the past', () => {
    const renderer = jest.fn(() => <div />);
    countdownDate = Date.now() - 10000;

    ({ container } = render(
      <Countdown ref={countdownRef} date={countdownDate} renderer={renderer} />
    ));

    expect(renderer).toHaveBeenCalledTimes(2);

    // Forward 1s
    now.mockReturnValue(countdownDate - 9000);
    act(() => jest.advanceTimersByTime(1000));
    expect(renderer).toHaveBeenCalledTimes(2);

    // Forward 2s
    now.mockReturnValue(countdownDate - 8000);
    act(() => jest.advanceTimersByTime(1000));
    expect(renderer).toHaveBeenCalledTimes(2);

    expect(getCountdownJsState().timeDelta.total).toBe(0);
    expect(getCountdownJsState().timeDelta.completed).toBe(true);
  });

  it('should not stop the countdown and go into overtime', () => {
    const onTick = jest.fn();
    ({ container } = render(
      <Countdown ref={countdownRef} date={countdownDate} overtime={true} onTick={onTick} />
    ));

    const api = getCountdownApi();

    // Forward 9s
    now.mockReturnValue(countdownDate - 1000);
    act(() => jest.advanceTimersByTime(9000));

    expect(container.textContent).toBe('00:00:00:01');
    expect(onTick).toHaveBeenCalledTimes(9);

    // Forward 1s
    now.mockReturnValue(countdownDate);
    act(() => jest.advanceTimersByTime(1000));

    expect(container.textContent).toBe('00:00:00:00');
    expect(onTick).toHaveBeenCalledTimes(10);
    expect(getCountdownJsState().timeDelta.total).toBe(0);
    expect(getCountdownJsState().timeDelta.completed).toBe(true);
    expect(api.isCompleted()).toBe(false);

    // Forward 1s (overtime)
    now.mockReturnValue(countdownDate + 1000);
    act(() => jest.advanceTimersByTime(1000));

    expect(container.textContent).toBe('-00:00:00:01');
    expect(onTick).toHaveBeenCalledTimes(11);
    expect(getCountdownJsState().timeDelta.total).toBe(-1000);
    expect(getCountdownJsState().timeDelta.completed).toBe(true);
    expect(api.isCompleted()).toBe(false);
  });
});
