import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InvestmentService } from '../../core/services/investment.service';
import { AuthService } from '../../core/services/auth.service';
import { InrFormatPipe } from '../../shared/pipes/inr-format.pipe';

interface RiskProfileData {
  portfolioRiskPct: number;
  riskLevel: string;
  totalStockInvested: number;
  totalGoldInvested: number;
  walletBalance: number;
  totalAssets: number;
  avgStockRiskPct: number;
  recommendations: string[];
  activeGoals: string[];
}

@Component({
  selector: 'app-risk-profile',
  standalone: true,
  imports: [CommonModule, InrFormatPipe],
  templateUrl: './risk-profile.component.html',
  styleUrls: ['./risk-profile.component.scss']
})
export class RiskProfileComponent implements OnInit {
  private investmentSvc = inject(InvestmentService);
  private auth          = inject(AuthService);

  profileData = signal<RiskProfileData | null>(null);
  loading     = signal(true);
  error       = signal('');

  get riskBadgeClass(): string {
    const level = this.profileData()?.riskLevel || 'LOW';
    if (level === 'LOW') return 'badge-green';
    if (level === 'MEDIUM') return 'badge-amber';
    return 'badge-red';
  }

  loadData(): void {
    this.loading.set(true);
    this.error.set('');
    const userId = this.auth.getCurrentUserId();
    this.investmentSvc.getRiskProfile(userId).subscribe({
      next: (data) => {
        this.profileData.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set('Failed to load risk profile analysis.');
        this.loading.set(false);
      }
    });
  }

  getAssetPercentage(amount: number): number {
    const total = this.profileData()?.totalAssets || 0;
    if (total <= 0) return 0;
    return Math.round((amount / total) * 100);
  }

  ngOnInit(): void {
    this.loadData();
  }
}
