package com.example.first.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;

@Entity
@Table(name = "gold_investments")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GoldInvestment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long goldId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    private Double goldAmount; // In grams
    private Double currentGoldPrice; // Buy price per gram
    private LocalDate purchaseDate;
    private Double profitLoss;
}
