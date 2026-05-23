package com.example.first.Dto;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StockHoldingDto {
    private Long stockId;
    private String companyName;
    private String sector;
    private Integer quantity;
    private Double avgBuyPrice;
    private Double currentPrice;
    private Double totalCost;
    private Double currentValue;
    private Double profitLoss;
    private Double profitLossPercent;
    private Double riskPercent;
}
