import { CountdownStatus } from './CountdownJs';
import useCountdown from './useCountdown';
import hookDefault, {
  useCountdown as useCountdownNamed,
  CountdownStatus as HookStatus,
} from './hook';

describe('hook entry point', () => {
  it('re-exports useCountdown as its default export', () => {
    expect(hookDefault).toBe(useCountdown);
  });

  it('re-exports useCountdown as a named export', () => {
    expect(useCountdownNamed).toBe(useCountdown);
  });

  it('re-exports the CountdownStatus enum', () => {
    expect(HookStatus).toBe(CountdownStatus);
  });
});
