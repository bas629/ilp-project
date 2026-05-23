package com.example.first.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "financial_profiles")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FinancialProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long profileId;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    private Integer financialScore;
    private Double riskPercentage;
    private Double savings;
    private String currentStatus; // EXCELLENT, GOOD, FAIR, POOR
}
