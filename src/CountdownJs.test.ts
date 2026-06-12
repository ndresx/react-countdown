import CountdownJs from './CountdownJs';

describe('CountdownJs', () => {
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
  });
});
