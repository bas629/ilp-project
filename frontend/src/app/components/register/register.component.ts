import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { NotificationService } from '../../core/notification.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent {
  registerForm: FormGroup;
  errorMessage: string | null = null;
  isLoading = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private notifService: NotificationService
  ) {
    if (this.authService.isLoggedIn) {
      this.router.navigate(['/dashboard']);
    }

    this.registerForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      mobileNo: ['', [Validators.required, Validators.pattern(/^[0-9+ ]{10,15}$/)]],
      password: ['', [Validators.required, Validators.minLength(8), this.strongPasswordValidator()]]
    });
  }

  strongPasswordValidator() {
    return (control: any) => {
      const val = control.value || '';
      const hasUpper = /[A-Z]/.test(val);
      const hasLower = /[a-z]/.test(val);
      const hasNumber = /[0-9]/.test(val);
      const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(val);
      const valid = val.length >= 8 && hasUpper && hasLower && hasNumber && hasSpecial;
      return valid ? null : { strongPassword: true };
    };
  }

  getPasswordRequirements() {
    const val = this.registerForm.get('password')?.value || '';
    return {
      length: val.length >= 8,
      hasUpper: /[A-Z]/.test(val),
      hasLower: /[a-z]/.test(val),
      hasNumber: /[0-9]/.test(val),
      hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(val)
    };
  }

  onSubmit() {
    if (this.registerForm.invalid) {
      this.errorMessage = 'Please fix the errors in the form before submitting.';
      this.notifService.error(this.errorMessage!);
      return;
    }

    this.isLoading = true;
    this.errorMessage = null;

    this.authService.register(this.registerForm.value).subscribe({
      next: (res) => {
        this.isLoading = false;
        if (res.success) {
          this.notifService.success('Registration successful! Welcome to Finwell.');
          this.router.navigate(['/dashboard']);
        } else {
          this.errorMessage = res.message || 'Registration failed';
          this.notifService.error(this.errorMessage!);
        }
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.error?.error || err.error?.message || 'Registration failed, please check details or try again';
        this.notifService.error(this.errorMessage!);
      }
    });
  }
}
