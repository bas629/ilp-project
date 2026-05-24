import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { InvestmentService } from '../../core/services/investment.service';
import { AuthService } from '../../core/services/auth.service';
import { InvestmentDto, SellStockDto } from '../../core/models/investment.model';
import { InrFormatPipe } from '../../shared/pipes/inr-format.pipe';

const BASE = 'http://localhost:8080';

export interface LiveStock {
  stockId:        number;
  symbol:         string;
  companyName:    string;
  currentPrice:   number;
  previousPrice:  number;
  riskCategory:   'LOW' | 'MEDIUM' | 'HIGH';
  riskPercent:    number;
  expectedReturn: number;
  sector:         string;
  stockStatus:    string;
}

export interface RecommendationDto {
  riskCategory:        string;
  targetAmount:        number;
  goldPct:             number;
  stockPct:            number;
  savingsPct:          number;
  goldAllocatedAmount: number;
  stockAllocatedAmount: number;
  savingsAllocatedAmount: number;
  recommendedStocks:   string[];
}

interface SellDialog {
  investmentId: number;
  stockName:    string;
  maxQty:       number;
  sellQty:      number;
  sellPrice:    number;
}

type WizardStep = 'idle' | 'pick-risk' | 'pick-amount' | 'recommendations' | 'confirm-invest';

@Component({
  selector: 'app-stocks',
  standalone: true,
  imports: [CommonModule, FormsModule, InrFormatPipe, DecimalPipe, RouterLink],
  templateUrl: './stocks.component.html',
  styleUrls: ['./stocks.component.scss']
})
export class StocksComponent implements OnInit, OnDestroy {
  private http              = inject(HttpClient);
  private investmentService = inject(InvestmentService);
  private auth              = inject(AuthService);

  // ── Portfolio data ──
  investments  = signal<InvestmentDto[]>([]);
  liveStocks   = signal<LiveStock[]>([]);
  loading      = signal(true);
  success      = signal('');
  error        = signal('');
  insufficientBalanceMessage = signal('');

  // ── Wizard state ──
  wizardStep      = signal<WizardStep>('idle');
  selectedRisk    = signal<'LOW' | 'MEDIUM' | 'HIGH' | ''>('');
  recommendation  = signal<RecommendationDto | null>(null);
  recStocks       = signal<LiveStock[]>([]);
  selectedStock   = signal<LiveStock | null>(null);
  loadingRec      = signal(false);
  confirmSaving   = signal(false);

  // Plain properties for ngModel (signals can't bind two-way directly)
  investAmount = 0;
  confirmQty   = 1;

  // ── Sell dialog ──
  sellDialog  = signal<SellDialog | null>(null);
  sellSaving  = signal(false);

  // ── WebSocket ──
  private ws: WebSocket | null = null;

  // ── Computed totals ──
  totalInvested = computed(() => this.investments().reduce((s, i) => s + (i.investedAmount ?? 0), 0));
  totalQuantity = computed(() => this.investments().reduce((s, i) => s + (i.quantity ?? 0), 0));
  avgRisk       = computed(() => {
    const inv = this.investments();
    return inv.length > 0
      ? Math.round(inv.reduce((s, i) => s + (i.riskPercent ?? 0), 0) / inv.length * 100) / 100
      : 0;
  });

  get sellTotal(): number {
    const d = this.sellDialog();
    return d ? d.sellQty * d.sellPrice : 0;
  }

  get confirmTotal(): number {
    const s = this.selectedStock();
    return s ? this.confirmQty * s.currentPrice : 0;
  }

  get suggestedQty(): number {
    const rec   = this.recommendation();
    const stock = this.selectedStock();
    if (!rec || !stock || stock.currentPrice <= 0 || rec.recommendedStocks.length === 0) return 1;
    return Math.max(1, Math.floor(rec.stockAllocatedAmount / rec.recommendedStocks.length / stock.currentPrice));
  }

  // ── Risk options ──
  riskOptions = [
    { label: 'Low Risk',    value: 'LOW'    as const, icon: '🛡️', color: '#16a34a', desc: 'Stable returns. Ideal for wealth preservation.' },
    { label: 'Medium Risk', value: 'MEDIUM' as const, icon: '⚖️', color: '#d97706', desc: 'Balanced growth. Good for 3–5 year goals.' },
    { label: 'High Risk',   value: 'HIGH'   as const, icon: '🚀', color: '#dc2626', desc: 'High growth potential with more volatility.' },
  ];

  riskBadgeClass(cat: string): string {
    return cat === 'LOW' ? 'badge-green' : cat === 'MEDIUM' ? 'badge-amber' : 'badge-red';
  }

  priceChange(stock: LiveStock): number {
    if (!stock.previousPrice || stock.previousPrice === 0) return 0;
    return Math.round(((stock.currentPrice - stock.previousPrice) / stock.previousPrice) * 10000) / 100;
  }

  getLiveStock(symbol: string): LiveStock | undefined {
    return this.liveStocks().find(s => s.symbol.toLowerCase() === symbol.toLowerCase());
  }

  // ── Quick-select amounts ──
  quickAmounts = [5000, 10000, 25000, 50000, 100000];
  formatQuickAmt(a: number): string { return a >= 100000 ? (a / 100000) + 'L' : (a / 1000) + 'K'; }

  // ── Wizard flow ──
  startWizard(): void  { this.wizardStep.set('pick-risk'); this.selectedRisk.set(''); this.investAmount = 0; this.recommendation.set(null); }
  cancelWizard(): void { this.wizardStep.set('idle'); this.selectedStock.set(null); }

  selectRisk(r: 'LOW' | 'MEDIUM' | 'HIGH'): void {
    this.selectedRisk.set(r);
    this.wizardStep.set('pick-amount');
  }

