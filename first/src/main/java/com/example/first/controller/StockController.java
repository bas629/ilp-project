package com.example.first.controller;

import com.example.first.Dto.StockDto;
import com.example.first.Dto.TradeRequest;
import com.example.first.entity.User;
import com.example.first.service.MarketSimulationEngine;
import com.example.first.service.TradeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/stocks")
@RequiredArgsConstructor
public class StockController {

    private final MarketSimulationEngine marketSimulationEngine;
    private final TradeService tradeService;

    @GetMapping
    public ResponseEntity<List<StockDto>> getStocks() {
        return ResponseEntity.ok(marketSimulationEngine.getStocksList());
    }

    @PostMapping("/trade")
    public ResponseEntity<Map<String, String>> tradeStock(
            @AuthenticationPrincipal User user,
            @RequestBody TradeRequest request) {
        try {
            if ("BUY".equalsIgnoreCase(request.getAction())) {
                tradeService.buyStock(user.getUserId(), request.getStockId(), request.getQuantity());
                return ResponseEntity.ok(Map.of("message", "Successfully bought " + request.getQuantity() + " shares"));
            } else if ("SELL".equalsIgnoreCase(request.getAction())) {
                tradeService.sellStock(user.getUserId(), request.getStockId(), request.getQuantity());
                return ResponseEntity.ok(Map.of("message", "Successfully sold " + request.getQuantity() + " shares"));
            } else {
                return ResponseEntity.badRequest().body(Map.of("error", "Invalid action: " + request.getAction()));
            }
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
