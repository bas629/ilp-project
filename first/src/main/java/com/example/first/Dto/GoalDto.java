package com.example.first.Dto;

import lombok.*;
import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GoalDto {
    private Long goalId;
    private String goalName;
    private Double targetAmount;
    private Double currentAmount;
    private LocalDate deadline;
    private String status;
}
