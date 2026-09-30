import { TestBed } from '@angular/core/testing';

import { ACK_DELAY_MS, IncidentSource } from './incident-source';

describe('IncidentSource acknowledge', () => {
  let source: IncidentSource;

  beforeEach(() => {
    jest.useFakeTimers();
    source = TestBed.inject(IncidentSource);
  });

  afterEach(() => jest.useRealTimers());

  it('confirms an acknowledgement after a short delay, never before', async () => {
    let settled = false;
    const done = source.acknowledge('INC-2891', undefined).then(() => (settled = true));

    await jest.advanceTimersByTimeAsync(ACK_DELAY_MS - 1);
    expect(settled).toBe(false);

    await jest.advanceTimersByTimeAsync(1);
    await done;
    expect(settled).toBe(true);
  });

  it('rejects the acknowledgement for the ack-failed scenario, after the same delay', async () => {
    const outcome = source.acknowledge('INC-2891', 'ack-failed').then(() => 'confirmed', () => 'rejected');

    await jest.advanceTimersByTimeAsync(ACK_DELAY_MS);

    expect(await outcome).toBe('rejected');
  });
});
