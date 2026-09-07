import { fakeAsync, tick } from '@angular/core/testing';
import { AbstractControl, FormControl, FormGroup, ValidationErrors } from '@angular/forms';
import { Observable } from 'rxjs';

import { passwordMatchValidator, usernameTakenValidator } from './advanced-form.validators';

function runUsernameCheck(control: AbstractControl, delayMs: number, onResult: (value: ValidationErrors | null) => void): void {
  (usernameTakenValidator(delayMs)(control) as Observable<ValidationErrors | null>).subscribe(onResult);
}

describe('passwordMatchValidator', () => {
  function buildGroup(password: string, confirmPassword: string): FormGroup {
    return new FormGroup({
      password: new FormControl(password),
      confirmPassword: new FormControl(confirmPassword)
    });
  }

  it('returns null when confirmPassword is empty', () => {
    expect(passwordMatchValidator(buildGroup('secret123', ''))).toBeNull();
  });

  it('returns null when passwords match', () => {
    expect(passwordMatchValidator(buildGroup('secret123', 'secret123'))).toBeNull();
  });

  it('returns passwordMismatch when passwords differ', () => {
    expect(passwordMatchValidator(buildGroup('secret123', 'other456'))).toEqual({ passwordMismatch: true });
  });
});

describe('usernameTakenValidator', () => {
  const delayMs = 10;

  it('emits null immediately for an empty value', fakeAsync(() => {
    let result: ValidationErrors | null | undefined;
    runUsernameCheck(new FormControl(''), delayMs, (value) => (result = value));
    tick(delayMs);
    expect(result).toBeNull();
  }));

  it('emits usernameTaken for a taken name', fakeAsync(() => {
    let result: ValidationErrors | null | undefined;
    runUsernameCheck(new FormControl('admin'), delayMs, (value) => (result = value));
    tick(delayMs);
    expect(result).toEqual({ usernameTaken: true });
  }));

  it('emits null for an available name', fakeAsync(() => {
    let result: ValidationErrors | null | undefined;
    runUsernameCheck(new FormControl('newuser123'), delayMs, (value) => (result = value));
    tick(delayMs);
    expect(result).toBeNull();
  }));

  it('matches taken names case-insensitively', fakeAsync(() => {
    let result: ValidationErrors | null | undefined;
    runUsernameCheck(new FormControl('Admin'), delayMs, (value) => (result = value));
    tick(delayMs);
    expect(result).toEqual({ usernameTaken: true });
  }));
});
