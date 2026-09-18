import { Component, computed, inject, input, signal } from '@angular/core';

import { formatAge } from '../incidents/format-age';
import { Incident, SEVERITY_LABEL, STATUS_LABEL, Severity } from '../incidents/incident';
import { IncidentSource } from '../incidents/incident-source';

type SeverityFilter = Severity | 'all';

const FILTERS: readonly { value: SeverityFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'critical', label: 'Critical' },
  { value: 'major', label: 'Major' },
  { value: 'minor', label: 'Minor' },
];

@Component({
  selector: 'app-board',
  templateUrl: './board.html',
  styleUrl: './board.scss',
})
export class Board {
  /** Bound from the `?scenario=` query parameter by the router (`withComponentInputBinding`). */
  readonly scenario = input<string>();

  protected readonly filters = FILTERS;
  protected readonly severityLabel = SEVERITY_LABEL;
  protected readonly statusLabel = STATUS_LABEL;

  protected readonly filter = signal<SeverityFilter>('all');
  private readonly selectedId = signal<string | null>(null);

  private readonly source = inject(IncidentSource);
  private readonly data = computed(() => this.source.load(this.scenario()));

  protected readonly status = computed(() => this.data().status);

  private readonly now = computed(() => {
    const data = this.data();
    return data.status === 'ready' ? data.now : '';
  });

  protected readonly staleAge = computed(() => {
    const data = this.data();
    return data.status === 'ready' && data.staleSince ? formatAge(data.staleSince, data.now) : null;
  });

  private readonly incidents = computed<readonly Incident[]>(() => {
    const data = this.data();
    return data.status === 'ready' ? data.incidents : [];
  });

  protected readonly counts = computed(() => {
    const incidents = this.incidents();
    const count = (severity: Severity) => incidents.filter((incident) => incident.severity === severity).length;
    return { all: incidents.length, critical: count('critical'), major: count('major'), minor: count('minor') };
  });

  protected readonly rows = computed(() => {
    const filter = this.filter();
    return filter === 'all' ? this.incidents() : this.incidents().filter((incident) => incident.severity === filter);
  });

  // Looked up in the filtered rows, so an incident the filter hides also stops being "selected".
  protected readonly selected = computed(() => this.rows().find((incident) => incident.id === this.selectedId()) ?? null);

  protected age(incident: Incident): string {
    return formatAge(incident.openedAt, this.now());
  }

  protected select(id: string): void {
    this.selectedId.set(id);
  }

  protected setFilter(filter: SeverityFilter): void {
    this.filter.set(filter);
  }
}
