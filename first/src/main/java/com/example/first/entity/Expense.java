package com.example.first.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;

@Entity
@Table(name = "expenses")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Expense {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long expenseId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    private String title;
    private Double amount;
    private String category; // Food, Travel, Shopping, Bills, Entertainment, Medical, Others
    private String transactionType; // CREDIT or DEBIT
    private LocalDate expenseDate;
}
