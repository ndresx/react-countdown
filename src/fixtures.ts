type TMockDateNow = {
  readonly now: jest.Mock;
  readonly timeDiff: number;
};

export function mockDateNow(): TMockDateNow {
  const timeDiff = 90110456;
  const now = jest.fn(() => 1482363367071);
  Date.now = now;

  return { now, timeDiff };
}

export const defaultStats = {
  total: 0,
  days: 0,
  hours: 0,
  minutes: 0,
  seconds: 0,
  milliseconds: 0,
  completed: false,
};
