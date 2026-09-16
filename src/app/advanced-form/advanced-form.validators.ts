import { AbstractControl, AsyncValidatorFn, ValidationErrors } from '@angular/forms';
import { Observable, of, timer } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';

export const USERNAME_CHECK_DELAY_MS = 500;
const TAKEN_USERNAMES: string[] = ['admin', 'root', 'test', 'angular'];

export function passwordMatchValidator(group: AbstractControl): ValidationErrors | null {
  const password = group.get('password');
  const confirmPassword = group.get('confirmPassword');
  if (!password || !confirmPassword || !confirmPassword.value) {
    return null;
  }
  return password.value === confirmPassword.value ? null : { passwordMismatch: true };
}

export function usernameTakenValidator(delayMs: number = USERNAME_CHECK_DELAY_MS): AsyncValidatorFn {
  return (control: AbstractControl): Observable<ValidationErrors | null> => {
    if (!control.value) {
      return of(null);
    }
    return timer(delayMs).pipe(
      switchMap(() => of(TAKEN_USERNAMES.includes(String(control.value).toLowerCase()))),
      map((taken: boolean) => (taken ? { usernameTaken: true } : null))
    );
  };
}
