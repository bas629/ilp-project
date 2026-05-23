package com.example.first.Dto;

import lombok.*;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FinancialProfileDto {
    private Integer financialScore;
    private Double riskPercentage;
    private Double savings;
    private String currentStatus;
    private List<String> recommendations;
}
