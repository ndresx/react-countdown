import Countdown from './Countdown';
import { CountdownStatus } from './CountdownJs';
import ComponentEntry, { CountdownStatus as ComponentStatus } from './component';

describe('component entry point', () => {
  it('re-exports the Countdown component as its default export', () => {
    expect(ComponentEntry).toBe(Countdown);
  });

  it('re-exports the CountdownStatus enum', () => {
    expect(ComponentStatus).toBe(CountdownStatus);
  });
});
