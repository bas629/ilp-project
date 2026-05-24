import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { StockHolding } from '../models/investment.model';

// TODO: replace with real API calls when backend GET endpoints are implemented

const MOCK_STOCKS: StockHolding[] = [
  { symbol: 'INFY',      companyName: 'Infosys',    quantity: 10, buyPrice: 1420, currentPrice: 1590, riskPercent: 8.34,  purchaseDate: '2026-01-10' },
  { symbol: 'HDFCBANK',  companyName: 'HDFC Bank',  quantity: 5,  buyPrice: 1640, currentPrice: 1720, riskPercent: 9.45,  purchaseDate: '2026-02-05' },
  { symbol: 'RVNL',      companyName: 'Rail Vikas', quantity: 20, buyPrice: 180,  currentPrice: 210,  riskPercent: 12.45, purchaseDate: '2026-03-15' },
  { symbol: 'TATASTEEL', companyName: 'Tata Steel', quantity: 15, buyPrice: 140,  currentPrice: 132,  riskPercent: 10.45, purchaseDate: '2026-04-01' },
];

@Injectable({ providedIn: 'root' })
export class StockService {
  private stocks$ = new BehaviorSubject<StockHolding[]>(MOCK_STOCKS);

  getStocks() { return this.stocks$.asObservable(); }

  addStock(s: StockHolding): void {
    this.stocks$.next([...this.stocks$.value, s]);
  }

  deleteStock(symbol: string): void {
    this.stocks$.next(this.stocks$.value.filter(s => s.symbol !== symbol));
  }

  updateStock(symbol: string, updated: Partial<StockHolding>): void {
    this.stocks$.next(this.stocks$.value.map(s =>
      s.symbol === symbol ? { ...s, ...updated } : s
    ));
  }

  getTotalInvested():  number { return this.stocks$.value.reduce((a, s) => a + s.buyPrice * s.quantity, 0); }
  getCurrentValue():   number { return this.stocks$.value.reduce((a, s) => a + s.currentPrice * s.quantity, 0); }
  getTotalPnL():       number { return this.getCurrentValue() - this.getTotalInvested(); }
}
