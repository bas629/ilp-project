export interface GoldDto {
  goldId?: number;
  type: string;
  quantityGrams: number;
  purchasePricePerGram: number;
  currentPricePerGram: number;
  storageType: string;
  notes?: string;
  purchaseDate: string; // YYYY-MM-DD
  userId: number;
  totalInvestment?: number;
  currentValue?: number;
  profitLoss?: number;
  profitLossPct?: number;
}

export interface WellnessData {
  score: number;
  level: string;
  savingsRate: number;
  investmentRate: number;
  totalIncome: number;
  totalExpenses: number;
  totalInvested: number;
  walletBalance?: number;
}
