export type Severity = 'critical' | 'major' | 'minor';

export type IncidentStatus = 'live' | 'acked' | 'mitigating' | 'resolved';

export interface Incident {
  id: string;
  title: string;
  service: string;
  owner: string;
  severity: Severity;
  status: IncidentStatus;
  /** ISO 8601 instant. */
  openedAt: string;
}

// Severity is always carried as text so it never depends on colour alone (decision 0008 §4).
export const SEVERITY_LABEL: Record<Severity, { short: string; long: string }> = {
  critical: { short: 'CRIT', long: 'Critical' },
  major: { short: 'MAJ', long: 'Major' },
  minor: { short: 'MIN', long: 'Minor' },
};

export const STATUS_LABEL: Record<IncidentStatus, string> = {
  live: 'LIVE',
  acked: 'ACKED',
  mitigating: 'MITIGATING',
  resolved: 'RESOLVED',
};
