package com.example.first.controller;

import com.example.first.Dto.FinancialProfileDto;
import com.example.first.Dto.PortfolioDto;
import com.example.first.entity.User;
import com.example.first.service.WellnessService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/portfolio")
@RequiredArgsConstructor
public class PortfolioController {

    private final WellnessService wellnessService;

    @GetMapping
    public ResponseEntity<PortfolioDto> getPortfolio(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(wellnessService.getPortfolioDetails(user.getUserId()));
    }

    @GetMapping("/wellness")
    public ResponseEntity<FinancialProfileDto> getWellnessProfile(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(wellnessService.getFinancialProfile(user.getUserId()));
    }
}
