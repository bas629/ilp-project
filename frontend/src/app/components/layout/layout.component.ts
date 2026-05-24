import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { WebsocketService } from '../../core/websocket.service';
import { Subscription, filter } from 'rxjs';

interface NavItem { path: string; label: string; icon: string; }

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.css']
})
export class LayoutComponent implements OnInit, OnDestroy {
  sidebarOpen = true;
  isMobile = false;
  currentUser: any = null;
  pageTitle = 'Dashboard';

  stocksList: any[] = [];
  goldData: any = null;
  latestEvent: any = null;

  private subs = new Subscription();

  overviewLinks: NavItem[] = [
    { path: '/dashboard', label: 'Dashboard',       icon: 'ti-dashboard' },
    { path: '/portfolio', label: 'Portfolio & Risk', icon: 'ti-briefcase' },
  ];
  financeLinks: NavItem[] = [
    { path: '/expenses', label: 'Expense Manager', icon: 'ti-wallet' },
    { path: '/goals',    label: 'Savings Goals',   icon: 'ti-target' },
  ];
  investLinks: NavItem[] = [
    { path: '/stocks', label: 'Stock Exchange', icon: 'ti-trending-up' },
    { path: '/gold',   label: 'Digital Gold',   icon: 'ti-crown' },
  ];
  accountLinks: NavItem[] = [
    { path: '/change-password', label: 'Change Password', icon: 'ti-lock' },
  ];

  private readonly pageTitleMap: Record<string, string> = {
    '/dashboard':       'Dashboard',
    '/expenses':        'Expense Manager',
    '/stocks':          'Stock Exchange',
    '/gold':            'Digital Gold',
    '/goals':           'Savings Goals',
    '/portfolio':       'Portfolio & Risk',
    '/change-password': 'Change Password',
  };

  get initials(): string {
    const name: string = this.currentUser?.name ?? '';
    return name.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2) || 'U';
  }

  constructor(
    private auth: AuthService,
    private ws: WebsocketService,
    private router: Router
  ) {
    this.currentUser = this.auth.currentUserValue;
  }

  ngOnInit(): void {
    this.checkViewport();
    // Track page title
    this.subs.add(
      this.router.events.pipe(filter(e => e instanceof NavigationEnd)).subscribe((e: any) => {
        this.pageTitle = this.pageTitleMap[e.urlAfterRedirects] ?? 'FinWell';
      })
    );
    // Stocks feed
    this.subs.add(this.ws.stocks$.subscribe(stocks => {
      if (Array.isArray(stocks)) this.stocksList = stocks;
    }));
    // Gold feed
    this.subs.add(this.ws.gold$.subscribe(gold => {
      if (gold) this.goldData = gold;
    }));
    // Event feed
    this.subs.add(this.ws.event$.subscribe(event => {
      if (event) {
        this.latestEvent = event;
        setTimeout(() => { if (this.latestEvent === event) this.latestEvent = null; }, 10000);
      }
    }));
  }

  @HostListener('window:resize')
  onResize(): void { this.checkViewport(); }

  private checkViewport(): void {
    this.isMobile = window.innerWidth <= 768;
    if (this.isMobile) this.sidebarOpen = false;
    else this.sidebarOpen = true;
  }

  toggleSidebar(): void { this.sidebarOpen = !this.sidebarOpen; }
  onNavClick(): void { if (this.isMobile) this.sidebarOpen = false; }

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }

  ngOnDestroy(): void { this.subs.unsubscribe(); }
}
