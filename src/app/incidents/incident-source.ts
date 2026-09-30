import { Injectable } from '@angular/core';

import { Incident } from './incident';
import { FIXTURE_INCIDENTS, FIXTURE_NOW, FIXTURE_STALE_SINCE } from './incident-fixture';

export type BoardData =
  | { status: 'loading' }
  | { status: 'failed' }
  | { status: 'empty' }
  | { status: 'ready'; incidents: readonly Incident[]; now: string; staleSince: string | null };

// How long the fake takes to answer an acknowledgement. Long enough for a browser test to see the
// optimistic state before the answer arrives, short enough not to slow the suite.
export const ACK_DELAY_MS = 400;

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

  // The `ack-failed` scenario loads the normal fixture (the default branch above) and only changes
  // how this call ends, so the board starts healthy and fails at the moment under test.
  acknowledge(_id: string, scenario: string | undefined): Promise<void> {
    return new Promise((resolve, reject) => {
      setTimeout(() => (scenario === 'ack-failed' ? reject(new Error('acknowledge failed')) : resolve()), ACK_DELAY_MS);
    });
  }
}
