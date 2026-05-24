export interface StockListing {
  stockId?: number;
  companyName: string;
  stockPrice: number;
  riskPercent: number;
  returnPercent: number;
  stockStatus: 'active' | 'delisted';
}
