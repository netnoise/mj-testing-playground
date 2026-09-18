import { TestBed } from '@angular/core/testing';

import { FIXTURE_INCIDENTS, FIXTURE_STALE_SINCE } from './incident-fixture';
import { IncidentSource } from './incident-source';

describe('IncidentSource', () => {
  let source: IncidentSource;

  beforeEach(() => {
    source = TestBed.inject(IncidentSource);
  });

  it('reports each non-data scenario as its own status', () => {
    expect(source.load('loading').status).toBe('loading');
    expect(source.load('failed').status).toBe('failed');
    expect(source.load('empty').status).toBe('empty');
  });

  it('serves the whole fixture, fresh, with no scenario or an unknown one', () => {
    for (const scenario of [undefined, 'nonsense']) {
      expect(source.load(scenario)).toMatchObject({ status: 'ready', staleSince: null });
      expect((source.load(scenario) as { incidents: unknown[] }).incidents).toHaveLength(FIXTURE_INCIDENTS.length);
    }
  });

  it('serves the same incidents for the stale scenario, marked with when they were last refreshed', () => {
    expect(source.load('stale')).toMatchObject({ status: 'ready', staleSince: FIXTURE_STALE_SINCE });
  });
});
