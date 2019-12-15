import * as React from 'react';
import { mount } from 'enzyme';

import Countdown from './Countdown';
import { calcTimeDelta, formatTimeDelta } from './utils';

import { CountdownProps as LegacyCountdownProps } from './LegacyCountdown';

const timeDiff = 90110456;
const now = jest.fn(() => 1482363367071);
Date.now = now;
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

describe('<Countdown />', () => {
  jest.useFakeTimers();

  let wrapper;
  let countdownDate;
  const countdownMs = 10000;

  beforeEach(() => {
    Date.now = now;
    const date = Date.now() + countdownMs;
    const root = document.createElement('div');
    countdownDate = date;
    wrapper = mount(<Countdown date={date} />, { attachTo: root });
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

    class Completionist extends React.Component<any> {
      componentDidMount() {}

      render() {
        return (
          <div>
            Completed! {this.props.name} {this.props.children}
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
    expect(wrapper.state().timeDelta.completed).toBe(true);
    expect(wrapper.props().children.type).toBe(Completionist);
    expect(Completionist.prototype.componentDidMount).toBeCalled();

    const computedProps = { ...wrapper.props() };
    delete computedProps.children;

    const obj = wrapper.instance();
    const delta = wrapper.state().timeDelta;
    expect(completionist.props).toEqual({
      countdown: {
        ...delta,
        api: obj.getApi(),
        props: wrapper.props(),
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
    expect(wrapper.state().timeDelta.total).toBe(6000);

    wrapper.update();
    expect(wrapper).toMatchSnapshot();

    // Forward 3 more seconds
    now.mockReturnValue(countdownDate - 1000);
    jest.runTimersToTime(3000);
    expect(onTick.mock.calls.length).toBe(9);
    expect(wrapper.state().timeDelta.total).toBe(1000);
    expect(wrapper.state().timeDelta.completed).toBe(false);

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
    expect(wrapper.state().timeDelta.completed).toBe(true);
  });

  it('should run through the controlled component by updating the date prop', () => {
    const root = document.createElement('div');
    wrapper = mount(<Countdown date={1000} controlled />, { attachTo: root });
    const obj = wrapper.instance();
    const api = obj.getApi();

    expect(obj.interval).toBeUndefined();
    expect(wrapper.state().timeDelta.completed).toBe(false);
    expect(api.isCompleted()).toBe(false);

    wrapper.setProps({ date: 0 });
    expect(wrapper.state().timeDelta.total).toBe(0);
    expect(wrapper.state().timeDelta.completed).toBe(true);
    expect(api.isCompleted()).toBe(true);
  });

  it('should not (try to) set state after component unmount', () => {
    expect(wrapper.state().timeDelta.completed).toBe(false);

    now.mockReturnValue(countdownDate - 6000);
    jest.runTimersToTime(6000);
    expect(wrapper.state().timeDelta.total).toBe(6000);

    wrapper.instance().mounted = false;
    now.mockReturnValue(countdownDate - 3000);
    jest.runTimersToTime(3000);
    expect(wrapper.state().timeDelta.total).toBe(6000);
  });

  it('should pause and restart countdown', () => {
    const spies = {
      onMount: jest.fn(),
      onStart: jest.fn(),
      onPause: jest.fn(),
    };
    wrapper = mount(<Countdown date={countdownDate} {...spies} />);
    const obj = wrapper.instance();
    const api = obj.getApi();

    expect(wrapper.state()).toEqual(
      expect.objectContaining({
        offsetStart: 0,
        offsetTime: 0,
      })
    );
    expect(api.isPaused()).toBe(false);
    expect(spies.onMount).toHaveBeenCalledTimes(1);
    expect(spies.onMount).toHaveBeenCalledWith(obj.calcTimeDelta());
    expect(spies.onStart).toHaveBeenCalledTimes(1);
    expect(spies.onPause).toHaveBeenCalledTimes(0);

    let runMs = 2000;
    const nowBeforePause = countdownDate - (countdownMs - runMs);
    now.mockReturnValue(nowBeforePause);
    jest.runTimersToTime(runMs);
    expect(wrapper.state().timeDelta.total).toBe(countdownMs - runMs);

    api.pause();
    expect(api.isPaused()).toBe(true);
    expect(api.isCompleted()).toBe(false);
    expect(spies.onPause).toHaveBeenCalledTimes(1);
    expect(spies.onPause).toHaveBeenCalledWith(obj.calcTimeDelta());

    runMs += 2000;
    const pausedMs = 2000;
    now.mockReturnValue(countdownDate - (countdownMs - runMs));
    jest.runTimersToTime(runMs);
    expect(countdownMs - runMs + pausedMs).toBe(8000);
    expect(wrapper.state().timeDelta.total).toBe(8000);
    expect(wrapper.state()).toEqual(
      expect.objectContaining({
        offsetStart: nowBeforePause,
        offsetTime: 0,
      })
    );

    api.start();
    expect(api.isPaused()).toBe(false);
    expect(api.isCompleted()).toBe(false);
    expect(spies.onStart).toHaveBeenCalledTimes(2);
    expect(spies.onStart).toHaveBeenCalledWith(obj.calcTimeDelta());

    expect(wrapper.state().timeDelta.total).toBe(8000);
    expect(wrapper.state()).toEqual(
      expect.objectContaining({ offsetStart: 0, offsetTime: pausedMs })
    );

    runMs += 4000;
    now.mockReturnValue(countdownDate - (countdownMs - runMs));
    jest.runTimersToTime(runMs);
    expect(countdownMs - runMs + pausedMs).toBe(4000);
    expect(wrapper.state().timeDelta.total).toBe(4000);
    expect(wrapper.state()).toEqual(
      expect.objectContaining({
        offsetStart: 0,
        offsetTime: pausedMs,
      })
    );

    now.mockReturnValue(countdownDate + pausedMs);
    jest.runTimersToTime(countdownMs + pausedMs);
    expect(wrapper.state().timeDelta.completed).toBe(true);
    expect(api.isCompleted()).toBe(true);

    expect(spies.onMount).toHaveBeenCalledTimes(1);
    expect(spies.onPause).toHaveBeenCalledTimes(1);
    expect(spies.onStart).toHaveBeenCalledTimes(2);
  });

  it('should not auto start countdown', () => {
    const spies = {
      onStart: jest.fn(),
    };
    wrapper = mount(<Countdown date={countdownDate} autoStart={false} {...spies} />);
    const obj = wrapper.instance();
    const api = obj.getApi();

    expect(spies.onStart).toHaveBeenCalledTimes(0);
    expect(api.isPaused()).toBe(true);
    expect(wrapper.state()).toEqual(
      expect.objectContaining({
        offsetStart: countdownDate - countdownMs,
        offsetTime: 0,
      })
    );

    api.start();
    expect(spies.onStart).toHaveBeenCalledTimes(1);
    expect(api.isPaused()).toBe(false);
    expect(wrapper.state()).toEqual(
      expect.objectContaining({
        offsetStart: 0,
        offsetTime: 0,
      })
    );
  });

  describe('legacy mode', () => {
    class LegacyCountdownOverlay extends React.Component<LegacyCountdownProps> {
      render() {
        return <div className="countdown">{this.props.count}</div>;
      }
    }

    async function tick(): Promise<void> {
      jest.useRealTimers();
      await new Promise(resolve => setTimeout(resolve, 0));
      jest.useFakeTimers();
    }

    it('should render legacy countdown', () => {
      wrapper = mount(
        <Countdown count={3}>
          <LegacyCountdownOverlay />
        </Countdown>
      );
      expect(wrapper).toMatchSnapshot();
    });

    it('should render legacy countdown without count prop', () => {
      wrapper = mount(
        <Countdown>
          <LegacyCountdownOverlay />
        </Countdown>
      );
      expect(wrapper).toMatchSnapshot();
    });

    it('should render null without children', () => {
      wrapper = mount(<Countdown count={3}></Countdown>);
      expect(wrapper.html()).toBe('');
      wrapper.unmount();
    });

    it('should allow adding time in seconds', async () => {
      const ref = React.createRef<Countdown>();

      wrapper = mount(
        <Countdown ref={ref} count={3}>
          <LegacyCountdownOverlay />
        </Countdown>
      );

      await tick();

      ref && ref.current && ref.current.addTime(2);
      jest.runOnlyPendingTimers();
      wrapper.update();

      expect(wrapper).toMatchSnapshot();
      const initialOutput = wrapper.html();

      wrapper.setProps({});
      wrapper.update();
      expect(initialOutput).toBe(wrapper.html());
    });

    it('should trigger onComplete callback when count reaches 0', async () => {
      const ref = React.createRef<Countdown>();
      const onComplete = jest.fn();

      wrapper = mount(
        <Countdown ref={ref} count={3} onComplete={onComplete}>
          <LegacyCountdownOverlay />
        </Countdown>
      );

      await tick();

      expect(onComplete).not.toHaveBeenCalled();
      ref && ref.current && ref.current.addTime(-2);
      jest.runOnlyPendingTimers();
      wrapper.update();

      expect(onComplete).toHaveBeenCalled();
      expect(wrapper).toMatchSnapshot();
    });
  });

  afterEach(() => {
    try {
      wrapper.detach();
    } catch (e) {}
  });
});
