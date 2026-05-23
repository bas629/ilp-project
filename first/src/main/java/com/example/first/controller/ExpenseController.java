package com.example.first.controller;

import com.example.first.Dto.ExpenseDto;
import com.example.first.entity.User;
import com.example.first.service.ExpenseService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/expenses")
@RequiredArgsConstructor
public class ExpenseController {

    private final ExpenseService expenseService;

    @GetMapping
    public ResponseEntity<List<ExpenseDto>> getExpenses(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(expenseService.getExpensesByUserId(user.getUserId()));
    }

    @GetMapping("/balance")
    public ResponseEntity<Double> getCashBalance(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(expenseService.getCashBalance(user.getUserId()));
    }

    @PostMapping
    public ResponseEntity<ExpenseDto> addExpense(
            @AuthenticationPrincipal User user,
            @RequestBody ExpenseDto dto) {
        try {
            ExpenseDto created = expenseService.addExpense(dto, user.getUserId());
            return ResponseEntity.ok(created);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(null);
        }
    }

    @PutMapping("/{expenseId}")
    public ResponseEntity<ExpenseDto> updateExpense(
            @AuthenticationPrincipal User user,
            @PathVariable Long expenseId,
            @RequestBody ExpenseDto dto) {
        try {
            ExpenseDto updated = expenseService.updateExpense(expenseId, dto, user.getUserId());
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(null);
        }
    }

    @DeleteMapping("/{expenseId}")
    public ResponseEntity<Void> deleteExpense(
            @AuthenticationPrincipal User user,
            @PathVariable Long expenseId) {
        try {
            expenseService.deleteExpense(expenseId, user.getUserId());
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }
}
