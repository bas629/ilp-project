import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService, PortfolioDto } from '../../api.service';
import { WebsocketService } from '../../core/websocket.service';
import { NotificationService } from '../../core/notification.service';
import { Subscription } from 'rxjs';
import { NgChartsModule } from 'ng2-charts';
import { Chart, registerables, ChartConfiguration, ChartData, ChartType } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-gold-investment',
  standalone: true,
  imports: [CommonModule, FormsModule, NgChartsModule],
  templateUrl: './gold-investment.component.html',
  styleUrls: ['./gold-investment.component.css']
})
export class GoldInvestmentComponent implements OnInit, OnDestroy {
  portfolio: PortfolioDto | null = null;
  cashBalance = 0;
  goldPrice = 75.0; // Seed default
  previousPrice: number | null = null;
  marketCycle = 'NORMAL';
  isLoading = true;
  isTrading = false;
  errorMessage: string | null = null;

  // Trading Form
  tradeAction: 'BUY' | 'SELL' = 'BUY';
  tradeAmount = 1.0; // In grams

  // Live price flash tracking
  priceChangeClass = '';

  private subscriptions: Subscription = new Subscription();

  // --- CHART CONFIGURATION ---
  private maxHistoryTicks = 15;
  private goldPriceHistory: number[] = [];

  public lineChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#131a2e',
        titleFont: { family: 'Plus Jakarta Sans' },
        bodyFont: { family: 'Plus Jakarta Sans' }
      }
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: '#64748b' }
      },
      y: {
        grid: { color: 'rgba(255, 255, 255, 0.03)' },
        ticks: { color: '#64748b' }
      }
    }
  };

  public lineChartLabels: string[] = [];
  public lineChartData: ChartData<'line'> = {
    labels: this.lineChartLabels,
    datasets: [
      {
        data: this.goldPriceHistory,
        borderColor: '#f59e0b',
        backgroundColor: 'rgba(245, 158, 11, 0.05)',
        fill: true,
        tension: 0.4,
        borderWidth: 2,
        pointBackgroundColor: '#f59e0b',
        pointHoverRadius: 6
      }
    ]
  };
  public lineChartType: 'line' = 'line';

  constructor(
    private apiService: ApiService,
    private wsService: WebsocketService,
    private notifService: NotificationService
  ) {}

  ngOnInit() {
    this.fetchGoldInfo();

    // Subscribe to live Gold prices
    this.subscriptions.add(
      this.wsService.gold$.subscribe(tick => {
        if (tick && (tick.price || tick.currentPrice)) {
          const newPrice = tick.currentPrice || tick.price;
          const oldPrice = this.goldPrice;
          this.previousPrice = oldPrice;
          this.goldPrice = newPrice;
          this.marketCycle = tick.marketCycle || 'NORMAL';
          
          if (this.goldPrice > oldPrice) {
            this.priceChangeClass = 'price-flash-up';
          } else if (this.goldPrice < oldPrice) {
            this.priceChangeClass = 'price-flash-down';
          }

          // Clear classes after animation completes to allow trigger on next tick
          setTimeout(() => {
            this.priceChangeClass = '';
          }, 1500);

          // Update Price History Chart Array
          this.pushPriceToChart(newPrice);
        }
      })
    );
  }

  fetchGoldInfo() {
    this.isLoading = true;
    this.errorMessage = null;

    this.apiService.getGoldPrice().subscribe({
      next: (data) => {
        const price = data.price;
        this.previousPrice = price;
        this.goldPrice = price;
        this.marketCycle = data.marketCycle;
        
        // Initialize chart with starting price
        this.pushPriceToChart(price);
        
        // Load holdings
        this.loadHoldings();
      },
      error: (err) => {
        console.error('Error fetching initial gold price', err);
        this.errorMessage = 'Could not fetch current gold rates.';
        this.isLoading = false;
        this.notifService.error(this.errorMessage!);
      }
    });
  }

  loadHoldings() {
    this.apiService.getPortfolio().subscribe({
      next: (port) => {
        this.portfolio = port;
        this.cashBalance = port.cashBalance;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error fetching portfolio values', err);
        this.isLoading = false;
      }
    });
  }

  setTradeAction(action: 'BUY' | 'SELL') {
    this.tradeAction = action;
  }

  calculateTotalCost(): number {
    return this.tradeAmount * this.goldPrice;
  }

  getGoldGramsOwned(): number {
    return this.portfolio ? this.portfolio.goldGrams : 0;
  }

  getGoldHoldingsValue(): number {
    return this.portfolio ? this.portfolio.goldHoldingsValue : 0;
  }

  getGoldAverageBuyPrice(): number {
    if (!this.portfolio || this.portfolio.goldGrams <= 0) return 0;
    const totalCost = this.portfolio.goldHoldingsValue - this.portfolio.goldProfitLoss;
    return totalCost / this.portfolio.goldGrams;
  }

  isValidTrade(): boolean {
    const cost = this.calculateTotalCost();
    if (this.tradeAmount <= 0) return false;
    if (this.tradeAction === 'BUY') {
      return cost <= this.cashBalance;
    } else {
      return this.tradeAmount <= this.getGoldGramsOwned();
    }
  }

  executeGoldTrade() {
    if (!this.isValidTrade()) return;

    this.isTrading = true;
    this.apiService.tradeGold(this.tradeAmount, this.tradeAction).subscribe({
      next: (res) => {
        this.isTrading = false;
        this.notifService.success(res.message || 'Gold trade completed successfully!');
        this.loadHoldings();
      },
      error: (err) => {
        this.isTrading = false;
        this.notifService.error(err.error?.error || 'Gold trade execution failed. Try again.');
      }
    });
  }

  getChangePercent(): number {
    if (!this.previousPrice) return 0;
    return ((this.goldPrice - this.previousPrice) / this.previousPrice) * 100;
  }

  private pushPriceToChart(price: number) {
    this.goldPriceHistory.push(price);
    
    // Create simple labels for x-axis
    const dateStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    this.lineChartLabels.push(dateStr);

    if (this.goldPriceHistory.length > this.maxHistoryTicks) {
      this.goldPriceHistory.shift();
      this.lineChartLabels.shift();
    }

    // Refresh charts data bindings
    this.lineChartData = {
      labels: [...this.lineChartLabels],
      datasets: [
        {
          data: [...this.goldPriceHistory],
          borderColor: '#f59e0b',
          backgroundColor: 'rgba(245, 158, 11, 0.05)',
          fill: true,
          tension: 0.4,
          borderWidth: 2,
          pointBackgroundColor: '#f59e0b',
          pointHoverRadius: 6
        }
      ]
    };
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }
}
