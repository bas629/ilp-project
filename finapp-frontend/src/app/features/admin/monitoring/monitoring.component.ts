import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { MetricCardComponent } from '../../../shared/components/metric-card/metric-card.component';

interface ActivityLog {
  time: string;
  user: string;
  action: string;
  status: 'success' | 'warn' | 'error';
}

interface User {
  userId: number;
  name: string;
  email: string;
  mobileNo: string;
  role: string;
  status: string;
  walletBalance: number;
}

@Component({
  selector: 'app-monitoring',
  standalone: true,
  imports: [CommonModule, MetricCardComponent],
  templateUrl: './monitoring.component.html',
  styleUrls: ['./monitoring.component.scss']
})
export class MonitoringComponent implements OnInit {
  private http = inject(HttpClient);

  totalUsers    = signal(0);
  activeToday   = signal(0);
  totalTx       = signal(1247);
  alertsToday   = signal(5);

  usersList = signal<User[]>([]);
  loading = signal(true);
  error = signal('');

  logs: ActivityLog[] = [
    { time: '09:14', user: 'priya@example.com',   action: 'Login',           status: 'success' },
    { time: '09:31', user: 'raj@example.com',      action: 'Large txn ₹25k', status: 'warn' },
    { time: '10:02', user: 'admin@example.com',    action: 'Rule updated',    status: 'success' },
    { time: '10:45', user: 'unknown@test.com',     action: '3 failed logins', status: 'error' },
    { time: '11:10', user: 'sanya@example.com',    action: 'Added stock',     status: 'success' },
    { time: '11:55', user: 'ravi@example.com',     action: 'Balance < ₹5k',  status: 'warn' },
  ];

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading.set(true);
    this.error.set('');

    this.http.get<User[]>('http://localhost:8080/admin/users').subscribe({
      next: (users) => {
        this.usersList.set(users || []);
        this.totalUsers.set(users ? users.length : 0);
        const activeCount = users ? users.filter(u => u.status !== 'BLOCKED').length : 0;
        this.activeToday.set(activeCount);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set('Failed to load registered users from database.');
        this.loading.set(false);
      }
    });

    this.http.get<any>('http://localhost:8080/admin/stats').subscribe({
      next: (stats) => {
        if (stats) {
          this.totalTx.set(stats.totalTx || 1247);
        }
      },
      error: () => {}
    });
  }

  get combinedLogs(): ActivityLog[] {
    const list: ActivityLog[] = [];
    
    // Convert users list to active activity logs
    this.usersList().forEach((u, i) => {
      const hour = 9 + Math.floor(i / 6);
      const min = (15 + (i * 8)) % 60;
      const timeStr = `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;
      
      list.push({
        time: timeStr,
        user: u.email,
        action: u.status === 'BLOCKED' ? 'Session Blocked' : 'Active User Session',
        status: u.status === 'BLOCKED' ? 'error' : 'success'
      });
    });

    // Add other event logs
    list.push(...this.logs);

    // Sort by time descending
    return list.sort((a, b) => b.time.localeCompare(a.time));
  }

  toggleBlock(user: User): void {
    const isBlocked = user.status === 'BLOCKED';
    const action = isBlocked ? 'unblock' : 'block';
    
    this.http.patch(`http://localhost:8080/admin/users/${user.userId}/${action}`, {}, { responseType: 'text' }).subscribe({
      next: () => {
        this.loadData();
      },
      error: (err) => {
        alert(err.error || `Failed to ${action} user.`);
      }
    });
  }

  badgeClass(s: ActivityLog['status']): string {
    if (s === 'success') return 'badge-success';
    if (s === 'warn')    return 'badge-warn';
    return 'badge-error';
  }
}
