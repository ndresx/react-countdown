import * as React from 'react';
import { mount, ReactWrapper } from 'enzyme';

import Countdown from './Countdown';
import CountdownJs, { CountdownProps, CountdownState } from './CountdownJs';
import { calcTimeDelta, formatTimeDelta } from './utils';
import { mockDateNow, defaultStats } from './fixtures';

const { now, timeDiff } = mockDateNow();

describe('<Countdown />', () => {
  jest.useFakeTimers();

  let wrapper: ReactWrapper<CountdownProps, CountdownState, Countdown>;
  let obj: Countdown;
  let countdownDate: number;
  const countdownMs = 10000;

  beforeEach(() => {
    Date.now = now;
    const date = Date.now() + countdownMs;
    countdownDate = date;
    wrapper = mount(<Countdown date={date} />);
    obj = wrapper.instance();
  });

  function getCountdownJsInstance(): CountdownJs {
    return wrapper.instance().countdown;
  }

  function getCountdownJsState(): CountdownState {
    return getCountdownJsInstance().getState();
  }

  it('should render a simple countdown', () => {
    wrapper = mount(<Countdown date={Date.now() + timeDiff} />);
    expect(wrapper).toMatchSnapshot();
  });

  it('should render custom renderer output', () => {
    wrapper = mount(
      <Countdown
        date={Date.now() + timeDiff}
        renderer={props => (
          <div>
            {props.days}
            {props.hours}
            {props.minutes}
            {props.seconds}
          </div>
        )}
      />
    );
    expect(wrapper).toMatchSnapshot();
  });

  it('should render and unmount component on countdown end', () => {
    const zeroPadTime = 0;

    class Completionist extends React.PureComponent<{
      readonly name: string;
      readonly children: React.ReactNode;
    }> {
      render() {
        const { name, children } = this.props;
        return (
          <div>
            Completed! {name} {children}
          </div>
        );
      }
    }

    let completionist;
    Completionist.prototype.componentDidMount = jest.fn();

    wrapper = mount(
      <Countdown date={Date.now() + timeDiff} zeroPadTime={zeroPadTime}>
        <Completionist
          ref={el => {
            completionist = el;
          }}
          name="master"
        >
          Another child
        </Completionist>
      </Countdown>
    );
    expect(Completionist.prototype.componentDidMount).not.toBeCalled();
    expect(wrapper).toMatchSnapshot();

    // Forward in time
    wrapper.setProps({ date: 0 });
    expect(getCountdownJsState().timeDelta.completed).toBe(true);
    expect(wrapper.props().children!.type).toBe(Completionist);
    expect(Completionist.prototype.componentDidMount).toBeCalled();

    const computedProps = { ...wrapper.props() };
    delete computedProps.children;

    obj = wrapper.instance();
    const delta = getCountdownJsState().timeDelta;
    expect(completionist.props).toEqual({
      countdown: {
        ...delta,
        api: obj.getApi(),
        props: getCountdownJsInstance().getProps(),
        formatted: formatTimeDelta(delta, { zeroPadTime }),
      },
      name: 'master',
      children: 'Another child',
    });
    expect(wrapper).toMatchSnapshot();
  });

  it('should render with daysInHours => true', () => {
    wrapper = mount(<Countdown date={Date.now() + timeDiff} daysInHours />);
    expect(wrapper).toMatchSnapshot();
  });

  it('should render with zeroPadDays => 3', () => {
    wrapper = mount(<Countdown date={Date.now() + 10 * 86400 * 1000} zeroPadDays={3} />);
    expect(wrapper).toMatchSnapshot();
  });

  it('should trigger onTick and onComplete callbacks', () => {
    const onTick = jest.fn(stats => {
      expect(stats).toEqual(calcTimeDelta(countdownDate));
    });

    const onComplete = jest.fn(stats => {
      expect(stats.total).toEqual(0);
    });

    wrapper.setProps({ onTick, onComplete });
    expect(onTick).not.toBeCalled();

    // Forward 6s in time
    now.mockReturnValue(countdownDate - 6000);
    jest.runTimersToTime(6000);
    expect(onTick.mock.calls.length).toBe(6);
    expect(getCountdownJsState().timeDelta.total).toBe(6000);

    wrapper.update();
    expect(wrapper).toMatchSnapshot();

    // Forward 3 more seconds
    now.mockReturnValue(countdownDate - 1000);
    jest.runTimersToTime(3000);
    expect(onTick.mock.calls.length).toBe(9);
    expect(getCountdownJsState().timeDelta.total).toBe(1000);
    expect(getCountdownJsState().timeDelta.completed).toBe(false);

    // The End: onComplete callback gets triggered instead of onTick
    now.mockReturnValue(countdownDate);
    jest.runTimersToTime(1000);
    expect(onTick.mock.calls.length).toBe(9);
    expect(onTick).toBeCalledWith({
      ...defaultStats,
      total: 1000,
      seconds: 1,
    });

    expect(onComplete.mock.calls.length).toBe(1);
    expect(onComplete).toBeCalledWith({ ...defaultStats, completed: true });
    expect(getCountdownJsState().timeDelta.completed).toBe(true);
  });

  it('should run through the controlled component by updating the date prop', () => {
    wrapper = mount(<Countdown date={1000} controlled />);
    obj = wrapper.instance();
    const api = obj.getApi();
    const countdownJsObj = getCountdownJsInstance();

    expect(countdownJsObj.interval).toBeUndefined();
    expect(getCountdownJsState().timeDelta.completed).toBe(false);
    expect(api.isCompleted()).toBe(false);

    wrapper.setProps({ date: 0 });
    expect(getCountdownJsState().timeDelta.total).toBe(0);
    expect(getCountdownJsState().timeDelta.completed).toBe(true);
    expect(api.isCompleted()).toBe(true);
  });

  it('should only re-set time delta state when props have changed', () => {
    const root = document.createElement('div');
    wrapper = mount(<Countdown date={1000} />, { attachTo: root });
    const countdownJsObj = getCountdownJsInstance();
    countdownJsObj.setTimeDeltaState = jest.fn();

    function mergeProps(partialProps: Partial<CountdownProps>): CountdownProps {
      return { ...wrapper.props(), ...partialProps };
    }

    wrapper.setProps(mergeProps({ date: 500 }));
    expect(countdownJsObj.setTimeDeltaState).toHaveBeenCalledTimes(1);

    wrapper.setProps(mergeProps({ intervalDelay: 999 }));
    expect(countdownJsObj.setTimeDeltaState).toHaveBeenCalledTimes(2);

    wrapper.setProps(mergeProps({ date: 500 }));
    expect(countdownJsObj.setTimeDeltaState).toHaveBeenCalledTimes(2);

    wrapper.setProps(mergeProps({ precision: NaN }));
    expect(countdownJsObj.setTimeDeltaState).toHaveBeenCalledTimes(3);

    wrapper.setProps(mergeProps({ precision: NaN }));
    expect(countdownJsObj.setTimeDeltaState).toHaveBeenCalledTimes(3);

    wrapper.setProps(mergeProps({ precision: 3 }));
    expect(countdownJsObj.setTimeDeltaState).toHaveBeenCalledTimes(4);

    wrapper.setProps(mergeProps({ date: 750 }));
    expect(countdownJsObj.setTimeDeltaState).toHaveBeenCalledTimes(5);
  });

  it('should not (try to) set state after component unmount', () => {
    const countdownJsObj = getCountdownJsInstance();
    expect(getCountdownJsState().timeDelta.completed).toBe(false);

    now.mockReturnValue(countdownDate - 6000);
    jest.runTimersToTime(6000);
    expect(countdownJsObj.mounted).toBe(true);
    expect(getCountdownJsState().timeDelta.total).toBe(6000);

    wrapper.unmount();

    now.mockReturnValue(countdownDate - 3000);
    jest.runTimersToTime(3000);
    expect(countdownJsObj.mounted).toBe(false);
    expect(countdownJsObj.getState().timeDelta.total).toBe(6000);

    countdownJsObj.setTimeDeltaState(defaultStats);
    expect(countdownJsObj.getState().timeDelta).not.toEqual(defaultStats);
  });

  it('should pause and restart countdown', () => {
    const spies = {
      onMount: jest.fn(),
      onStart: jest.fn(),
      onPause: jest.fn(),
    };
    wrapper = mount(<Countdown date={countdownDate} {...spies} />);
    obj = wrapper.instance();
    const api = obj.getApi();

    expect(getCountdownJsState()).toEqual(
      expect.objectContaining({
        offsetStart: 0,
        offsetTime: 0,
      })
    );
    expect(api.isPaused()).toBe(false);
    expect(spies.onMount).toHaveBeenCalledTimes(1);
    expect(spies.onMount).toHaveBeenCalledWith(getCountdownJsInstance().calcTimeDelta());
    expect(spies.onStart).toHaveBeenCalledTimes(1);
    expect(spies.onPause).toHaveBeenCalledTimes(0);

    let runMs = 2000;
    const nowBeforePause = countdownDate - (countdownMs - runMs);
    now.mockReturnValue(nowBeforePause);
    jest.runTimersToTime(runMs);
    expect(getCountdownJsState().timeDelta.total).toBe(countdownMs - runMs);

    api.pause();
    expect(api.isPaused()).toBe(true);
    expect(api.isCompleted()).toBe(false);
    expect(spies.onPause).toHaveBeenCalledTimes(1);
    expect(spies.onPause).toHaveBeenCalledWith(getCountdownJsInstance().calcTimeDelta());

    runMs += 2000;
    const pausedMs = 2000;
    now.mockReturnValue(countdownDate - (countdownMs - runMs));
    jest.runTimersToTime(runMs);
    expect(countdownMs - runMs + pausedMs).toBe(8000);
    expect(getCountdownJsState().timeDelta.total).toBe(8000);
    expect(getCountdownJsState()).toEqual(
      expect.objectContaining({
        offsetStart: nowBeforePause,
        offsetTime: 0,
      })
    );

    api.start();
    expect(api.isPaused()).toBe(false);
    expect(api.isCompleted()).toBe(false);
    expect(spies.onStart).toHaveBeenCalledTimes(2);
    expect(spies.onStart).toHaveBeenCalledWith(getCountdownJsInstance().calcTimeDelta());

    expect(getCountdownJsState().timeDelta.total).toBe(8000);
    expect(getCountdownJsState()).toEqual(
      expect.objectContaining({ offsetStart: 0, offsetTime: pausedMs })
    );

    runMs += 4000;
    now.mockReturnValue(countdownDate - (countdownMs - runMs));
    jest.runTimersToTime(runMs);
    expect(countdownMs - runMs + pausedMs).toBe(4000);
    expect(getCountdownJsState().timeDelta.total).toBe(4000);
    expect(getCountdownJsState()).toEqual(
      expect.objectContaining({
        offsetStart: 0,
        offsetTime: pausedMs,
      })
    );

    now.mockReturnValue(countdownDate + pausedMs);
    jest.runTimersToTime(countdownMs + pausedMs);
    expect(getCountdownJsState().timeDelta.completed).toBe(true);
    expect(api.isCompleted()).toBe(true);

    expect(spies.onMount).toHaveBeenCalledTimes(1);
    expect(spies.onPause).toHaveBeenCalledTimes(1);
    expect(spies.onStart).toHaveBeenCalledTimes(2);
  });

  it('should update component when pure', () => {
    wrapper = mount(<Countdown pure date={countdownDate} />);
    const countdownJsObj = getCountdownJsInstance();
    expect(countdownJsObj.getProps().date).toBe(countdownDate);

    wrapper.setProps({ date: 0 });
    expect(countdownJsObj.getProps().date).toBe(0);
  });

  it('should not update component when impure', () => {
    wrapper = mount(<Countdown pure={false} date={countdownDate} />);
    const countdownJsObj = getCountdownJsInstance();
    expect(countdownJsObj.getProps().date).toBe(countdownDate);

    wrapper.setProps({ date: 0 });
    expect(countdownJsObj.getProps().date).not.toBe(0);
  });

  it('should auto start countdown', () => {
    const spies = {
      onStart: jest.fn(),
      onPause: jest.fn(),
    };
    wrapper = mount(<Countdown date={countdownDate} autoStart={true} {...spies} />);
    const countdownObj = getCountdownJsInstance();
    const api = countdownObj.getApi();

    expect(spies.onStart).toHaveBeenCalledTimes(1);
    expect(spies.onPause).toHaveBeenCalledTimes(0);
    expect(api.isPaused()).toBe(false);
    expect(getCountdownJsInstance().getState()).toEqual(
      expect.objectContaining({
        offsetStart: 0,
        offsetTime: 0,
      })
    );

    api.pause();
    expect(spies.onStart).toHaveBeenCalledTimes(1);
    expect(spies.onPause).toHaveBeenCalledTimes(1);
    expect(api.isPaused()).toBe(true);
    expect(getCountdownJsInstance().getState()).toEqual(
      expect.objectContaining({
        offsetStart: countdownDate - countdownMs,
        offsetTime: 0,
      })
    );
  });

  it('should not auto start countdown', () => {
    const spies = {
      onStart: jest.fn(),
    };
    wrapper = mount(<Countdown date={countdownDate} autoStart={false} {...spies} />);
    const countdownObj = getCountdownJsInstance();
    const api = countdownObj.getApi();

    expect(spies.onStart).toHaveBeenCalledTimes(0);
    expect(api.isPaused()).toBe(true);
    expect(getCountdownJsInstance().getState()).toEqual(
      expect.objectContaining({
        offsetStart: countdownDate - countdownMs,
        offsetTime: 0,
      })
    );

    api.start();
    expect(spies.onStart).toHaveBeenCalledTimes(1);
    expect(api.isPaused()).toBe(false);
    expect(getCountdownJsInstance().getState()).toEqual(
      expect.objectContaining({
        offsetStart: 0,
        offsetTime: 0,
      })
    );
  });

  afterEach(() => {
    try {
      wrapper.detach();
    } catch (e) {
      // Continue...
    }
  });
});
