import { Incident } from './incident';

// Fixed on purpose: "opened 3m ago" is computed against this instant, never the real clock, so the
// board renders the same text on every run.
export const FIXTURE_NOW = '2026-09-19T09:00:00Z';

/** When the stale scenario says the data was last refreshed (14 minutes before FIXTURE_NOW). */
export const FIXTURE_STALE_SINCE = '2026-09-19T08:46:00Z';

// Newest first. Three critical, four major, five minor.
export const FIXTURE_INCIDENTS: readonly Incident[] = [
  {
    id: 'INC-2891',
    title: 'Checkout API returning 5xx on payment capture',
    service: 'checkout-api',
    owner: 'R. Byrne',
    severity: 'critical',
    status: 'live',
    openedAt: '2026-09-19T08:57:00Z',
  },
  {
    id: 'INC-2890',
    title: 'Auth token refresh latency above SLO',
    service: 'auth-svc',
    owner: 'T. Kaur',
    severity: 'major',
    status: 'acked',
    openedAt: '2026-09-19T08:42:00Z',
  },
  {
    id: 'INC-2889',
    title: 'Search index lag on catalog re-embed job',
    service: 'search-index',
    owner: 'S. Osei',
    severity: 'minor',
    status: 'mitigating',
    openedAt: '2026-09-19T08:18:00Z',
  },
  {
    id: 'INC-2888',
    title: 'Primary database failover taking longer than 5 minutes',
    service: 'orders-db',
    owner: 'M. Rossi',
    severity: 'critical',
    status: 'acked',
    openedAt: '2026-09-19T08:05:00Z',
  },
  {
    id: 'INC-2887',
    title: 'Notification worker retry storm on webhook 429',
    service: 'notifications',
    owner: 'R. Byrne',
    severity: 'minor',
    status: 'mitigating',
    openedAt: '2026-09-19T07:48:00Z',
  },
  {
    id: 'INC-2886',
    title: 'Mobile API p99 latency doubled after deploy',
    service: 'mobile-api',
    owner: 'T. Kaur',
    severity: 'major',
    status: 'live',
    openedAt: '2026-09-19T07:12:00Z',
  },
  {
    id: 'INC-2885',
    title: 'Cron drift on nightly export scheduler',
    service: 'scheduler',
    owner: 'S. Osei',
    severity: 'minor',
    status: 'live',
    openedAt: '2026-09-19T06:40:00Z',
  },
  {
    id: 'INC-2884',
    title: 'Billing worker double-charged retried invoices',
    service: 'billing-worker',
    owner: 'T. Kaur',
    severity: 'major',
    status: 'resolved',
    openedAt: '2026-09-19T05:55:00Z',
  },
  {
    id: 'INC-2883',
    title: 'Login page returning 502 for EU users',
    service: 'edge-gateway',
    owner: 'M. Rossi',
    severity: 'critical',
    status: 'resolved',
    openedAt: '2026-09-19T04:00:00Z',
  },
  {
    id: 'INC-2882',
    title: 'Stale product images after CDN purge',
    service: 'cdn-edge',
    owner: 'S. Osei',
    severity: 'minor',
    status: 'resolved',
    openedAt: '2026-09-19T01:30:00Z',
  },
  {
    id: 'INC-2881',
    title: 'Email delivery delayed by provider throttling',
    service: 'notifications',
    owner: 'R. Byrne',
    severity: 'major',
    status: 'mitigating',
    openedAt: '2026-09-18T22:00:00Z',
  },
  {
    id: 'INC-2879',
    title: 'CDN edge cache purge delayed on image bundle',
    service: 'cdn-edge',
    owner: 'S. Osei',
    severity: 'minor',
    status: 'resolved',
    openedAt: '2026-09-18T09:00:00Z',
  },
];
