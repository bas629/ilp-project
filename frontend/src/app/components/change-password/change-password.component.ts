import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ApiService } from '../../api.service';
import { NotificationService } from '../../core/notification.service';

@Component({
  selector: 'app-change-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './change-password.component.html',
  styleUrls: ['./change-password.component.css']
})
export class ChangePasswordComponent {
  changePasswordForm: FormGroup;
  isChangingPassword = false;

  constructor(
    private fb: FormBuilder,
    private apiService: ApiService,
    private notifService: NotificationService
  ) {
    this.changePasswordForm = this.fb.group({
      oldPassword: ['', Validators.required],
      newPassword: ['', [Validators.required, Validators.minLength(8), this.strongPasswordValidator()]]
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
    const val = this.changePasswordForm.get('newPassword')?.value || '';
    return {
      length: val.length >= 8,
      hasUpper: /[A-Z]/.test(val),
      hasLower: /[a-z]/.test(val),
      hasNumber: /[0-9]/.test(val),
      hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(val)
    };
  }

  onChangePasswordSubmit() {
    if (this.changePasswordForm.invalid) {
      this.notifService.error('Please enter a valid password meeting all requirements.');
      return;
    }

    this.isChangingPassword = true;
    this.apiService.changePassword(this.changePasswordForm.value).subscribe({
      next: (res) => {
        this.isChangingPassword = false;
        this.notifService.success(res.message || 'Password changed successfully!');
        this.changePasswordForm.reset();
      },
      error: (err) => {
        this.isChangingPassword = false;
        this.notifService.error(err.error?.error || err.error?.message || 'Password change failed. Verify your old password.');
      }
    });
  }
}
