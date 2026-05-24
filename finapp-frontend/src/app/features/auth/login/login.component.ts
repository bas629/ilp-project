import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

function passwordStrengthValidator(control: AbstractControl): ValidationErrors | null {
  const v: string = control.value ?? '';
  const ok = /[A-Z]/.test(v) && /[a-z]/.test(v) && /[0-9]/.test(v) && /[^A-Za-z0-9]/.test(v);
  return ok ? null : { passwordWeak: true };
}

function matchPassword(group: AbstractControl): ValidationErrors | null {
  const pw  = group.get('password')?.value;
  const cpw = group.get('confirmPassword')?.value;
  return pw === cpw ? null : { passwordMismatch: true };
}

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  private fb     = inject(FormBuilder);
  private auth   = inject(AuthService);
  private router = inject(Router);

  loginError   = signal('');
  loginLocked  = signal(false);
  loginAttempts = 0;
  registerError = signal('');
  registerSuccess = signal(false);
  loading = signal(false);

  loginForm = this.fb.group({
    email:    ['', [Validators.required, Validators.email]],
    password: ['', Validators.required]
  });

  registerForm = this.fb.group({
    name:            ['', [Validators.required, Validators.minLength(3), Validators.pattern(/^[A-Za-z ]+$/)]],
    username:        ['', [Validators.required, Validators.minLength(5), Validators.pattern(/^\S+$/)]],
    email:           ['', [Validators.required, Validators.email]],
    countryCode:     ['+91'],
    mobile:          ['', [Validators.required, Validators.pattern(/^\d{8,10}$/)]],
    address:         ['', [Validators.required, Validators.minLength(10)]],
    password:        ['', [Validators.required, Validators.minLength(8), passwordStrengthValidator]],
    confirmPassword: ['', Validators.required]
  }, { validators: matchPassword });

  onLogin(): void {
    if (this.loginForm.invalid || this.loginLocked()) return;
    const { email, password } = this.loginForm.value;
    this.loading.set(true);
    this.auth.login({ email: email!, password: password! }).subscribe({
      next: res => {
        this.loading.set(false);
        if (res.status) {
          this.router.navigate(['/app/dashboard']);
        } else {
          this.loginAttempts++;
          this.loginError.set(res.message);
          if (this.loginAttempts >= 3) this.loginLocked.set(true);
        }
      },
      error: () => {
        this.loading.set(false);
        this.loginAttempts++;
        this.loginError.set('Login failed. Please try again.');
        if (this.loginAttempts >= 3) this.loginLocked.set(true);
      }
    });
  }

  onRegister(): void {
    if (this.registerForm.invalid) return;
    const v = this.registerForm.value;
    this.loading.set(true);
    this.auth.register({ name: v.name!, email: v.email!, password: v.password!, mobileNo: (v.countryCode ?? '+91') + v.mobile! }).subscribe({
      next: () => {
        this.loading.set(false);
        this.router.navigate(['/register/success'], {
          state: { userId: 'USR-' + Date.now(), name: v.name, email: v.email }
        });
      },
      error: () => {
        this.loading.set(false);
        this.registerError.set('Registration failed. Please try again.');
      }
    });
  }

  resetRegister(): void {
    this.registerForm.reset({ countryCode: '+91' });
    this.registerError.set('');
  }

  get rf() { return this.registerForm.controls; }
  get lf() { return this.loginForm.controls; }
}
