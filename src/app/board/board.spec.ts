import { TestBed } from '@angular/core/testing';
import { getAllByRole, getByRole, queryByRole, within } from '@testing-library/dom';

import { FIXTURE_INCIDENTS } from '../incidents/incident-fixture';
import { SEVERITY_LABEL } from '../incidents/incident';
import { Board } from './board';

// Every query is by role and accessible name: nothing here depends on a CSS class, so a harmless
// refactor cannot fail these and a lost heading or lost severity text can.
async function render(scenario?: string) {
  const fixture = TestBed.createComponent(Board);
  fixture.componentRef.setInput('scenario', scenario);
  await fixture.whenStable();
  const el = fixture.nativeElement as HTMLElement;
  const click = async (element: HTMLElement) => {
    element.click();
    await fixture.whenStable();
  };
  return { el, click };
}

describe('Board', () => {
  it('lists every incident in a table with column headers, and shows severity as visible text', async () => {
    const { el } = await render();

    expect(getByRole(el, 'heading', { level: 1 }).textContent).toBe('Incident Board');
    expect(getAllByRole(el, 'columnheader').map((header) => header.textContent)).toEqual([
      'Sev', 'ID', 'Title', 'Service', 'Owner', 'Opened', 'Status',
    ]);
    expect(getAllByRole(el, 'row')).toHaveLength(FIXTURE_INCIDENTS.length + 1);

    for (const incident of FIXTURE_INCIDENTS) {
      const row = getByRole(el, 'button', { name: incident.id }).closest('tr') as HTMLElement;
      expect(within(row).getByText(SEVERITY_LABEL[incident.severity].short)).toBeTruthy();
    }
  });

  it('narrows the rows to the chosen severity and marks that filter as pressed', async () => {
    const { el, click } = await render();

    await click(getByRole(el, 'button', { name: /^Critical/ }));

    const critical = FIXTURE_INCIDENTS.filter((incident) => incident.severity === 'critical');
    expect(getAllByRole(el, 'row')).toHaveLength(critical.length + 1);
    expect(getByRole(el, 'button', { name: /^Critical/ }).getAttribute('aria-pressed')).toBe('true');
    expect(getByRole(el, 'button', { name: /^All/ }).getAttribute('aria-pressed')).toBe('false');
    expect(queryByRole(el, 'button', { name: 'INC-2890' })).toBeNull();
  });

  it('shows the selected incident\'s details with its severity spelled out', async () => {
    const { el, click } = await render();

    await click(getByRole(el, 'button', { name: 'INC-2891' }));

    const details = getByRole(el, 'complementary', { name: 'Incident details' });
    expect(within(details).getByRole('heading', { level: 2 }).textContent).toBe('INC-2891');
    expect(within(details).getByText('Critical')).toBeTruthy();
    expect(getByRole(el, 'button', { name: 'INC-2891' }).getAttribute('aria-pressed')).toBe('true');
  });

  it('stops showing details for an incident the active filter hides', async () => {
    const { el, click } = await render();
    await click(getByRole(el, 'button', { name: 'INC-2891' }));

    await click(getByRole(el, 'button', { name: /^Minor/ }));

    const details = getByRole(el, 'complementary', { name: 'Incident details' });
    expect(within(details).queryByRole('heading', { level: 2 })).toBeNull();
    expect(within(details).getByText('Select an incident to see its details.')).toBeTruthy();
  });

  it('announces a failed load as an alert and renders no table', async () => {
    const { el } = await render('failed');

    expect(getByRole(el, 'alert').textContent).toContain('Could not load incidents');
    expect(queryByRole(el, 'table')).toBeNull();
  });

  it('says so for loading and empty, without a table', async () => {
    const loading = await render('loading');
    expect(getByRole(loading.el, 'status').textContent).toContain('Loading incidents');
    expect(queryByRole(loading.el, 'table')).toBeNull();

    const empty = await render('empty');
    expect(getByRole(empty.el, 'status').textContent).toContain('No incidents right now');
    expect(queryByRole(empty.el, 'table')).toBeNull();
  });

  it('keeps the table and says how old stale data is', async () => {
    const { el } = await render('stale');

    expect(getByRole(el, 'status').textContent).toContain('last updated 14m ago');
    expect(getAllByRole(el, 'row')).toHaveLength(FIXTURE_INCIDENTS.length + 1);
  });
});
