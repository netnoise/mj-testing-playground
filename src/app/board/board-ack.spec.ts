import { TestBed } from '@angular/core/testing';
import { getByRole, queryByRole, within } from '@testing-library/dom';

import { IncidentSource } from '../incidents/incident-source';
import { Board } from './board';

// The fake is settled by hand, so each state between click and settlement is observable without a timer.
class ManualSource extends IncidentSource {
  readonly pending: { confirm: () => void; fail: () => void }[] = [];

  override acknowledge(): Promise<void> {
    return new Promise((resolve, reject) => this.pending.push({ confirm: resolve, fail: () => reject(new Error('500')) }));
  }
}

async function render() {
  TestBed.configureTestingModule({ providers: [{ provide: IncidentSource, useClass: ManualSource }] });
  const source = TestBed.inject(IncidentSource) as ManualSource;
  const fixture = TestBed.createComponent(Board);
  await fixture.whenStable();
  const el = fixture.nativeElement as HTMLElement;
  const click = async (element: HTMLElement) => {
    element.click();
    await fixture.whenStable();
  };
  const settle = async (outcome: 'confirm' | 'fail') => {
    source.pending[0][outcome]();
    // The component's `await` resumes a microtask after the promise settles; let it run before rendering.
    await Promise.resolve();
    await fixture.whenStable();
  };
  const row = (id: string) => getByRole(el, 'button', { name: id }).closest('tr') as HTMLElement;
  const details = () => getByRole(el, 'complementary', { name: 'Incident details' });
  return { el, click, settle, row, details };
}

describe('Board acknowledge', () => {
  it('offers Acknowledge for a live incident and for no other status', async () => {
    const { el, click, details } = await render();

    await click(getByRole(el, 'button', { name: 'INC-2891' }));
    expect(within(details()).getByRole('button', { name: 'Acknowledge' })).toBeTruthy();

    await click(getByRole(el, 'button', { name: 'INC-2890' }));
    expect(within(details()).queryByRole('button', { name: 'Acknowledge' })).toBeNull();
  });

  it('shows the incident as acknowledged at once, before the fake has answered', async () => {
    const { el, click, row, details } = await render();
    await click(getByRole(el, 'button', { name: 'INC-2891' }));

    await click(within(details()).getByRole('button', { name: 'Acknowledge' }));

    expect(within(row('INC-2891')).getByText('ACKED')).toBeTruthy();
    expect(within(details()).getByText('ACKED')).toBeTruthy();
    expect(queryByRole(el, 'alert')).toBeNull();
  });

  it('keeps the incident acknowledged once the fake confirms', async () => {
    const { el, click, settle, row, details } = await render();
    await click(getByRole(el, 'button', { name: 'INC-2891' }));
    await click(within(details()).getByRole('button', { name: 'Acknowledge' }));

    await settle('confirm');

    expect(within(row('INC-2891')).getByText('ACKED')).toBeTruthy();
    expect(queryByRole(el, 'alert')).toBeNull();
  });

  it('puts the incident back to live, says which one failed, and offers Acknowledge again when the fake rejects', async () => {
    const { el, click, settle, row, details } = await render();
    await click(getByRole(el, 'button', { name: 'INC-2891' }));
    await click(within(details()).getByRole('button', { name: 'Acknowledge' }));

    await settle('fail');

    expect(within(row('INC-2891')).getByText('LIVE')).toBeTruthy();
    expect(within(details()).getByText('LIVE')).toBeTruthy();
    expect(getByRole(el, 'alert').textContent).toContain('INC-2891');
    expect(within(details()).getByRole('button', { name: 'Acknowledge' })).toBeTruthy();
  });
});
