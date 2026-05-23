package com.example.first.Dto;

import lombok.*;
import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ExpenseDto {
    private Long expenseId;
    private String title;
    private Double amount;
    private String category;
    private String transactionType; // CREDIT / DEBIT
    private LocalDate expenseDate;
    private Long userId;
}
