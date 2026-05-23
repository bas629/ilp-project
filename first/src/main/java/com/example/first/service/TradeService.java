package com.example.first.service;

import com.example.first.entity.*;
import com.example.first.repo.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class TradeService {

    private final UserRepo userRepo;
    private final StockRepo stockRepo;
    private final BuyStockRepo buyStockRepo;
    private final GoldInvestmentRepo goldInvestmentRepo;
    private final PortfolioHistoryRepo portfolioHistoryRepo;
    private final ExpenseRepo expenseRepo;
    private final ExpenseService expenseService;
    private final MarketSimulationEngine marketSimulationEngine;

    @Transactional
    public void buyStock(Long userId, Long stockId, Integer quantity) {
        if (quantity <= 0) {
            throw new IllegalArgumentException("Quantity must be greater than zero");
        }

        User user = userRepo.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        Stock stock = stockRepo.findById(stockId)
                .orElseThrow(() -> new IllegalArgumentException("Stock not found"));

        double totalCost = stock.getCurrentPrice() * quantity;
        double balance = expenseService.getCashBalance(userId);

        if (balance < totalCost) {
            throw new IllegalArgumentException("Insufficient cash balance of $" + balance + " to purchase " + quantity + " shares of " + stock.getCompanyName() + " (Total Cost: $" + totalCost + ")");
        }

        // Check if user already holds this stock
        Optional<BuyStock> existingHoldingOpt = buyStockRepo.findByUser_UserIdAndStock_StockId(userId, stockId);
        BuyStock holding;
        if (existingHoldingOpt.isPresent()) {
            holding = existingHoldingOpt.get();
            double oldCost = holding.getTotalPrice();
            int oldQty = holding.getQuantity();

            int newQty = oldQty + quantity;
            double newCost = oldCost + totalCost;
            double avgPrice = newCost / newQty;

            holding.setQuantity(newQty);
            holding.setBuyPrice(Math.round(avgPrice * 100.0) / 100.0);
            holding.setTotalPrice(Math.round(newCost * 100.0) / 100.0);
            holding.setPurchaseDate(LocalDate.now());
        } else {
            holding = BuyStock.builder()
                    .user(user)
                    .stock(stock)
                    .quantity(quantity)
                    .buyPrice(stock.getCurrentPrice())
                    .totalPrice(totalCost)
                    .purchaseDate(LocalDate.now())
                    .build();
        }

        buyStockRepo.save(holding);

        // Record the transaction as a DEBIT in the expense log
        Expense transaction = Expense.builder()
                .title("Stock Purchase: " + quantity + " shares of " + stock.getCompanyName())
                .amount(totalCost)
                .category("STOCKS")
                .transactionType("DEBIT")
                .expenseDate(LocalDate.now())
                .user(user)
                .build();
        expenseRepo.save(transaction);

        // Log portfolio history
        portfolioHistoryRepo.save(PortfolioHistory.builder()
                .user(user)
                .stock(stock)
                .buyPrice(stock.getCurrentPrice())
                .currentPrice(stock.getCurrentPrice())
                .quantity(quantity)
                .profitLoss(0.0)
                .profitLossPercent(0.0)
                .updatedAt(LocalDateTime.now())
                .build());
    }

    @Transactional
    public void sellStock(Long userId, Long stockId, Integer quantity) {
        if (quantity <= 0) {
            throw new IllegalArgumentException("Quantity must be greater than zero");
        }

        User user = userRepo.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        Stock stock = stockRepo.findById(stockId)
                .orElseThrow(() -> new IllegalArgumentException("Stock not found"));

        BuyStock holding = buyStockRepo.findByUser_UserIdAndStock_StockId(userId, stockId)
                .orElseThrow(() -> new IllegalArgumentException("You do not own any shares of " + stock.getCompanyName()));

        if (holding.getQuantity() < quantity) {
            throw new IllegalArgumentException("Insufficient shares. You own " + holding.getQuantity() + " shares, but tried to sell " + quantity);
        }

        double sellPrice = stock.getCurrentPrice();
        double totalRevenue = sellPrice * quantity;

        double originalCostOfSoldQuantity = holding.getBuyPrice() * quantity;
        double profit = totalRevenue - originalCostOfSoldQuantity;
        double profitPercent = (profit / originalCostOfSoldQuantity) * 100.0;

        int remainingQty = holding.getQuantity() - quantity;
        if (remainingQty == 0) {
            buyStockRepo.delete(holding);
        } else {
            holding.setQuantity(remainingQty);
            holding.setTotalPrice(holding.getTotalPrice() - originalCostOfSoldQuantity);
            holding.setPurchaseDate(LocalDate.now());
            buyStockRepo.save(holding);
        }

        // Record transaction as a CREDIT in expense log
        Expense transaction = Expense.builder()
                .title("Stock Sale: " + quantity + " shares of " + stock.getCompanyName())
                .amount(totalRevenue)
                .category("STOCKS")
                .transactionType("CREDIT")
                .expenseDate(LocalDate.now())
                .user(user)
                .build();
        expenseRepo.save(transaction);

        // Log portfolio history
        portfolioHistoryRepo.save(PortfolioHistory.builder()
                .user(user)
                .stock(stock)
                .buyPrice(holding.getBuyPrice())
                .currentPrice(sellPrice)
                .quantity(-quantity)
                .profitLoss(profit)
                .profitLossPercent(profitPercent)
                .updatedAt(LocalDateTime.now())
                .build());
    }

    @Transactional
    public void buyGold(Long userId, Double amountGrams) {
        if (amountGrams <= 0) {
            throw new IllegalArgumentException("Grams amount must be greater than zero");
        }

        User user = userRepo.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        double goldPrice = marketSimulationEngine.getCurrentGoldPrice();
        double totalCost = goldPrice * amountGrams;
        double balance = expenseService.getCashBalance(userId);

        if (balance < totalCost) {
            throw new IllegalArgumentException("Insufficient cash balance of $" + balance + " to purchase " + amountGrams + "g of digital gold (Total Cost: $" + totalCost + ")");
        }

        // Find or create gold investment
        Optional<GoldInvestment> existingGoldOpt = goldInvestmentRepo.findByUser_UserId(userId)
                .stream().findFirst();

        GoldInvestment goldInv;
        if (existingGoldOpt.isPresent()) {
            goldInv = existingGoldOpt.get();
            double oldCost = goldInv.getCurrentGoldPrice() * goldInv.getGoldAmount();
            double newCost = oldCost + totalCost;
            double newGrams = goldInv.getGoldAmount() + amountGrams;
            double avgPrice = newCost / newGrams;

            goldInv.setGoldAmount(newGrams);
            goldInv.setCurrentGoldPrice(Math.round(avgPrice * 100.0) / 100.0);
            goldInv.setPurchaseDate(LocalDate.now());
            goldInv.setProfitLoss(0.0); // Reset or recalculate based on new average cost
        } else {
            goldInv = GoldInvestment.builder()
                    .user(user)
                    .goldAmount(amountGrams)
                    .currentGoldPrice(goldPrice)
                    .purchaseDate(LocalDate.now())
                    .profitLoss(0.0)
                    .build();
        }

        goldInvestmentRepo.save(goldInv);

        // Record as DEBIT in expense log
        Expense transaction = Expense.builder()
                .title("Digital Gold Purchase: " + amountGrams + " grams")
                .amount(totalCost)
                .category("GOLD")
                .transactionType("DEBIT")
                .expenseDate(LocalDate.now())
                .user(user)
                .build();
        expenseRepo.save(transaction);
    }

    @Transactional
    public void sellGold(Long userId, Double amountGrams) {
        if (amountGrams <= 0) {
            throw new IllegalArgumentException("Grams amount must be greater than zero");
        }

        User user = userRepo.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        GoldInvestment goldInv = goldInvestmentRepo.findByUser_UserId(userId)
                .stream().findFirst()
                .orElseThrow(() -> new IllegalArgumentException("You do not own any digital gold."));

        if (goldInv.getGoldAmount() < amountGrams) {
            throw new IllegalArgumentException("Insufficient gold balance. You own " + goldInv.getGoldAmount() + "g, but tried to sell " + amountGrams + "g");
        }

        double goldPrice = marketSimulationEngine.getCurrentGoldPrice();
        double totalRevenue = goldPrice * amountGrams;

        double originalCostOfSoldGrams = goldInv.getCurrentGoldPrice() * amountGrams;
        double profit = totalRevenue - originalCostOfSoldGrams;

        double remainingGrams = goldInv.getGoldAmount() - amountGrams;
        if (remainingGrams <= 0.0001) { // Floating point precision check
            goldInvestmentRepo.delete(goldInv);
        } else {
            goldInv.setGoldAmount(remainingGrams);
            // Average cost per gram remains the same, but the total investment size decreases
            goldInv.setPurchaseDate(LocalDate.now());
            goldInv.setProfitLoss(goldInv.getProfitLoss() + profit);
            goldInvestmentRepo.save(goldInv);
        }

        // Record as CREDIT in expense log
        Expense transaction = Expense.builder()
                .title("Digital Gold Sale: " + amountGrams + " grams")
                .amount(totalRevenue)
                .category("GOLD")
                .transactionType("CREDIT")
                .expenseDate(LocalDate.now())
                .user(user)
                .build();
        expenseRepo.save(transaction);
    }
}
