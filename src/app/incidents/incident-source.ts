import { Injectable } from '@angular/core';

import { Incident } from './incident';
import { FIXTURE_INCIDENTS, FIXTURE_NOW, FIXTURE_STALE_SINCE } from './incident-fixture';

export type BoardData =
  | { status: 'loading' }
  | { status: 'failed' }
  | { status: 'empty' }
  | { status: 'ready'; incidents: readonly Incident[]; now: string; staleSince: string | null };

// The board's only data source for milestone 1. `scenario` comes from the `?scenario=` query
// parameter and exists so the production build can be driven into every state deterministically
// from a browser test; a real backend would replace this class, not the component.
@Injectable({
  providedIn: 'root',
})
export class IncidentSource {
  load(scenario: string | undefined): BoardData {
    switch (scenario) {
      case 'loading':
        // Never resolves: a synchronous fixture has no real wait to show.
        return { status: 'loading' };
      case 'failed':
        return { status: 'failed' };
      case 'empty':
        return { status: 'empty' };
      case 'stale':
        return { status: 'ready', incidents: FIXTURE_INCIDENTS, now: FIXTURE_NOW, staleSince: FIXTURE_STALE_SINCE };
      default:
        return { status: 'ready', incidents: FIXTURE_INCIDENTS, now: FIXTURE_NOW, staleSince: null };
    }
  }
}
