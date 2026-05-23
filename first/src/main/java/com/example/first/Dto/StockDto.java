package com.example.first.Dto;

import lombok.*;
import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StockDto {
    private Long stockId;
    private String companyName;
    private Double currentPrice;
    private Double previousPrice;
    private Double riskPercent;
    private Double expectedReturn;
    private Long marketCap;
    private String sector;
    private String volatility;
    private String stockStatus;
    private LocalDateTime lastUpdated;
    private List<Double> priceHistory;
}
