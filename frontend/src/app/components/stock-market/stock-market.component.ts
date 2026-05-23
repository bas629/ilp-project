import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService, StockDto, StockHoldingDto, PortfolioDto } from '../../api.service';
import { WebsocketService } from '../../core/websocket.service';
import { NotificationService } from '../../core/notification.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-stock-market',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './stock-market.component.html',
  styleUrls: ['./stock-market.component.css']
})
export class StockMarketComponent implements OnInit, OnDestroy {
  stocks: StockDto[] = [];
  filteredStocks: StockDto[] = [];
  portfolio: PortfolioDto | null = null;
  cashBalance = 0;
  isLoading = true;
  errorMessage: string | null = null;

  // Filters
  sectors: string[] = ['All Sectors', 'Technology', 'Finance', 'Energy', 'Healthcare', 'Consumer Goods', 'Biotech', 'Banking', 'IT', 'TECH', 'AUTOMOBILE', 'INFRASTRUCTURE', 'CONSTRUCTION'];
  selectedSector = 'All Sectors';
  volatilities: string[] = [
    'All Risks',
    'LOW RISK (0% - 3%)',
    'MEDIUM RISK (4% - 7%)',
    'HIGH RISK (8% - 15%)',
    'SPECULATIVE (> 15%)'
  ];
  selectedVolatility = 'All Risks';
  searchQuery = '';

  // Trade Modal
  showTradeModal = false;
  selectedStock: StockDto | null = null;
  tradeAction: 'BUY' | 'SELL' = 'BUY';
  tradeQuantity = 1;
  isTrading = false;

  private subscriptions: Subscription = new Subscription();

  constructor(
    private apiService: ApiService,
    private wsService: WebsocketService,
    private notifService: NotificationService
  ) {}

  ngOnInit() {
    this.fetchInitialData();

    // Subscribe to live updates
    this.subscriptions.add(
      this.wsService.stocks$.subscribe(updatedStocks => {
        if (Array.isArray(updatedStocks)) {
          // Merge live updates into our list preserving flash animations
          this.stocks = updatedStocks.map(newStock => {
            const oldStock = this.stocks.find(s => s.stockId === newStock.stockId);
            let changeClass = '';
            if (oldStock) {
              if (newStock.currentPrice > oldStock.currentPrice) {
                changeClass = 'price-flash-up';
              } else if (newStock.currentPrice < oldStock.currentPrice) {
                changeClass = 'price-flash-down';
              }
            }
            return { ...newStock, changeClass };
          });
          this.applyFilters();
        }
      })
    );
  }

  fetchInitialData() {
    this.isLoading = true;
    this.errorMessage = null;

    // Load static stock list
    this.apiService.getStocks().subscribe({
      next: (stockList) => {
        this.stocks = stockList;
        this.applyFilters();
        
        // Load cash balance & holdings details
        this.loadPortfolioDetails();
      },
      error: (err) => {
        console.error('Error fetching stocks list', err);
        this.errorMessage = 'Could not retrieve stock list. Please try again.';
        this.isLoading = false;
        this.notifService.error(this.errorMessage!);
      }
    });
  }

  loadPortfolioDetails() {
    this.apiService.getPortfolio().subscribe({
      next: (port) => {
        this.portfolio = port;
        this.cashBalance = port.cashBalance;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading portfolio stats', err);
        this.isLoading = false;
      }
    });
  }

  applyFilters() {
    this.filteredStocks = this.stocks.filter(stock => {
      // Direct sector matching + lowercase comparison to handle IT vs Tech
      const matchSector = this.selectedSector === 'All Sectors' || 
                          stock.sector.toUpperCase() === this.selectedSector.toUpperCase() ||
                          (this.selectedSector === 'Technology' && stock.sector.toUpperCase() === 'TECH') ||
                          (this.selectedSector === 'Finance' && stock.sector.toUpperCase() === 'BANKING');
      
      let matchVol = true;
      if (this.selectedVolatility !== 'All Risks') {
        const risk = stock.riskPercent;
        if (this.selectedVolatility.includes('LOW RISK')) {
          matchVol = risk >= 0 && risk <= 3;
        } else if (this.selectedVolatility.includes('MEDIUM RISK')) {
          matchVol = risk >= 4 && risk <= 7;
        } else if (this.selectedVolatility.includes('HIGH RISK')) {
          matchVol = risk >= 8 && risk <= 15;
        } else if (this.selectedVolatility.includes('SPECULATIVE')) {
          matchVol = risk > 15;
        }
      }
      
      const matchSearch = !this.searchQuery || stock.companyName.toLowerCase().includes(this.searchQuery.toLowerCase());
      return matchSector && matchVol && matchSearch;
    });
  }

  openTradeModal(stock: StockDto, action: 'BUY' | 'SELL') {
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

  getCurrentHoldingsQty(): number {
    if (!this.selectedStock || !this.portfolio) return 0;
    const holding = this.portfolio.stockHoldings.find(h => h.stockId === this.selectedStock!.stockId);
    return holding ? holding.quantity : 0;
  }

  calculateTotalCost(): number {
    if (!this.selectedStock || !this.tradeQuantity) return 0;
    return this.selectedStock.currentPrice * this.tradeQuantity;
  }

  isValidTrade(): boolean {
    const cost = this.calculateTotalCost();
    if (this.tradeQuantity <= 0) return false;
    
    if (this.tradeAction === 'BUY') {
      return cost <= this.cashBalance;
    } else {
      return this.tradeQuantity <= this.getCurrentHoldingsQty();
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
        this.loadPortfolioDetails();
      },
      error: (err) => {
        this.isTrading = false;
        this.notifService.error(err.error?.error || 'Trade transaction failed. Try again.');
      }
    });
  }

  // Generate lightweight SVG path coordinates for sparklines
  getSparklinePath(history: number[]): string {
    if (!history || history.length < 2) return 'M 0,20 L 120,20';
    const min = Math.min(...history);
    const max = Math.max(...history);
    const range = max - min === 0 ? 1 : max - min;
    const width = 120;
    const height = 30;
    
    const points = history.map((val, index) => {
      const x = (index / (history.length - 1)) * width;
      // Subtract from height to invert Y axis (SVG 0,0 is top-left)
      const y = height - 2 - ((val - min) / range) * (height - 4);
      return `${x},${y}`;
    });
    return 'M ' + points.join(' L ');
  }

  getSparklineColor(history: number[]): string {
    if (!history || history.length < 2) return 'var(--accent-cyan)';
    const first = history[0];
    const last = history[history.length - 1];
    return last >= first ? 'var(--accent-emerald)' : 'var(--accent-rose)';
  }

  getRiskBadgeClass(risk: number): string {
    if (risk <= 3) return 'badge-low';
    if (risk <= 7) return 'badge-med';
    if (risk <= 15) return 'badge-high';
    return 'badge-speculative';
  }

  getRiskLabel(risk: number): string {
    if (risk <= 3) return 'LOW RISK';
    if (risk <= 7) return 'MEDIUM RISK';
    if (risk <= 15) return 'HIGH RISK';
    return 'SPECULATIVE';
  }

  getRiskTooltip(risk: number): string {
    if (risk <= 3) return 'LOW RISK (0% - 3%): Stable returns, low volatility, safe capital preservation.';
    if (risk <= 7) return 'MEDIUM RISK (4% - 7%): Moderate volatility, potential for balanced capital growth.';
    if (risk <= 15) return 'HIGH RISK (8% - 15%): High volatility, high profit/loss potential, speculative.';
    return 'SPECULATIVE (> 15%): Extremely high volatility, speculative trading asset.';
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }
}
