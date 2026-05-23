import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService, PortfolioDto, FinancialProfileDto, StockHoldingDto } from '../../api.service';
import { NotificationService } from '../../core/notification.service';
import { NgChartsModule } from 'ng2-charts';
import { Chart, registerables, ChartConfiguration, ChartData, ChartType } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-portfolio',
  standalone: true,
  imports: [CommonModule, FormsModule, NgChartsModule],
  templateUrl: './portfolio.component.html',
  styleUrls: ['./portfolio.component.css']
})
export class PortfolioComponent implements OnInit {
  portfolio: PortfolioDto | null = null;
  wellness: FinancialProfileDto | null = null;
  isLoading = true;
  errorMessage: string | null = null;

  // Split Stock Lists
  profitStocks: StockHoldingDto[] = [];
  lossStocks: StockHoldingDto[] = [];

  // Sorting
  selectedSort = 'profitHigh';
  sortOptions = [
    { value: 'profitHigh', label: 'Highest Profit (Amount)' },
    { value: 'lossHigh', label: 'Highest Loss (Amount)' },
    { value: 'gainPct', label: 'Highest Gain (%)' },
    { value: 'lossPct', label: 'Highest Loss (%)' }
  ];

  // Trade Modal
  showTradeModal = false;
  selectedStock: StockHoldingDto | null = null;
  tradeAction: 'BUY' | 'SELL' = 'BUY';
  tradeQuantity = 1;
  isTrading = false;

  // --- CHART CONFIG ---
  public doughnutChartOptions: ChartConfiguration<'doughnut'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: '#94a3b8',
          font: { family: 'Plus Jakarta Sans', size: 12 }
        }
      },
      tooltip: {
        backgroundColor: '#131a2e',
        titleFont: { family: 'Plus Jakarta Sans' },
        bodyFont: { family: 'Plus Jakarta Sans' }
      }
    },
    cutout: '70%'
  };

  public doughnutChartLabels: string[] = ['Cash Wallet', 'Stock Exchange Holdings', 'Digital Gold'];
  public doughnutChartData: ChartData<'doughnut'> = {
    labels: this.doughnutChartLabels,
    datasets: [
      {
        data: [0, 0, 0],
        backgroundColor: ['#06b6d4', '#8b5cf6', '#f59e0b'],
        borderWidth: 0
      }
    ]
  };
  public doughnutChartType: 'doughnut' = 'doughnut';

  constructor(
    private apiService: ApiService,
    private notifService: NotificationService
  ) {}

  ngOnInit() {
    this.fetchPortfolioDetails();
  }

  fetchPortfolioDetails() {
    this.isLoading = true;
    this.errorMessage = null;

    this.apiService.getPortfolio().subscribe({
      next: (port) => {
        this.portfolio = port;
        
        // Update Chart values
        this.doughnutChartData = {
          labels: this.doughnutChartLabels,
          datasets: [
            {
              data: [port.cashBalance, port.stockHoldingsValue, port.goldHoldingsValue],
              backgroundColor: ['#06b6d4', '#8b5cf6', '#f59e0b'],
              borderWidth: 0
            }
          ]
        };

        // Sort and split stocks
        this.sortStocks();

        // Load wellness recommendations
        this.apiService.getWellnessProfile().subscribe({
          next: (profile) => {
            this.wellness = profile;
            this.isLoading = false;
          },
          error: (err) => {
            console.error('Error loading wellness profile', err);
            this.isLoading = false;
          }
        });
      },
      error: (err) => {
        console.error('Error loading portfolio metrics', err);
        this.errorMessage = 'Could not load portfolio analytics. Try syncing with the server.';
        this.isLoading = false;
        this.notifService.error(this.errorMessage!);
      }
    });
  }

  sortStocks() {
    if (!this.portfolio) return;
    const allHoldings = this.portfolio.stockHoldings || [];
    
    // Split into profit and loss stocks
    this.profitStocks = allHoldings.filter(s => s.profitLoss >= 0);
    this.lossStocks = allHoldings.filter(s => s.profitLoss < 0);

    const sortFn = (a: StockHoldingDto, b: StockHoldingDto) => {
      switch (this.selectedSort) {
        case 'profitHigh':
          return b.profitLoss - a.profitLoss;
        case 'lossHigh':
          return a.profitLoss - b.profitLoss;
        case 'gainPct':
          return b.profitLossPercent - a.profitLossPercent;
        case 'lossPct':
          return a.profitLossPercent - b.profitLossPercent;
        default:
          return 0;
      }
    };

    this.profitStocks.sort(sortFn);
    this.lossStocks.sort(sortFn);
  }

  getRiskBadgeClass(risk: number): string {
    if (risk <= 30) return 'badge-low';
    if (risk <= 60) return 'badge-med';
    if (risk <= 85) return 'badge-high';
    return 'badge-speculative';
  }

  getRiskLabel(risk: number): string {
    if (risk <= 30) return 'Conservative';
    if (risk <= 60) return 'Moderate';
    if (risk <= 85) return 'Aggressive';
    return 'Highly Speculative';
  }

  // --- TRADING LOGIC ---
  openTradeModal(stock: StockHoldingDto, action: 'BUY' | 'SELL') {
    this.selectedStock = stock;
    this.tradeAction = action;
    this.tradeQuantity = 1;
    this.showTradeModal = true;
  }

  closeTradeModal() {
    this.showTradeModal = false;
    this.selectedStock = null;
    this.isTrading = false;
  }

  isValidTrade(): boolean {
    if (!this.selectedStock || this.tradeQuantity <= 0) return false;
    const cost = this.selectedStock.currentPrice * this.tradeQuantity;
    if (this.tradeAction === 'BUY') {
      return this.portfolio ? cost <= this.portfolio.cashBalance : false;
    } else {
      return this.tradeQuantity <= this.selectedStock.quantity;
    }
  }

  executeTrade() {
    if (!this.selectedStock || !this.isValidTrade()) return;

    this.isTrading = true;
    this.apiService.tradeStock(this.selectedStock.stockId, this.tradeQuantity, this.tradeAction).subscribe({
      next: (res) => {
        this.isTrading = false;
        this.notifService.success(res.message || 'Trade executed successfully!');
        this.closeTradeModal();
        this.fetchPortfolioDetails();
      },
      error: (err) => {
        this.isTrading = false;
        this.notifService.error(err.error?.error || 'Trade transaction failed. Try again.');
      }
    });
  }
}
