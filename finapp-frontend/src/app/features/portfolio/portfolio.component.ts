import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { InvestmentService } from '../../core/services/investment.service';
import { GoldService } from '../../core/services/gold.service';
import { AuthService } from '../../core/services/auth.service';
import { InvestmentDto } from '../../core/models/investment.model';
import { GoldDto } from '../../core/models/gold.model';
import { InrFormatPipe } from '../../shared/pipes/inr-format.pipe';

@Component({
  selector: 'app-portfolio',
  standalone: true,
  imports: [CommonModule, RouterLink, InrFormatPipe],
  templateUrl: './portfolio.component.html',
  styleUrls: ['./portfolio.component.scss']
})
export class PortfolioComponent implements OnInit {
  private investmentService = inject(InvestmentService);
  private goldService       = inject(GoldService);
  private auth              = inject(AuthService);

  investments  = signal<InvestmentDto[]>([]);
  goldHoldings = signal<GoldDto[]>([]);
  loading      = signal(true);
  error        = signal('');

  get totalInvestedStock(): number {
    return this.investments().reduce((s, i) => s + (i.investedAmount ?? 0), 0);
  }

  get totalInvestedGold(): number {
    return this.goldHoldings().reduce((s, g) => s + (g.totalInvestment ?? 0), 0);
  }

  get totalInvested(): number {
    return this.totalInvestedStock + this.totalInvestedGold;
  }

  get totalStockUnits(): number {
    return this.investments().reduce((s, i) => s + (i.quantity ?? 0), 0);
  }

  get totalGoldGrams(): number {
    return this.goldHoldings().reduce((s, g) => s + (g.quantityGrams ?? 0), 0);
  }

  get avgRisk(): number {
    const total = this.totalInvested;
    if (total <= 0) return 0;
    const stockRiskSum = this.investments().reduce((s, i) => s + ((i.investedAmount ?? 0) * (i.riskPercent ?? 0)), 0);
    const goldRiskSum = this.goldHoldings().reduce((s, g) => s + ((g.totalInvestment ?? 0) * 2.0), 0);
    return Math.round(((stockRiskSum + goldRiskSum) / total) * 100) / 100;
  }

  get combinedBreakdown(): { name: string; totalInvested: number; quantity: number; riskPercent: number; type: 'Stock' | 'Gold' }[] {
    const list: { name: string; totalInvested: number; quantity: number; riskPercent: number; type: 'Stock' | 'Gold' }[] = [];
    
    // Stock breakdown mapping
    const stockMap = new Map<string, { totalInvested: number; quantity: number; riskPercent: number }>();
    for (const inv of this.investments()) {
      const key = inv.stockName ?? 'Unknown';
      const existing = stockMap.get(key);
      if (existing) {
        existing.totalInvested += inv.investedAmount ?? 0;
        existing.quantity      += inv.quantity ?? 0;
      } else {
        stockMap.set(key, {
          totalInvested: inv.investedAmount ?? 0,
          quantity:      inv.quantity ?? 0,
          riskPercent:   inv.riskPercent ?? 0
        });
      }
    }
    stockMap.forEach((data, name) => {
      list.push({ name, ...data, type: 'Stock' });
    });

    // Gold breakdown mapping
    const goldMap = new Map<string, { totalInvested: number; quantity: number; riskPercent: number }>();
    for (const g of this.goldHoldings()) {
      const key = g.type + ' Gold';
      const existing = goldMap.get(key);
      if (existing) {
        existing.totalInvested += g.totalInvestment ?? 0;
        existing.quantity      += g.quantityGrams ?? 0;
      } else {
        goldMap.set(key, {
          totalInvested: g.totalInvestment ?? 0,
          quantity:      g.quantityGrams ?? 0,
          riskPercent:   2.0 // Low risk
        });
      }
    }
    goldMap.forEach((data, name) => {
      list.push({ name, ...data, type: 'Gold' });
    });

    return list.sort((a, b) => b.totalInvested - a.totalInvested);
  }

  getDistributionPct(invested: number): number {
    return this.totalInvested > 0 ? Math.round((invested / this.totalInvested) * 100) : 0;
  }

  ngOnInit(): void {
    const userId = this.auth.getCurrentUserId();
    this.loading.set(true);
    this.investmentService.getInvestmentsByUser(userId).subscribe({
      next: (stockData) => {
        this.investments.set(stockData ?? []);
        this.goldService.getGoldByUser(userId).subscribe({
          next: (goldData) => {
            this.goldHoldings.set(goldData ?? []);
            this.loading.set(false);
          },
          error: () => {
            this.loading.set(false);
          }
        });
      },
      error: () => {
        this.error.set('Failed to load portfolio investments.');
        this.loading.set(false);
      }
    });
  }
}
