import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { GoldService } from '../../core/services/gold.service';
import { AuthService } from '../../core/services/auth.service';
import { GoldDto } from '../../core/models/gold.model';
import { InrFormatPipe } from '../../shared/pipes/inr-format.pipe';
import { MetricCardComponent } from '../../shared/components/metric-card/metric-card.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';

@Component({
  selector: 'app-gold',
  standalone: true,
  imports: [CommonModule, FormsModule, InrFormatPipe, MetricCardComponent, EmptyStateComponent, RouterLink],
  templateUrl: './gold.component.html',
  styleUrls: ['./gold.component.scss']
})
export class GoldComponent implements OnInit, OnDestroy {
  private goldSvc  = inject(GoldService);
  private auth     = inject(AuthService);

  holdings        = signal<GoldDto[]>([]);
  loading         = signal(true);
  saving          = signal(false);
  error           = signal('');
  toast           = signal<{ msg: string; type: 'ok' | 'err' } | null>(null);
  insufficientBalanceMsg = signal('');

  // Market gold prices
  marketPrices = signal<{ Digital: number; ETF: number; SGB: number; updatedAt?: string } | null>(null);
  
  // Custom dialog state
  buyType = signal<string | null>(null);
  buyPrice = signal<number>(0);
  buyGrams = signal<number | null>(null);

  private intervalId: any;

  get metricTotalGrams(): number { return this.holdings().reduce((a, h) => a + h.quantityGrams, 0); }
  get metricInvested():   number { return this.holdings().reduce((a, h) => a + (h.totalInvestment ?? 0), 0); }
  get metricCurrent():    number { return this.holdings().reduce((a, h) => a + (h.currentValue ?? 0), 0); }
  get metricPnL():        number { return this.metricCurrent - this.metricInvested; }

  loadData(): void {
    this.loading.set(true);
    this.error.set('');
    this.goldSvc.getGoldByUser(this.auth.getCurrentUserId()).subscribe({
      next:  (data) => { this.holdings.set(data ?? []); this.loading.set(false); },
      error: ()     => { this.error.set('Failed to load gold holdings.'); this.loading.set(false); }
    });
  }

  loadMarketPrices(): void {
    this.goldSvc.getGoldMarketPrices().subscribe({
      next: (data) => {
        this.marketPrices.set(data);
      },
      error: () => {
        this.marketPrices.set({
          Digital: 7200.0,
          ETF: 7056.0,
          SGB: 6984.0,
          updatedAt: new Date().toISOString()
        });
      }
    });
  }

  ngOnInit(): void {
    this.loadData();
    this.loadMarketPrices();
    this.intervalId = setInterval(() => this.loadMarketPrices(), 15000);
  }

  ngOnDestroy(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
    this.loading.set(true);
    this.holdings.set([]);
    this.error.set('');
  }

  openBuyDialog(type: string, price: number): void {
    this.buyType.set(type);
    this.buyPrice.set(price);
    this.buyGrams.set(null);
  }

  closeBuyDialog(): void {
    this.buyType.set(null);
  }

  confirmBuy(): void {
    const grams = this.buyGrams();
    const type = this.buyType();
    const price = this.buyPrice();
    if (!grams || grams <= 0 || !type || !price) return;

    this.saving.set(true);
    const dto: GoldDto = {
      type: type,
      quantityGrams: grams,
      purchasePricePerGram: price,
      currentPricePerGram: price,
      storageType: 'Digital',
      purchaseDate: new Date().toISOString().split('T')[0],
      userId: this.auth.getCurrentUserId()
    };

    this.goldSvc.addGold(dto).subscribe({
      next: () => {
        this.saving.set(false);
        this.closeBuyDialog();
        this.showToast(`Successfully purchased ${grams}g of ${type} Gold!`, 'ok');
        this.loadData();
      },
      error: (err) => {
        this.saving.set(false);
        const msg: string = (typeof err?.error === 'string' ? err.error : null)
          || err?.error?.message
          || 'Failed to complete gold purchase.';
        // Close the dialog FIRST, then show the error on the page
        this.closeBuyDialog();
        if (msg.toLowerCase().includes('balance') || msg.toLowerCase().includes('transaction failed')) {
          this.insufficientBalanceMsg.set(msg);
        } else {
          this.showToast(msg, 'err');
        }
      }
    });
  }

  sellGold(h: GoldDto): void {
    if (!h.goldId) return;
    const confirmMessage = `Are you sure you want to sell your entire holding of ${h.type} Gold (${h.quantityGrams}g) for ₹${h.currentValue}?`;
    if (confirm(confirmMessage)) {
      this.saving.set(true);
      this.goldSvc.deleteGold(h.goldId).subscribe({
        next: () => {
          this.saving.set(false);
          this.showToast(`Successfully sold ${h.quantityGrams}g of ${h.type} Gold! Proceeds added to wallet.`, 'ok');
          this.loadData();
        },
        error: (err) => {
          this.saving.set(false);
          this.showToast(err.error || 'Failed to sell gold.', 'err');
        }
      });
    }
  }

  private showToast(msg: string, type: 'ok' | 'err'): void {
    this.toast.set({ msg, type });
    setTimeout(() => this.toast.set(null), 3000);
  }
}
