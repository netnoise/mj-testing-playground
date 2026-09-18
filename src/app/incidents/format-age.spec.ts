import { formatAge } from './format-age';

describe('formatAge', () => {
  const now = '2026-09-19T09:00:00Z';

  it('shows minutes under an hour', () => {
    expect(formatAge('2026-09-19T08:57:00Z', now)).toBe('3m');
  });

  it('shows hours and remaining minutes under a day, and drops a zero remainder', () => {
    expect(formatAge('2026-09-19T07:48:00Z', now)).toBe('1h 12m');
    expect(formatAge('2026-09-19T04:00:00Z', now)).toBe('5h');
  });

  it('shows whole days from 24 hours', () => {
    expect(formatAge('2026-09-18T09:00:00Z', now)).toBe('1d');
  });

  it('never goes negative when the instant is in the future', () => {
    expect(formatAge('2026-09-19T09:05:00Z', now)).toBe('0m');
  });
});
