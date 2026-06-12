import Countdown from './Countdown';
import ComponentEntry from './component';

describe('component entry point', () => {
  it('re-exports the Countdown component as its default export', () => {
    expect(ComponentEntry).toBe(Countdown);
  });
});
