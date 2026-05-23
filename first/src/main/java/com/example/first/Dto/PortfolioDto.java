package com.example.first.Dto;

import lombok.*;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PortfolioDto {
    private Double cashBalance;
    private Double stockHoldingsValue;
    private Double goldHoldingsValue;
    private Double netWorth;
    private Double portfolioRisk;
    private Double diversificationScore;
    private List<StockHoldingDto> stockHoldings;
    private Double goldGrams;
    private Double goldProfitLoss;
}
