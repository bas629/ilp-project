import { Component, HostListener, inject, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from '../../shared/components/sidebar/sidebar.component';
import { TopbarComponent } from '../../shared/components/topbar/topbar.component';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [CommonModule, RouterOutlet, SidebarComponent, TopbarComponent],
  templateUrl: './shell.component.html',
  styleUrls: ['./shell.component.scss']
})
export class ShellComponent implements OnInit, OnDestroy {
  auth        = inject(AuthService);
  sidebarOpen = signal(true);
  isMobile    = signal(false);

  ngOnInit(): void {
    this.checkViewport();
    window.addEventListener('finapp-nav-click', this.handleNavClick);
  }

  ngOnDestroy(): void {
    window.removeEventListener('finapp-nav-click', this.handleNavClick);
  }

  private handleNavClick = () => {
    if (this.isMobile()) {
      this.sidebarOpen.set(false);
    }
  };

  @HostListener('window:resize')
  onResize(): void {
    this.checkViewport();
  }

  private checkViewport(): void {
    const mobile = window.innerWidth <= 768;
    this.isMobile.set(mobile);
    this.sidebarOpen.set(!mobile);
  }

  toggleSidebar(): void {
    this.sidebarOpen.update(v => !v);
  }

  closeOverlay(): void {
    if (this.isMobile()) {
      this.sidebarOpen.set(false);
    }
  }
}
