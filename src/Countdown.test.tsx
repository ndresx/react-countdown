/* eslint-disable react/prop-types */
import * as React from 'react';
import { mount, shallow } from 'enzyme';

import Countdown from './Countdown';
import { zeroPad, calcTimeDelta, formatTimeDelta } from './utils';

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

describe('<Countdown />', () => {
  jest.useFakeTimers();

  let wrapper;
  let wrapperDate;

  beforeEach(() => {
    Date.now = now;
    const date = Date.now() + 10000;
    const root = document.createElement('div');
    wrapperDate = date;
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
    const zeroPadLength = 0;

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
      <Countdown date={Date.now() + timeDiff} zeroPadLength={zeroPadLength}>
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
    expect(wrapper.state().completed).toBe(true);
    expect(wrapper.props().children.type).toBe(Completionist);
    expect(Completionist.prototype.componentDidMount).toBeCalled();

    const computedProps = { ...wrapper.props() };
    delete computedProps.children;

    const delta = wrapper.state();
    expect(completionist.props).toEqual({
      countdown: {
        ...delta,
        formatted: formatTimeDelta(delta, { zeroPadLength }),
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

  it('should render with zeroPadDaysLength => 3', () => {
    wrapper = mount(<Countdown date={Date.now() + 10 * 86400 * 1000} zeroPadDaysLength={3} />);
    expect(wrapper).toMatchSnapshot();
  });

  it('should trigger onTick and onComplete callbacks', () => {
    const onTick = jest.fn(stats => {
      expect(stats).toEqual(calcTimeDelta(wrapperDate));
    });

    const onComplete = jest.fn(stats => {
      expect(stats.total).toEqual(0);
    });

    wrapper.setProps({ onTick, onComplete });
    expect(onTick).not.toBeCalled();

    // Forward 6s in time
    Date.now = jest.fn(() => wrapperDate - 6000);
    jest.runTimersToTime(6000);
    expect(onTick.mock.calls.length).toBe(6);
    expect(wrapper.state().seconds).toBe(6);

    wrapper.update();
    expect(wrapper).toMatchSnapshot();

    // Forward 3 more seconds
    Date.now = jest.fn(() => wrapperDate - 1000);
    jest.runTimersToTime(3000);
    expect(onTick.mock.calls.length).toBe(9);
    expect(wrapper.state().seconds).toBe(1);
    expect(wrapper.state().completed).toBe(false);

    // The End: onComplete callback gets triggered instead of onTick
    Date.now = jest.fn(() => wrapperDate);
    jest.runTimersToTime(1000);
    expect(onTick.mock.calls.length).toBe(9);
    expect(onTick).toBeCalledWith({
      ...defaultStats,
      total: 1000,
      seconds: 1,
    });

    expect(onComplete.mock.calls.length).toBe(1);
    expect(onComplete).toBeCalledWith({ ...defaultStats, completed: true });
    expect(wrapper.state().completed).toBe(true);
  });

  it('should run through the controlled component by updating the date prop', () => {
    const root = document.createElement('div');
    wrapper = mount(<Countdown date={1000} controlled />, { attachTo: root });
    expect(wrapper.instance().interval).toBeUndefined();
    expect(wrapper.state().completed).toBe(false);

    wrapper.setProps({ date: 0 });
    expect(wrapper.state().total).toBe(0);
    expect(wrapper.state().completed).toBe(true);
  });

  it('should not (try to) set state after component unmount', () => {
    expect(wrapper.state().completed).toBe(false);

    Date.now = jest.fn(() => wrapperDate - 6000);
    jest.runTimersToTime(6000);
    expect(wrapper.state().seconds).toBe(6);

    wrapper.instance().mounted = false;
    Date.now = jest.fn(() => wrapperDate - 3000);
    jest.runTimersToTime(3000);
    expect(wrapper.state().seconds).toBe(6);
  });

  afterEach(() => {
    try {
      wrapper.detach();
    } catch (e) {}
  });
});
