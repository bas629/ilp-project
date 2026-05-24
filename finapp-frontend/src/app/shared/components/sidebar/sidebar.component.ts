import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

interface NavItem {
  label: string;
  icon:  string;
  route: string;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './sidebar.component.html',
  styleUrls:  ['./sidebar.component.scss']
})
export class SidebarComponent {
  @Input() isAdmin = false;
  private auth     = inject(AuthService);

  overviewLinks: NavItem[] = [
    { label: 'Dashboard', icon: 'ti-layout-dashboard', route: '/app/dashboard' }
  ];
  financeLinks: NavItem[] = [
    { label: 'Expenses', icon: 'ti-receipt', route: '/app/expenses' },
    { label: 'Records',  icon: 'ti-list',    route: '/app/records'  }
  ];
  investLinks: NavItem[] = [
    { label: 'Stocks',    icon: 'ti-trending-up', route: '/app/stocks'    },
    { label: 'Gold',      icon: 'ti-coin',        route: '/app/gold'      },
    { label: 'Portfolio', icon: 'ti-briefcase',   route: '/app/portfolio' }
  ];
  healthLinks: NavItem[] = [
    { label: 'Wellness Score', icon: 'ti-heart-rate', route: '/app/wellness' },
    { label: 'Risk Profile',   icon: 'ti-shield',     route: '/app/risk'     },
    { label: 'Goals',          icon: 'ti-target',     route: '/app/goals'    }
  ];
  adminLinks: NavItem[] = [
    { label: 'Rules',      icon: 'ti-adjustments', route: '/app/admin/rules'      },
    { label: 'Monitoring', icon: 'ti-activity',    route: '/app/admin/monitoring' },
    { label: 'Security',   icon: 'ti-lock',        route: '/app/admin/security'   }
  ];

  onNavClick(): void {
    window.dispatchEvent(new CustomEvent('finapp-nav-click'));
  }

  get userName():     string { return this.auth.getCurrentUser()?.name ?? 'User'; }
  get userInitials(): string {
    return this.userName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }
}
