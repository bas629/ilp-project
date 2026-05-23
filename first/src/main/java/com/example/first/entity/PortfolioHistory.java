package com.example.first.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "portfolio_history")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PortfolioHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long historyId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "stock_id", nullable = false)
    private Stock stock;

    private Double buyPrice;
    private Double currentPrice;
    private Integer quantity;
    private Double profitLoss;
    private Double profitLossPercent;
    private LocalDateTime updatedAt;
}
