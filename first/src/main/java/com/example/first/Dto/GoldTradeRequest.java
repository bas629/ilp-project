package com.example.first.Dto;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class GoldTradeRequest {
    private Double amount; // In grams
    private String action; // BUY / SELL
}
