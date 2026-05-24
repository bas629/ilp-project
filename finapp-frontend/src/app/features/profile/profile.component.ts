import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})
export class ProfileComponent {
  private auth = inject(AuthService);
  private fb   = inject(FormBuilder);

  user = this.auth.getCurrentUser();

  get initials(): string {
    return (this.user?.name ?? 'U').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }

  // TODO: wire to PUT /user/{id} when backend implements profile update
  profileForm = this.fb.group({
    name:  [this.user?.name ?? '', [Validators.required, Validators.minLength(3)]],
    email: [this.user?.email ?? '', [Validators.required, Validators.email]],
  });

  saved = false;

  onSave(): void {
    if (this.profileForm.invalid) return;
    // TODO: call backend update API
    this.saved = true;
    setTimeout(() => this.saved = false, 3000);
  }

  logout(): void { this.auth.logout(); }
}
