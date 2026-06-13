import CountdownJs, { CountdownStatus } from './CountdownJs';

describe('CountdownJs', () => {
  describe('setState', () => {
    it('merges state and notifies listeners when no callback is provided', () => {
      const countdown = new CountdownJs({ date: 2000, now: () => 1000 });
      const listener = jest.fn();
      countdown.subscribe(listener);
      const prevTimeDelta = countdown.state.timeDelta;

      // Called without the optional callback (the path setTimeDeltaState never takes).
      expect(() => countdown.setState({ status: CountdownStatus.PAUSED })).not.toThrow();

      expect(countdown.state.status).toBe(CountdownStatus.PAUSED);
      expect(countdown.state.timeDelta).toBe(prevTimeDelta);
      expect(listener).toHaveBeenCalledTimes(1);
    });
  });

  describe('calcOffsetStartTimestamp', () => {
    it('uses the injected now() so offset timing stays in sync with the time delta', () => {
      const now = jest.fn(() => 1000);
      const countdown = new CountdownJs({ date: 2000, now });
      expect(countdown.calcOffsetStartTimestamp()).toBe(1000);
    });

    it('falls back to Date.now when no now() is provided', () => {
      const dateNow = jest.spyOn(Date, 'now').mockReturnValue(5000);
      const countdown = new CountdownJs({ date: 6000 });
      expect(countdown.calcOffsetStartTimestamp()).toBe(5000);
      dateNow.mockRestore();
    });

    it('falls back to Date.now when now is explicitly undefined', () => {
      const dateNow = jest.spyOn(Date, 'now').mockReturnValue(5000);
      const countdown = new CountdownJs({ date: 6000, now: undefined });
      expect(() => countdown.calcOffsetStartTimestamp()).not.toThrow();
      expect(countdown.calcOffsetStartTimestamp()).toBe(5000);
      dateNow.mockRestore();
    });
  });
});
