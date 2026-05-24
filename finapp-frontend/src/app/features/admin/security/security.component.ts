import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

interface SecurityEvent {
  date: string;
  type: string;
  severity: 'critical' | 'error' | 'warn' | 'info';
  details: string;
}

@Component({
  selector: 'app-security',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './security.component.html',
  styleUrls: ['./security.component.scss']
})
export class SecurityComponent {
  // TODO: replace with real security audit API when available
  events: SecurityEvent[] = [
    { date: '2026-05-16 10:45', type: 'Brute force attempt', severity: 'critical', details: 'unknown@test.com — 3 failed logins in 2 min' },
    { date: '2026-05-15 18:22', type: 'Suspicious transaction', severity: 'error', details: 'raj@example.com — ₹2,50,000 transfer' },
    { date: '2026-05-15 14:10', type: 'New device login', severity: 'warn', details: 'priya@example.com — Chrome/Windows' },
    { date: '2026-05-14 09:30', type: 'Rule modified', severity: 'info', details: 'admin@example.com updated expense threshold' },
    { date: '2026-05-13 22:05', type: 'Off-hours access', severity: 'warn', details: 'sanya@example.com logged in at 10 PM' },
  ];

  badgeClass(s: SecurityEvent['severity']): string {
    if (s === 'critical') return 'badge-critical';
    if (s === 'error')    return 'badge-error';
    if (s === 'warn')     return 'badge-warn';
    return 'badge-info';
  }
}
