export interface InvestmentDto {
  investmentId?: number;
  stockName: string;
  investedAmount: number;
  quantity: number;
  riskPercent: number;
  investmentDate: string; // ISO date YYYY-MM-DD
  userId: number;
}

export interface StockHolding {
  symbol: string;
  companyName: string;
  quantity: number;
  buyPrice: number;
  currentPrice: number;
  riskPercent: number;
  purchaseDate: string;
}

export interface BuyMoreDto {
  userId:             number;
  stockName:          string;
  additionalQuantity: number;
  pricePerUnit:       number;
  purchaseDate:       string;
}

export interface SellStockDto {
  userId:           number;
  investmentId:     number;
  sellQuantity:     number;
  sellPricePerUnit: number;
}

export interface GoldEntry {
  id?: number;
  type: 'Physical' | 'Digital' | 'ETF' | 'SGB';
  quantityGrams: number;
  purchasePricePerGram: number;
  purchaseDate: string;
  currentPricePerGram: number;
  storageType: 'Bank Locker' | 'Home' | 'Digital';
  notes?: string;
}
