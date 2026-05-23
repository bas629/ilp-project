package com.example.first.Dto;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TradeRequest {
    private Long stockId;
    private Integer quantity;
    private String action; // BUY / SELL
}
