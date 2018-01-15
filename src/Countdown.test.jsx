/* eslint-disable react/prop-types */
import React from 'react';
import Adapter from 'enzyme-adapter-react-16';
import Enzyme, { mount, shallow } from 'enzyme';

import Countdown, { zeroPad, getTimeDifference } from './Countdown';

Enzyme.configure({ adapter: new Adapter() });

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

  let wrapper = null;
  let wrapperDate = null;

  beforeEach(() => {
    Date.now = now;
    const date = Date.now() + 10000;
    const root = document.createElement('div');
    wrapperDate = date;
    wrapper = mount(<Countdown date={date} />, { attachTo: root });
  });

  it('compares snapshot of countdown with custom renderer', () => {
    wrapper = shallow(
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

  it('compares snapshots and correct mounting of React children on countdown end', () => {
    class Completionist extends React.Component {
      componentDidMount() {}

      render() {
        return (
          <div>
            Completed! {this.props.name} {this.props.children}
          </div>
        );
      }
    }

    let completionist = null;
    Completionist.prototype.componentDidMount = jest.fn();

    wrapper = mount(
      <Countdown date={Date.now() + timeDiff} zeroPadLength={0}>
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
    expect(completionist.props).toEqual({
      countdown: {
        ...computedProps,
        ...wrapper.state(),
      },
      name: 'master',
      children: 'Another child',
    });
    expect(wrapper).toMatchSnapshot();
  });

  it('compares snapshot of countdown with daysInHours => true', () => {
    wrapper = shallow(<Countdown date={Date.now() + timeDiff} daysInHours />);
    expect(wrapper).toMatchSnapshot();
  });

  it('should trigger onTick and onComplete callbacks', () => {
    const onTick = jest.fn(stats => {
      expect(stats).toEqual(getTimeDifference(wrapperDate));
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
    expect(zeroPad(1, 0)).toBe(1);
    expect(zeroPad(1, 1)).toBe('1');
  });

  it('should not zero-pad 123 if length is 3', () => {
    expect(zeroPad(123, 3)).toBe('123');
    expect(zeroPad(123, 4)).toBe('0123');
  });
});

describe('getTimeDifference', () => {
  it('should return a time difference of 0s', () => {
    expect(getTimeDifference(Date.now())).toEqual({
      ...defaultStats,
      completed: true,
    });
  });

  it('should return a time difference of 0s if values for start and current date are the same', () => {
    expect(getTimeDifference(Date.now())).toEqual({
      ...defaultStats,
      completed: true,
    });
    expect(getTimeDifference(Date.now() + 10, { now: () => Date.now() + 10 })).toEqual({
      ...defaultStats,
      completed: true,
    });
  });

  it('should calculate the time difference with a precision of 0', () => {
    expect(getTimeDifference(Date.now() + timeDiff)).toEqual({
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
    expect(getTimeDifference(Date.now() + timeDiff, { precision: 3 })).toEqual({
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
    expect(getTimeDifference('Thu Dec 23 2017 01:38:10:456', { precision: 3 })).toEqual({
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
    expect(getTimeDifference(total, { controlled: true })).toEqual({
      total: total - 3,
      days: 1,
      hours: 1,
      minutes: 18,
      seconds: 40,
      milliseconds: 0,
      completed: false,
    });

    expect(getTimeDifference(total, { precision: 3, controlled: true })).toEqual({
      total,
      days: 1,
      hours: 1,
      minutes: 18,
      seconds: 40,
      milliseconds: 3,
      completed: false,
    });
  });
});
