import { async, ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';

import { AdvancedFormComponent } from './advanced-form.component';
import { USERNAME_CHECK_DELAY_MS } from './advanced-form.validators';

describe('AdvancedFormComponent', () => {
  let component: AdvancedFormComponent;
  let fixture: ComponentFixture<AdvancedFormComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [AdvancedFormComponent],
      imports: [ReactiveFormsModule]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AdvancedFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  function fillValidForm(username: string): void {
    component.form.patchValue({
      username,
      email: 'user@example.com',
      age: 30,
      country: 'Canada',
      subscribeNewsletter: true,
      contactPreference: 'email',
      address: {
        street: '123 Main St',
        city: 'Springfield',
        postalCode: '12345'
      },
      passwordGroup: {
        password: 'longenough1',
        confirmPassword: 'longenough1'
      }
    });
    component.skills.at(0).patchValue({ skillName: 'Angular', yearsOfExperience: 5 });
  }

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should be invalid initially', () => {
    expect(component.form.invalid).toBe(true);
  });

  it('should seed the skills FormArray with exactly one row', () => {
    expect(component.skills.length).toBe(1);
  });

  describe('username', () => {
    it('is required', () => {
      const control = component.form.get('username');
      control.setValue('');
      expect(control.errors['required']).toBeTruthy();
    });

    it('enforces a minimum length', () => {
      const control = component.form.get('username');
      control.setValue('ab');
      expect(control.errors['minlength']).toBeTruthy();
    });

    it('enforces a maximum length', () => {
      const control = component.form.get('username');
      control.setValue('a'.repeat(21));
      expect(control.errors['maxlength']).toBeTruthy();
    });

    it('enforces an allowed character pattern', () => {
      const control = component.form.get('username');
      control.setValue('bad name!');
      expect(control.errors['pattern']).toBeTruthy();
    });

    it('is pending while the async check runs, then flags a taken name', fakeAsync(() => {
      const control = component.form.get('username');
      control.setValue('admin');
      expect(control.pending).toBe(true);
      tick(USERNAME_CHECK_DELAY_MS);
      expect(control.errors['usernameTaken']).toBeTruthy();
    }));

    it('resolves valid for an available name', fakeAsync(() => {
      const control = component.form.get('username');
      control.setValue('newuser123');
      tick(USERNAME_CHECK_DELAY_MS);
      expect(control.valid).toBe(true);
    }));
  });

  describe('email', () => {
    it('is required', () => {
      const control = component.form.get('email');
      control.setValue('');
      expect(control.errors['required']).toBeTruthy();
    });

    it('validates email format', () => {
      const control = component.form.get('email');
      control.setValue('not-an-email');
      expect(control.errors['email']).toBeTruthy();
      control.setValue('a@b.com');
      expect(control.valid).toBe(true);
    });
  });

  describe('age', () => {
    it('is required', () => {
      const control = component.form.get('age');
      control.setValue(null);
      expect(control.errors['required']).toBeTruthy();
    });

    it('enforces a minimum', () => {
      const control = component.form.get('age');
      control.setValue(17);
      expect(control.errors['min']).toBeTruthy();
    });

    it('enforces a maximum', () => {
      const control = component.form.get('age');
      control.setValue(121);
      expect(control.errors['max']).toBeTruthy();
    });

    it('accepts the boundary values', () => {
      const control = component.form.get('age');
      control.setValue(18);
      expect(control.valid).toBe(true);
      control.setValue(120);
      expect(control.valid).toBe(true);
    });
  });

  describe('country', () => {
    it('is required', () => {
      const control = component.form.get('country');
      control.setValue('');
      expect(control.errors['required']).toBeTruthy();
    });
  });

  describe('contactPreference / phone conditional validation', () => {
    it('leaves phone optional when contact preference is the default (email)', () => {
      const phoneControl = component.form.get('phone');
      phoneControl.setValue('');
      expect(phoneControl.valid).toBe(true);
    });

    it('makes phone required once contact preference switches to phone', () => {
      component.form.get('contactPreference').setValue('phone');
      const phoneControl = component.form.get('phone');
      phoneControl.setValue('');
      expect(phoneControl.errors['required']).toBeTruthy();
    });

    it('accepts a well-formed phone number once contact preference is phone', () => {
      component.form.get('contactPreference').setValue('phone');
      const phoneControl = component.form.get('phone');
      phoneControl.setValue('555-123-4567');
      expect(phoneControl.valid).toBe(true);
    });

    it('clears phone validators when switching away from phone', () => {
      component.form.get('contactPreference').setValue('phone');
      const phoneControl = component.form.get('phone');
      phoneControl.setValue('not-a-phone!!');
      expect(phoneControl.invalid).toBe(true);
      component.form.get('contactPreference').setValue('email');
      expect(phoneControl.valid).toBe(true);
    });

    it('hides the phone field in the template by default', () => {
      expect(fixture.debugElement.query(By.css('#phone'))).toBeNull();
    });

    it('shows the phone field in the template once contact preference is phone', () => {
      component.form.get('contactPreference').setValue('phone');
      fixture.detectChanges();
      expect(fixture.debugElement.query(By.css('#phone'))).not.toBeNull();
    });
  });

  describe('address', () => {
    it('requires street', () => {
      const control = component.form.get('address.street');
      control.setValue('');
      expect(control.errors['required']).toBeTruthy();
    });

    it('requires city', () => {
      const control = component.form.get('address.city');
      control.setValue('');
      expect(control.errors['required']).toBeTruthy();
    });

    it('validates postal code format', () => {
      const control = component.form.get('address.postalCode');
      control.setValue('abc');
      expect(control.errors['pattern']).toBeTruthy();
      control.setValue('12345');
      expect(control.valid).toBe(true);
    });
  });

  describe('passwordGroup', () => {
    it('flags a mismatch on the group, not on the individual controls', () => {
      const group = component.form.get('passwordGroup');
      group.setValue({ password: 'longenough1', confirmPassword: 'different1' });
      expect(group.errors['passwordMismatch']).toBeTruthy();
      expect(group.get('password').errors).toBeNull();
      expect(group.get('confirmPassword').errors).toBeNull();
    });

    it('is valid once both passwords match and meet their own validators', () => {
      const group = component.form.get('passwordGroup');
      group.setValue({ password: 'longenough1', confirmPassword: 'longenough1' });
      expect(group.valid).toBe(true);
    });
  });

  describe('error message rendering', () => {
    it('shows the required message for username once touched', () => {
      const control = component.form.get('username');
      control.setValue('');
      control.markAsTouched();
      fixture.detectChanges();
      expect(fixture.nativeElement.textContent).toContain('Username is required.');
    });

    it('swaps the error message as the failing validator changes', () => {
      const control = component.form.get('username');
      control.setValue('ab');
      control.markAsTouched();
      fixture.detectChanges();
      expect(fixture.nativeElement.textContent).toContain('Must be at least 3 characters.');
      expect(fixture.nativeElement.textContent).not.toContain('Username is required.');
    });

    it('shows the password mismatch message once confirmPassword is touched', () => {
      component.form.get('passwordGroup').setValue({ password: 'longenough1', confirmPassword: 'different1' });
      component.form.get('passwordGroup.confirmPassword').markAsTouched();
      fixture.detectChanges();
      expect(fixture.nativeElement.textContent).toContain('Passwords do not match.');
    });
  });

  describe('skills FormArray', () => {
    it('adds a new row', () => {
      component.addSkill();
      expect(component.skills.length).toBe(2);
      fixture.detectChanges();
      expect(fixture.debugElement.queryAll(By.css('.skill-row')).length).toBe(2);
    });

    it('removes the correct row', () => {
      component.addSkill();
      component.skills.at(0).patchValue({ skillName: 'Angular', yearsOfExperience: 5 });
      component.skills.at(1).patchValue({ skillName: 'RxJS', yearsOfExperience: 3 });
      component.removeSkill(0);
      expect(component.skills.length).toBe(1);
      expect(component.skills.at(0).value.skillName).toBe('RxJS');
    });

    it('invalidates the form when a row has an empty skill name', () => {
      component.skills.at(0).patchValue({ skillName: '', yearsOfExperience: 5 });
      expect(component.skills.invalid).toBe(true);
      expect(component.form.invalid).toBe(true);
    });

    it('disables the remove button when only one row remains', () => {
      fixture.detectChanges();
      const button = fixture.debugElement.query(By.css('.skill-row button'));
      expect(button.nativeElement.disabled).toBe(true);
    });

    it('enables the remove button once a second row is added', () => {
      component.addSkill();
      fixture.detectChanges();
      const buttons = fixture.debugElement.queryAll(By.css('.skill-row button'));
      expect(buttons[0].nativeElement.disabled).toBe(false);
    });
  });

  describe('onSubmit', () => {
    it('marks all controls as touched and does not set submittedValue when the form is invalid', () => {
      component.onSubmit();
      expect(component.submitted).toBe(true);
      expect(component.submittedValue).toBeNull();
      expect(component.form.get('username').touched).toBe(true);
      expect(component.form.get('address.street').touched).toBe(true);
    });

    it('renders the fix-the-errors message once submitted invalid', () => {
      component.onSubmit();
      fixture.detectChanges();
      expect(fixture.nativeElement.textContent).toContain('Please fix the errors above before submitting.');
    });

    it('captures the form value once the form is valid', fakeAsync(() => {
      fillValidForm('newuser123');
      tick(USERNAME_CHECK_DELAY_MS);
      expect(component.form.valid).toBe(true);

      component.onSubmit();

      expect(component.submittedValue).toEqual(component.form.value);
      expect((component.submittedValue as any).address.city).toBe('Springfield');
      expect((component.submittedValue as any).passwordGroup.password).toBe('longenough1');
      expect((component.submittedValue as any).skills.length).toBe(1);
    }));

    it('renders the submitted value once valid', fakeAsync(() => {
      fillValidForm('newuser123');
      tick(USERNAME_CHECK_DELAY_MS);

      component.onSubmit();
      fixture.detectChanges();

      const pre = fixture.debugElement.query(By.css('.submitted-value'));
      expect(pre).not.toBeNull();
      expect(pre.nativeElement.textContent).toContain('Springfield');
    }));
  });

  describe('onReset', () => {
    it('clears submission state and rebuilds the form', fakeAsync(() => {
      fillValidForm('newuser123');
      tick(USERNAME_CHECK_DELAY_MS);
      component.onSubmit();
      component.addSkill();

      component.onReset();

      expect(component.submitted).toBe(false);
      expect(component.submittedValue).toBeNull();
      expect(component.form.pristine).toBe(true);
      expect(component.skills.length).toBe(1);
    }));

    it('re-attaches the conditional validator exactly once after reset', () => {
      component.onReset();
      const phoneControl = component.form.get('phone');
      jest.spyOn(phoneControl, 'setValidators');

      component.form.get('contactPreference').setValue('phone');

      expect(phoneControl.setValidators).toHaveBeenCalledTimes(1);
    });
  });

  describe('ngOnDestroy', () => {
    it('unsubscribes from the contactPreference subscription', () => {
      const subscription = (component as any).contactPreferenceSubscription;
      jest.spyOn(subscription, 'unsubscribe');

      fixture.destroy();

      expect(subscription.unsubscribe).toHaveBeenCalled();
    });
  });
});
