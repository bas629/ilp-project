import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  loginForm: FormGroup;
  registerForm: FormGroup;
  loginError = '';
  registerError = '';
  registerSuccess = '';
  isLoading = false;

  constructor(private fb: FormBuilder, private auth: AuthService, private router: Router) {
    if (this.auth.isLoggedIn) this.router.navigate(['/dashboard']);

    this.loginForm = this.fb.group({
      email:    ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });

    this.registerForm = this.fb.group({
      name:     ['', Validators.required],
      email:    ['', [Validators.required, Validators.email]],
      mobileNo: ['', Validators.required],
      password: ['', [Validators.required, Validators.minLength(8),
        Validators.pattern(/^(?=.*[A-Z])(?=.*[0-9])(?=.*[^A-Za-z0-9]).{8,}$/)]]
    });
  }

  get lf() { return this.loginForm.controls; }
  get rf() { return this.registerForm.controls; }

  getPasswordRequirements() {
    const val = this.registerForm.get('password')?.value || '';
    return {
      length: val.length >= 8,
      hasUpper: /[A-Z]/.test(val),
      hasLower: /[a-z]/.test(val),
      hasNumber: /[0-9]/.test(val),
      hasSpecial: /[^A-Za-z0-9]/.test(val)
    };
  }

  onLogin(): void {
    if (this.loginForm.invalid) return;
    this.isLoading = true;
    this.loginError = '';
    const { email, password } = this.loginForm.value;
    this.auth.login({ email, password }).subscribe({
      next: (res) => {
        this.isLoading = false;
        if (res.success) this.router.navigate(['/dashboard']);
        else this.loginError = res.message || 'Login failed';
      },
      error: (err) => {
        this.isLoading = false;
        this.loginError = err.error?.message || 'Invalid credentials';
      }
    });
  }

  onRegister(): void {
    if (this.registerForm.invalid) return;
    this.isLoading = true;
    this.registerError = '';
    this.registerSuccess = '';
    this.auth.register(this.registerForm.value).subscribe({
      next: (res) => {
        this.isLoading = false;
        if (res.success) {
          this.registerSuccess = 'Account created! You can now sign in.';
          this.registerForm.reset();
        } else {
          this.registerError = res.message || 'Registration failed';
        }
      },
      error: (err) => {
        this.isLoading = false;
        this.registerError = err.error?.message || 'Registration failed';
      }
    });
  }
}
