package com.example.first.service;

import com.example.first.Dto.GoalDto;
import com.example.first.entity.Expense;
import com.example.first.entity.Goal;
import com.example.first.entity.User;
import com.example.first.repo.ExpenseRepo;
import com.example.first.repo.GoalRepo;
import com.example.first.repo.UserRepo;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class GoalService {

    private final GoalRepo goalRepo;
    private final UserRepo userRepo;
    private final ExpenseRepo expenseRepo;
    private final ExpenseService expenseService;
    private final WellnessService wellnessService;

    public List<GoalDto> getGoalsByUserId(Long userId) {
        return goalRepo.findByUser_UserId(userId).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    public GoalDto addGoal(GoalDto dto, Long userId) {
        User user = userRepo.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        Goal goal = Goal.builder()
                .goalName(dto.getGoalName())
                .targetAmount(dto.getTargetAmount())
                .currentAmount(dto.getCurrentAmount() != null ? dto.getCurrentAmount() : 0.0)
                .deadline(dto.getDeadline() != null ? dto.getDeadline() : LocalDate.now().plusYears(1))
                .status("ACTIVE")
                .user(user)
                .build();

        Goal saved = goalRepo.save(goal);
        return mapToDto(saved);
    }

    public GoalDto updateGoal(Long goalId, GoalDto dto, Long userId) {
        Goal goal = goalRepo.findById(goalId)
                .orElseThrow(() -> new IllegalArgumentException("Goal not found"));

        if (!goal.getUser().getUserId().equals(userId)) {
            throw new IllegalStateException("Unauthorized access to this goal");
        }

        goal.setGoalName(dto.getGoalName());
        goal.setTargetAmount(dto.getTargetAmount());
        if (dto.getCurrentAmount() != null) {
            goal.setCurrentAmount(dto.getCurrentAmount());
        }
        if (dto.getDeadline() != null) {
            goal.setDeadline(dto.getDeadline());
        }
        if (dto.getStatus() != null) {
            goal.setStatus(dto.getStatus().toUpperCase());
        }

        // Auto-mark completed if current amount exceeds or matches target
        if (goal.getCurrentAmount() >= goal.getTargetAmount()) {
            goal.setStatus("ACHIEVED");
        } else if ("ACHIEVED".equals(goal.getStatus()) && goal.getCurrentAmount() < goal.getTargetAmount()) {
            goal.setStatus("ACTIVE");
        }

        Goal updated = goalRepo.save(goal);
        return mapToDto(updated);
    }

    @Transactional
    public void depositToGoal(Long goalId, Double amount, Long userId) {
        if (amount <= 0) {
            throw new IllegalArgumentException("Deposit amount must be greater than zero");
        }

        User user = userRepo.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        Goal goal = goalRepo.findById(goalId)
                .orElseThrow(() -> new IllegalArgumentException("Goal not found"));

        if (!goal.getUser().getUserId().equals(userId)) {
            throw new IllegalStateException("Unauthorized access to this goal");
        }

        double balance = expenseService.getCashBalance(userId);
        if (balance < amount) {
            throw new IllegalArgumentException("Insufficient cash balance of $" + balance + " to deposit $" + amount + " into goal");
        }

        // Deduct from wallet by adding a DEBIT transaction
        Expense transaction = Expense.builder()
                .title("Goal Deposit: " + goal.getGoalName())
                .amount(amount)
                .category("SAVINGS")
                .transactionType("DEBIT")
                .expenseDate(LocalDate.now())
                .user(user)
                .build();
        expenseRepo.save(transaction);

        // Add to goal currentAmount
        goal.setCurrentAmount(goal.getCurrentAmount() + amount);
        if (goal.getCurrentAmount() >= goal.getTargetAmount()) {
            goal.setStatus("ACHIEVED");
        }

        goalRepo.save(goal);
    }

    public void deleteGoal(Long goalId, Long userId) {
        Goal goal = goalRepo.findById(goalId)
                .orElseThrow(() -> new IllegalArgumentException("Goal not found"));

        if (!goal.getUser().getUserId().equals(userId)) {
            throw new IllegalStateException("Unauthorized access to this goal");
        }

        // Refund the saved goal amount back to the user's cash wallet
        if (goal.getCurrentAmount() > 0) {
            Expense transaction = Expense.builder()
                    .title("Goal Cancellation Refund: " + goal.getGoalName())
                    .amount(goal.getCurrentAmount())
                    .category("CREDIT")
                    .transactionType("CREDIT")
                    .expenseDate(LocalDate.now())
                    .user(goal.getUser())
                    .build();
            expenseRepo.save(transaction);
        }

        goalRepo.delete(goal);
    }

    private double getUserNetWorth(Long userId) {
        try {
            return wellnessService.getPortfolioDetails(userId).getNetWorth();
        } catch (Exception e) {
            return 0.0;
        }
    }

    private GoalDto mapToDto(Goal goal) {
        double netWorth = getUserNetWorth(goal.getUser().getUserId());
        String status = goal.getStatus();
        if (netWorth >= goal.getTargetAmount()) {
            status = "ACHIEVED"; // Wait, in frontend HTML, it expects "ACHIEVED" instead of "COMPLETED"! Let's check: yes, html has goal.status === 'ACHIEVED'
        } else {
            status = "ACTIVE";
        }
        return GoalDto.builder()
                .goalId(goal.getGoalId())
                .goalName(goal.getGoalName())
                .targetAmount(goal.getTargetAmount())
                .currentAmount(netWorth)
                .deadline(goal.getDeadline())
                .status(status)
                .build();
    }
}