  setQuickAmount(amt: number): void { this.investAmount = amt; }

  getRecommendations(): void {
    if (this.investAmount <= 0) { this.error.set('Please enter a valid investment amount.'); setTimeout(() => this.error.set(''), 3000); return; }
    this.loadingRec.set(true);
    this.http.get<RecommendationDto>(`${BASE}/recommend`, {
      params: { amount: String(this.investAmount), risk: this.selectedRisk() }
    }).subscribe({
      next: rec => {
        this.recommendation.set(rec);
        const recommended = this.liveStocks().filter(s =>
          rec.recommendedStocks.some(sym => sym.toLowerCase() === s.symbol.toLowerCase())
        );
        this.recStocks.set(recommended);
        this.wizardStep.set('recommendations');
        this.loadingRec.set(false);
      },
      error: () => { this.loadingRec.set(false); this.error.set('Could not fetch recommendations. Try again.'); setTimeout(() => this.error.set(''), 4000); }
    });
  }

  selectStockToInvest(stock: LiveStock): void {
    this.selectedStock.set(stock);
    this.confirmQty = this.suggestedQty;
    this.wizardStep.set('confirm-invest');
  }

  confirmInvest(): void {
    const stock = this.selectedStock();
    if (!stock || this.confirmQty <= 0) return;
    const totalCost = this.confirmQty * stock.currentPrice;
    const dto: InvestmentDto = {
      stockName:      stock.symbol,
      investedAmount: totalCost,
      quantity:       this.confirmQty,
      riskPercent:    stock.riskPercent,
      investmentDate: new Date().toISOString().split('T')[0],
      userId:         this.auth.getCurrentUserId()
    };
    this.confirmSaving.set(true);
    this.investmentService.createInvestment(dto).subscribe({
      next: () => {
        this.confirmSaving.set(false);
        this.success.set(`✅ Invested ₹${totalCost.toLocaleString('en-IN')} in ${stock.companyName} (${this.confirmQty} units). Expense auto-recorded.`);
        this.wizardStep.set('idle');
        this.selectedStock.set(null);
        this.confirmQty = 1;
        setTimeout(() => this.success.set(''), 6000);
        this.loadData();
      },
      error: (err) => {
        this.confirmSaving.set(false);
        const msg = typeof err?.error === 'string' ? err.error : 'Investment failed. Check your wallet balance.';
        if (msg.toLowerCase().includes('balance') || msg.toLowerCase().includes('transaction failed') || msg.toLowerCase().includes('insufficient')) {
          this.insufficientBalanceMessage.set(msg);
        } else {
          this.error.set(msg);
          setTimeout(() => this.error.set(''), 5000);
        }
      }
    });
  }

  // ── Sell ──
  openSellDialog(inv: InvestmentDto): void {
    const live = this.getLiveStock(inv.stockName);
    this.sellDialog.set({
      investmentId: inv.investmentId!,
      stockName:    inv.stockName,
      maxQty:       inv.quantity,
      sellQty:      1,
      sellPrice:    live ? live.currentPrice : 0
    });
  }

  closeSellDialog(): void { this.sellDialog.set(null); }
  setSellQty(v: number):   void { const d = this.sellDialog(); if (d) this.sellDialog.set({ ...d, sellQty: +v }); }
  setSellPrice(v: number): void { const d = this.sellDialog(); if (d) this.sellDialog.set({ ...d, sellPrice: +v }); }

  confirmSell(): void {
    const d = this.sellDialog();
    if (!d || d.sellQty <= 0 || d.sellQty > d.maxQty || d.sellPrice <= 0) return;
    const dto: SellStockDto = {
      userId:           this.auth.getCurrentUserId(),
      investmentId:     d.investmentId,
      sellQuantity:     d.sellQty,
      sellPricePerUnit: d.sellPrice
    };
    this.sellSaving.set(true);
    this.investmentService.sellStock(dto).subscribe({
      next: () => {
        this.sellSaving.set(false);
        this.sellDialog.set(null);
        this.success.set(`💰 Sold ${d.sellQty} ${d.stockName} for ₹${(d.sellQty * d.sellPrice).toLocaleString('en-IN')}. Income auto-added to Records.`);
        setTimeout(() => this.success.set(''), 6000);
        this.loadData();
      },
      error: (err) => {
        this.sellSaving.set(false);
        const msg = typeof err?.error === 'string' ? err.error : 'Failed to sell.';
        this.error.set(msg); setTimeout(() => this.error.set(''), 4000);
      }
    });
  }

  // ── Data ──
  loadData(): void {
    this.loading.set(true);
    this.http.get<LiveStock[]>(`${BASE}/stocks`).subscribe({
      next: (stocks) => this.liveStocks.set(stocks ?? []),
      error: () => {}
    });
    this.investmentService.getInvestmentsByUser(this.auth.getCurrentUserId()).subscribe({
      next:  d => { this.investments.set(d ?? []); this.loading.set(false); },
      error: () => { this.loading.set(false); }
    });
  }

  connectWebSocket(): void {
    try {
      this.ws = new WebSocket('ws://localhost:8080/ws/market');
      this.ws.onmessage = (ev) => {
        try {
          const data = JSON.parse(ev.data);
          if (data.type === 'MARKET_UPDATE' && data.stocks) {
            this.liveStocks.update(cur => cur.map(s => {
              const u = (data.stocks as any[]).find((x: any) => x.symbol === s.symbol);
              return u ? { ...s, currentPrice: u.currentPrice, previousPrice: u.previousPrice } : s;
            }));
          }
        } catch {}
      };
    } catch {}
  }

  ngOnInit():    void { this.loadData(); this.connectWebSocket(); }
  ngOnDestroy(): void { this.ws?.close(); }
}
