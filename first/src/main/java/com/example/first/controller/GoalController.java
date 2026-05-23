package com.example.first.controller;

import com.example.first.Dto.GoalDto;
import com.example.first.entity.User;
import com.example.first.service.GoalService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/goals")
@RequiredArgsConstructor
public class GoalController {

    private final GoalService goalService;

    @GetMapping
    public ResponseEntity<List<GoalDto>> getGoals(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(goalService.getGoalsByUserId(user.getUserId()));
    }

    @PostMapping
    public ResponseEntity<GoalDto> addGoal(
            @AuthenticationPrincipal User user,
            @RequestBody GoalDto dto) {
        try {
            return ResponseEntity.ok(goalService.addGoal(dto, user.getUserId()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(null);
        }
    }

    @PutMapping("/{goalId}")
    public ResponseEntity<GoalDto> updateGoal(
            @AuthenticationPrincipal User user,
            @PathVariable Long goalId,
            @RequestBody GoalDto dto) {
        try {
            return ResponseEntity.ok(goalService.updateGoal(goalId, dto, user.getUserId()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(null);
        }
    }

    @PostMapping("/{goalId}/deposit")
    public ResponseEntity<Map<String, String>> depositToGoal(
            @AuthenticationPrincipal User user,
            @PathVariable Long goalId,
            @RequestBody Map<String, Double> payload) {
        try {
            Double amount = payload.get("amount");
            if (amount == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "Amount is required"));
            }
            goalService.depositToGoal(goalId, amount, user.getUserId());
            return ResponseEntity.ok(Map.of("message", "Deposited successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{goalId}")
    public ResponseEntity<Void> deleteGoal(
            @AuthenticationPrincipal User user,
            @PathVariable Long goalId) {
        try {
            goalService.deleteGoal(goalId, user.getUserId());
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }
}
