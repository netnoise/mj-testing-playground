import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';

import { passwordMatchValidator, usernameTakenValidator } from './advanced-form.validators';

@Component({
  selector: 'app-advanced-form',
  templateUrl: './advanced-form.component.html',
  styleUrls: ['./advanced-form.component.sass']
})
export class AdvancedFormComponent implements OnInit, OnDestroy {
  static readonly COUNTRIES: string[] = ['United States', 'Canada', 'United Kingdom', 'Germany', 'Other'];

  form: FormGroup;
  submitted = false;
  submittedValue: object | null = null;
  countries = AdvancedFormComponent.COUNTRIES;

  private contactPreferenceSubscription: Subscription;

  constructor(private readonly fb: FormBuilder) {
    this.form = this.buildForm();
  }

  ngOnInit(): void {
    this.setupConditionalValidators();
  }

  ngOnDestroy(): void {
    if (this.contactPreferenceSubscription) {
      this.contactPreferenceSubscription.unsubscribe();
    }
  }

  get skills(): FormArray {
    return this.form.get('skills') as FormArray;
  }

  addSkill(): void {
    this.skills.push(this.buildSkillRow());
  }

  removeSkill(index: number): void {
    this.skills.removeAt(index);
  }

  onSubmit(): void {
    this.submitted = true;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.submittedValue = this.form.value;
  }

  onReset(): void {
    this.contactPreferenceSubscription.unsubscribe();
    this.submitted = false;
    this.submittedValue = null;
    this.form = this.buildForm();
    this.setupConditionalValidators();
  }

  private buildForm(): FormGroup {
    return this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(20), Validators.pattern(/^[a-zA-Z0-9_]+$/)],
        [usernameTakenValidator()]],
      email: ['', [Validators.required, Validators.email]],
      age: [null, [Validators.required, Validators.min(18), Validators.max(120)]],
      country: ['', Validators.required],
      subscribeNewsletter: [false],
      contactPreference: ['email', Validators.required],
      phone: [''],
      address: this.fb.group({
        street: ['', Validators.required],
        city: ['', Validators.required],
        postalCode: ['', [Validators.required, Validators.pattern(/^\d{4,10}$/)]]
      }),
      passwordGroup: this.fb.group({
        password: ['', [Validators.required, Validators.minLength(8)]],
        confirmPassword: ['', Validators.required]
      }, { validators: passwordMatchValidator }),
      skills: this.fb.array([this.buildSkillRow()])
    });
  }

  private buildSkillRow(): FormGroup {
    return this.fb.group({
      skillName: ['', Validators.required],
      yearsOfExperience: [0, [Validators.required, Validators.min(0), Validators.max(50)]]
    });
  }

  private setupConditionalValidators(): void {
    const phoneControl = this.form.get('phone');
    this.contactPreferenceSubscription = this.form.get('contactPreference').valueChanges.subscribe((value: string) => {
      if (value === 'phone') {
        phoneControl.setValidators([Validators.required, Validators.pattern(/^[0-9+()\- ]{7,20}$/)]);
      } else {
        phoneControl.clearValidators();
      }
      phoneControl.updateValueAndValidity();
    });
  }
}
