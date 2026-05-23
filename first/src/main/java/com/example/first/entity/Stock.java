package com.example.first.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "stocks")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Stock {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long stockId;

    private String companyName;
    private Double currentPrice;
    private Double previousPrice;
    private Double riskPercent;
    private Double expectedReturn;
    private Long marketCap;
    private String sector;
    private String volatility; // LOW, MEDIUM, HIGH
    private String stockStatus; // UP, DOWN, STABLE
    private LocalDateTime lastUpdated;

    @Transient
    private List<Double> priceHistory;
}