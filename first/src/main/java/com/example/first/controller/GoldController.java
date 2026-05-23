package com.example.first.controller;

import com.example.first.Dto.GoldTradeRequest;
import com.example.first.entity.User;
import com.example.first.service.MarketSimulationEngine;
import com.example.first.service.TradeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/gold")
@RequiredArgsConstructor
public class GoldController {

    private final MarketSimulationEngine marketSimulationEngine;
    private final TradeService tradeService;

    @GetMapping("/price")
    public ResponseEntity<Map<String, Object>> getGoldPrice() {
        return ResponseEntity.ok(Map.of(
                "price", marketSimulationEngine.getCurrentGoldPrice(),
                "marketCycle", marketSimulationEngine.getCurrentMarketCycle()
        ));
    }

    @PostMapping("/trade")
    public ResponseEntity<Map<String, String>> tradeGold(
            @AuthenticationPrincipal User user,
            @RequestBody GoldTradeRequest request) {
        try {
            if ("BUY".equalsIgnoreCase(request.getAction())) {
                tradeService.buyGold(user.getUserId(), request.getAmount());
                return ResponseEntity.ok(Map.of("message", "Successfully purchased " + request.getAmount() + "g of digital gold"));
            } else if ("SELL".equalsIgnoreCase(request.getAction())) {
                tradeService.sellGold(user.getUserId(), request.getAmount());
                return ResponseEntity.ok(Map.of("message", "Successfully sold " + request.getAmount() + "g of digital gold"));
            } else {
                return ResponseEntity.badRequest().body(Map.of("error", "Invalid action: " + request.getAction()));
            }
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
