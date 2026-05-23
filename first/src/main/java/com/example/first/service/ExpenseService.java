package com.example.first.service;

import com.example.first.Dto.ExpenseDto;
import com.example.first.entity.Expense;
import com.example.first.entity.User;
import com.example.first.repo.ExpenseRepo;
import com.example.first.repo.UserRepo;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ExpenseService {

    private final ExpenseRepo expenseRepo;
    private final UserRepo userRepo;

    public List<ExpenseDto> getExpensesByUserId(Long userId) {
        return expenseRepo.findByUser_UserIdOrderByExpenseDateDesc(userId)
                .stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    public Double getCashBalance(Long userId) {
        Double totalCredit = expenseRepo.sumAmountByUserIdAndType(userId, "CREDIT").orElse(0.0);
        Double totalDebit = expenseRepo.sumAmountByUserIdAndType(userId, "DEBIT").orElse(0.0);
        return totalCredit - totalDebit;
    }

    public ExpenseDto addExpense(ExpenseDto dto, Long userId) {
        User user = userRepo.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        if ("DEBIT".equalsIgnoreCase(dto.getTransactionType())) {
            double currentBalance = getCashBalance(userId);
            if (currentBalance < dto.getAmount()) {
                throw new IllegalArgumentException("Insufficient cash balance of $" + currentBalance + " for expense amount $" + dto.getAmount());
            }
        }

        Expense expense = Expense.builder()
                .title(dto.getTitle())
                .amount(dto.getAmount())
                .category(dto.getCategory().toUpperCase())
                .transactionType(dto.getTransactionType().toUpperCase())
                .expenseDate(dto.getExpenseDate() != null ? dto.getExpenseDate() : LocalDate.now())
                .user(user)
                .build();

        Expense saved = expenseRepo.save(expense);
        return mapToDto(saved);
    }

    public ExpenseDto updateExpense(Long expenseId, ExpenseDto dto, Long userId) {
        Expense expense = expenseRepo.findById(expenseId)
                .orElseThrow(() -> new IllegalArgumentException("Expense not found"));

        if (!expense.getUser().getUserId().equals(userId)) {
            throw new IllegalStateException("Unauthorized access to this expense");
        }

        // Calculate potential balance change if we change the transaction amount/type
        if ("DEBIT".equalsIgnoreCase(dto.getTransactionType())) {
            double originalExpenseAmount = expense.getTransactionType().equalsIgnoreCase("DEBIT") ? expense.getAmount() : 0;
            double currentBalanceWithoutOriginal = getCashBalance(userId) + originalExpenseAmount;
            if (currentBalanceWithoutOriginal < dto.getAmount()) {
                throw new IllegalArgumentException("Insufficient cash balance of $" + currentBalanceWithoutOriginal + " to update this expense to $" + dto.getAmount());
            }
        }

        expense.setTitle(dto.getTitle());
        expense.setAmount(dto.getAmount());
        expense.setCategory(dto.getCategory().toUpperCase());
        expense.setTransactionType(dto.getTransactionType().toUpperCase());
        if (dto.getExpenseDate() != null) {
            expense.setExpenseDate(dto.getExpenseDate());
        }

        Expense updated = expenseRepo.save(expense);
        return mapToDto(updated);
    }

    public void deleteExpense(Long expenseId, Long userId) {
        Expense expense = expenseRepo.findById(expenseId)
                .orElseThrow(() -> new IllegalArgumentException("Expense not found"));

        if (!expense.getUser().getUserId().equals(userId)) {
            throw new IllegalStateException("Unauthorized access to this expense");
        }

        // If deleting a CREDIT transaction, ensure it doesn't leave user balance negative
        if ("CREDIT".equalsIgnoreCase(expense.getTransactionType())) {
            double currentBalance = getCashBalance(userId);
            if (currentBalance < expense.getAmount()) {
                throw new IllegalArgumentException("Cannot delete this credit of $" + expense.getAmount() + " because it would make your cash balance negative.");
            }
        }

        expenseRepo.delete(expense);
    }

    private ExpenseDto mapToDto(Expense expense) {
        return ExpenseDto.builder()
                .expenseId(expense.getExpenseId())
                .title(expense.getTitle())
                .amount(expense.getAmount())
                .category(expense.getCategory())
                .transactionType(expense.getTransactionType())
                .expenseDate(expense.getExpenseDate())
                .userId(expense.getUser().getUserId())
                .build();
    }
}
