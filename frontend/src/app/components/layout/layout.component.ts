import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { WebsocketService } from '../../core/websocket.service';
import { Subscription } from 'rxjs';

interface NavItem {
  path: string;
  label: string;
  icon: string;
}

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.css']
})
export class LayoutComponent implements OnInit, OnDestroy {
  isSidebarCollapsed = false;
  currentUser: any = null;
  
  // Ticker Data
  stocksList: any[] = [];
  goldData: any = null;
  latestEvent: any = null;

  private subscriptions: Subscription = new Subscription();

  navItems: NavItem[] = [
    { path: '/dashboard', label: 'Dashboard', icon: 'dashboard' },
    { path: '/expenses', label: 'Expense Manager', icon: 'account_balance_wallet' },
    { path: '/stocks', label: 'Stock Exchange', icon: 'trending_up' },
    { path: '/gold', label: 'Digital Gold', icon: 'stars' },
    { path: '/goals', label: 'Savings Goals', icon: 'track_changes' },
    { path: '/portfolio', label: 'Portfolio & Risk', icon: 'pie_chart' },
    { path: '/change-password', label: 'Change Password', icon: 'lock' }
  ];

  constructor(
    private authService: AuthService,
    private wsService: WebsocketService,
    private router: Router
  ) {
    this.currentUser = this.authService.currentUserValue;
  }

  ngOnInit() {
    // Listen to live stock market updates
    this.subscriptions.add(
      this.wsService.stocks$.subscribe(stocks => {
        if (Array.isArray(stocks)) {
          // Add change class to trigger flash animations
          this.stocksList = stocks.map(newStock => {
            const oldStock = this.stocksList.find(s => s.stockId === newStock.stockId);
            let changeClass = '';
            if (oldStock) {
              if (newStock.currentPrice > oldStock.currentPrice) {
                changeClass = 'price-up';
              } else if (newStock.currentPrice < oldStock.currentPrice) {
                changeClass = 'price-down';
              }
            }
            return { ...newStock, changeClass };
          });
        }
      })
    );

    // Listen to live gold price updates
    this.subscriptions.add(
      this.wsService.gold$.subscribe(gold => {
        if (gold) {
          let changeClass = '';
          if (this.goldData) {
            if (gold.currentPrice > this.goldData.currentPrice) {
              changeClass = 'price-up';
            } else if (gold.currentPrice < this.goldData.currentPrice) {
              changeClass = 'price-down';
            }
          }
          this.goldData = { ...gold, changeClass };
        }
      })
    );

    // Listen to news events
    this.subscriptions.add(
      this.wsService.event$.subscribe(event => {
        if (event) {
          this.latestEvent = event;
          // Auto clear event alert after 10 seconds
          setTimeout(() => {
            if (this.latestEvent === event) {
              this.latestEvent = null;
            }
          }, 10000);
        }
      })
    );
  }

  toggleSidebar() {
    this.isSidebarCollapsed = !this.isSidebarCollapsed;
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }
}
