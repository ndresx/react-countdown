import React from 'react';
import { mount, shallow } from 'enzyme';
import Countdown, { leftPad, getTimeDifference } from './Countdown';

const timeDiff = 90110456;
const now = jest.fn(() => 1482363367071);
Date.now = now;

describe('<Countdown />', () => {
  jest.useFakeTimers();

  it('compares snapshot of countdown with custom renderer', () => {
    const wrapper = shallow(
      <Countdown
        date={Date.now() + timeDiff}
        renderer={props => <div>{props.days}{props.hours}{props.minutes}{props.seconds}</div>}
      />
    );
    expect(wrapper).toMatchSnapshot();
  });

  it('compares snapshot of countdown with daysInHours => true', () => {
    const wrapper = shallow(<Countdown date={Date.now() + timeDiff} daysInHours />);
    expect(wrapper).toMatchSnapshot();
  });

  let wrapper = null;
  let wrapperDate = null;

  beforeEach(() => {
    const date = Date.now() + 10000;
    const root = document.createElement('div');
    wrapperDate = date;
    wrapper = mount(<Countdown date={date} />, { attachTo: root });
  });

  it('should trigger onTick and onComplete callbacks', () => {
    const onTick = jest.fn(stats => {
      expect(stats).toEqual(getTimeDifference(wrapperDate, Date.now));
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
    expect(wrapper).toMatchSnapshot();

    // Forward 3 more seconds
    Date.now = jest.fn(() => wrapperDate - 1000);
    jest.runTimersToTime(3000);
    expect(onTick.mock.calls.length).toBe(9);
    expect(wrapper.state().seconds).toBe(1);

    // The End: onComplete callback gets triggered instead of onTick
    Date.now = jest.fn(() => wrapperDate);
    jest.runTimersToTime(1000);
    expect(onTick.mock.calls.length).toBe(9);
    expect(onComplete.mock.calls.length).toBe(1);
  });

  it('should run through the controlled component by updating the date prop', () => {
    const root = document.createElement('div');
    wrapper = mount(<Countdown date={1000} controlled />, { attachTo: root });
    expect(wrapper.instance().interval).toBeUndefined();

    wrapper.setProps({ date: 0 });
    expect(wrapper.state().total).toBe(0);
  });

  afterEach(() => {
    wrapper.detach();
  });
});

describe('leftPad', () => {
  it('should add two 0s in front of 2', () => {
    expect(leftPad(2, 3)).toBe('002');
  });

  it('should add one 0 in front of "ab"', () => {
    expect(leftPad('ab', 3)).toBe('0ab');
  });

  it('should add three 0s', () => {
    expect(leftPad('', 3)).toBe('000');
  });

  it('should not left-pad 1 when length is not defined or 0', () => {
    expect(leftPad(1)).toBe('1');
    expect(leftPad(1, 0)).toBe('1');
  });

  it('should not left-pad 123 when passing 3 as length', () => {
    expect(leftPad(123, 3)).toBe('123');
  });
});

describe('getTimeDifference', () => {
  const stats = {
    total: 0,
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    milliseconds: 0,
  };

  it('should return a time difference of 0 seconds', () => {
    expect(getTimeDifference(Date.now())).toEqual(stats);
  });

  it('should return a time difference of 0 seconds if values for start and current date are the same', () => {
    expect(getTimeDifference(Date.now(), Date.now)).toEqual(stats);
    expect(getTimeDifference(Date.now() + 10, () => Date.now() + 10)).toEqual(stats);
  });

  it('should calculate the time difference', () => {
    expect(getTimeDifference(Date.now() + timeDiff)).toEqual({
      total: timeDiff,
      days: 1,
      hours: 1,
      minutes: 1,
      seconds: 50,
      milliseconds: 456,
    });
  });

  it('should calculate the time difference by passing a date string', () => {
    Date.now = jest.fn(() => new Date('Thu Dec 22 2016 00:36:07').getTime());
    expect(getTimeDifference('Thu Dec 23 2017 01:38:10:456')).toEqual({
      total: 31626123456,
      days: 366,
      hours: 1,
      minutes: 2,
      seconds: 3,
      milliseconds: 456,
    });
  });

  it('should calculate the time difference when controlled is true', () => {
    const total = 91120003;
    expect(getTimeDifference(total, undefined, true)).toEqual({
      total,
      days: 1,
      hours: 1,
      minutes: 18,
      seconds: 40,
      milliseconds: 3,
    });
  });
});
