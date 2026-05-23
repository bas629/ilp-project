package com.example.first.service;

import com.example.first.Dto.FinancialProfileDto;
import com.example.first.Dto.PortfolioDto;
import com.example.first.Dto.StockHoldingDto;
import com.example.first.entity.*;
import com.example.first.repo.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class WellnessService {

    private final UserRepo userRepo;
    private final ExpenseRepo expenseRepo;
    private final BuyStockRepo buyStockRepo;
    private final GoldInvestmentRepo goldInvestmentRepo;
    private final GoalRepo goalRepo;
    private final FinancialProfileRepo financialProfileRepo;
    private final MarketSimulationEngine marketSimulationEngine;
    private final ExpenseService expenseService;

    // Soft budget limits for categories
    private static final Map<String, Double> CATEGORY_BUDGETS = Map.of(
            "FOOD", 1500.0,
            "ENTERTAINMENT", 800.0,
            "SHOPPING", 1200.0,
            "UTILITIES", 1000.0,
            "TRAVEL", 2000.0,
            "OTHERS", 1500.0
    );

    public PortfolioDto getPortfolioDetails(Long userId) {
        User user = userRepo.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        double cashBalance = expenseService.getCashBalance(userId);
        if (cashBalance < 0) cashBalance = 0.0;

        // 1. Calculate stock holdings
        List<BuyStock> holdings = buyStockRepo.findByUser_UserId(userId);
        List<StockHoldingDto> stockHoldingDtos = new ArrayList<>();
        double totalStockValue = 0.0;
        double weightedStockRiskSum = 0.0;

        for (BuyStock h : holdings) {
            Stock stock = h.getStock();
            double currentValue = stock.getCurrentPrice() * h.getQuantity();
            double totalCost = h.getTotalPrice();
            double profitLoss = currentValue - totalCost;
            double profitLossPercent = totalCost > 0 ? (profitLoss / totalCost) * 100.0 : 0.0;

            totalStockValue += currentValue;
            weightedStockRiskSum += currentValue * stock.getRiskPercent();

            stockHoldingDtos.add(StockHoldingDto.builder()
                    .stockId(stock.getStockId())
                    .companyName(stock.getCompanyName())
                    .sector(stock.getSector())
                    .quantity(h.getQuantity())
                    .avgBuyPrice(h.getBuyPrice())
                    .currentPrice(stock.getCurrentPrice())
                    .totalCost(Math.round(totalCost * 100.0) / 100.0)
                    .currentValue(Math.round(currentValue * 100.0) / 100.0)
                    .profitLoss(Math.round(profitLoss * 100.0) / 100.0)
                    .profitLossPercent(Math.round(profitLossPercent * 100.0) / 100.0)
                    .riskPercent(stock.getRiskPercent())
                    .build());
        }

        // 2. Calculate gold holdings
        List<GoldInvestment> goldInvestments = goldInvestmentRepo.findByUser_UserId(userId);
        double goldGrams = 0.0;
        double goldTotalCost = 0.0;
        for (GoldInvestment g : goldInvestments) {
            goldGrams += g.getGoldAmount();
            goldTotalCost += g.getCurrentGoldPrice() * g.getGoldAmount();
        }

        double currentGoldPrice = marketSimulationEngine.getCurrentGoldPrice();
        double goldHoldingsValue = goldGrams * currentGoldPrice;
        double goldProfitLoss = goldHoldingsValue - goldTotalCost;

        // 3. Compute totals
        double netWorth = cashBalance + totalStockValue + goldHoldingsValue;
        // Use a separate divisor to avoid division-by-zero in ratio calculations,
        // without corrupting the actual netWorth shown to the user.
        double netWorthDivisor = netWorth <= 0 ? 1.0 : netWorth;

        // 4. Portfolio Risk calculation (Cash has 0% risk, Gold has 5% risk, Stocks have their own risk)
        double goldWeightedRisk = goldHoldingsValue * 5.0; // gold has stable 5% risk
        double portfolioRisk = (weightedStockRiskSum + goldWeightedRisk) / netWorthDivisor;
        portfolioRisk = Math.round(portfolioRisk * 100.0) / 100.0;

        // 5. Diversification Score calculation
        double wCash = cashBalance / netWorthDivisor;
        double wStocks = totalStockValue / netWorthDivisor;
        double wGold = goldHoldingsValue / netWorthDivisor;
        double sumSqWeights = (wCash * wCash) + (wStocks * wStocks) + (wGold * wGold);
        double diversificationScore = 100.0 * (1.0 - sumSqWeights);
        diversificationScore = Math.round(diversificationScore * 100.0) / 100.0;

        return PortfolioDto.builder()
                .cashBalance(Math.round(cashBalance * 100.0) / 100.0)
                .stockHoldingsValue(Math.round(totalStockValue * 100.0) / 100.0)
                .goldHoldingsValue(Math.round(goldHoldingsValue * 100.0) / 100.0)
                .netWorth(Math.round(netWorth * 100.0) / 100.0)
                .portfolioRisk(portfolioRisk)
                .diversificationScore(diversificationScore)
                .stockHoldings(stockHoldingDtos)
                .goldGrams(Math.round(goldGrams * 100.0) / 100.0)
                .goldProfitLoss(Math.round(goldProfitLoss * 100.0) / 100.0)
                .build();
    }

    @Transactional
    public FinancialProfileDto getFinancialProfile(Long userId) {
        User user = userRepo.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        PortfolioDto portfolio = getPortfolioDetails(userId);
        double cashBalance = portfolio.getCashBalance();
        double netWorth = portfolio.getNetWorth();

        // --- 1. Savings Ratio Score (S_savings) ---
        double totalCredits = expenseRepo.sumAmountByUserIdAndType(userId, "CREDIT").orElse(0.0);
        double totalDebits = expenseRepo.sumAmountByUserIdAndType(userId, "DEBIT").orElse(0.0);
        double savingsAmount = totalCredits - totalDebits;
        if (savingsAmount < 0) savingsAmount = 0.0;

        double savingsRatio = totalCredits > 0 ? (savingsAmount / totalCredits) : 0.0;
        // Target savings ratio is 30%. S_savings = (ratio / 0.30) * 100
        double sSavings = savingsRatio >= 0.30 ? 100.0 : (savingsRatio / 0.30) * 100.0;
        if (sSavings < 0) sSavings = 0.0;

        // --- 2. Budget Score (S_budget) ---
        double sBudget = 100.0;
        List<Map<String, Object>> categoryExpenses = expenseRepo.getCategoryWiseExpenses(userId);
        List<String> budgetExceededCategories = new ArrayList<>();
        Map<String, Double> categoryActuals = new HashMap<>();

        for (Map<String, Object> catMap : categoryExpenses) {
            String category = (String) catMap.get("category");
            Double actualAmount = (Double) catMap.get("amount");
            if (category != null && actualAmount != null) {
                categoryActuals.put(category.toUpperCase(), actualAmount);
                Double budgetLimit = CATEGORY_BUDGETS.getOrDefault(category.toUpperCase(), CATEGORY_BUDGETS.get("OTHERS"));
                if (actualAmount > budgetLimit) {
                    sBudget -= 15.0; // Deduct 15 points per breached category
                    budgetExceededCategories.add(category.toUpperCase());
                }
            }
        }
        if (sBudget < 0) sBudget = 0.0;

        // --- 3. Diversity Score (S_diversity) ---
        int assetCount = 0;
        if (cashBalance > 100.0) assetCount++;
        if (portfolio.getStockHoldingsValue() > 0) assetCount++;
        if (portfolio.getGoldHoldingsValue() > 0) assetCount++;
        double sDiversity = (assetCount / 3.0) * 100.0;

        // --- 4. Goal Score (S_goals) ---
        List<Goal> goals = goalRepo.findByUser_UserId(userId);
        double sGoals = 100.0;
        if (!goals.isEmpty()) {
            double totalProgress = 0.0;
            for (Goal g : goals) {
                double progress = g.getTargetAmount() > 0 ? (g.getCurrentAmount() / g.getTargetAmount()) * 100.0 : 100.0;
                if (progress > 100.0) progress = 100.0;
                totalProgress += progress;
            }
            sGoals = totalProgress / goals.size();
        } else {
            // Default goal score is 70.0 if user has no goals setup yet (doesn't penalize too heavily)
            sGoals = 70.0;
        }

        // --- Weighted Score S ---
        double finalScoreVal = (0.25 * sSavings) + (0.25 * sBudget) + (0.25 * sDiversity) + (0.25 * sGoals);
        int finalScore = (int) Math.round(finalScoreVal);
        if (finalScore > 100) finalScore = 100;
        if (finalScore < 0) finalScore = 0;

        String currentStatus;
        if (finalScore >= 80) currentStatus = "EXCELLENT";
        else if (finalScore >= 60) currentStatus = "GOOD";
        else if (finalScore >= 40) currentStatus = "FAIR";
        else currentStatus = "POOR";

        // Update database FinancialProfile for user persistence
        FinancialProfile profile = financialProfileRepo.findByUser_UserId(userId)
                .orElse(FinancialProfile.builder().user(user).build());

        profile.setFinancialScore(finalScore);
        profile.setRiskPercentage(portfolio.getPortfolioRisk());
        profile.setSavings(savingsAmount);
        profile.setCurrentStatus(currentStatus);
        financialProfileRepo.save(profile);

        // --- Compile Rule-Based AI Recommendations ---
        List<String> recommendations = new ArrayList<>();

        // Cash emergency advice
        double cashPercentOfWorth = (cashBalance / netWorth) * 100.0;
        if (cashPercentOfWorth < 10.0) {
            recommendations.add("Your cash balance is only " + Math.round(cashPercentOfWorth) + "% of net worth. We recommend maintaining at least 10% in liquid cash as an emergency fund.");
        }

        // Risk diversification advice
        if (portfolio.getPortfolioRisk() > 25.0) {
            recommendations.add("Your portfolio risk is high (" + portfolio.getPortfolioRisk() + "%). Consider shifting some funds into safer haven assets like Digital Gold or increasing cash savings.");
        }

        // Seeding advice for stocks
        if (portfolio.getStockHoldingsValue() == 0) {
            recommendations.add("You don't hold any stock investments. Consider starting with low-volatility blue chip stock assets like TCS or HDFC Bank to earn higher yields.");
        }

        // Seeding advice for gold
        if (portfolio.getGoldHoldingsValue() == 0) {
            recommendations.add("Digital Gold acts as an excellent hedge. Consider putting 5-10% of your portfolio in gold to lower overall volatility.");
        }

        // Budget breach warnings
        for (String cat : budgetExceededCategories) {
            double actual = categoryActuals.get(cat);
            double limit = CATEGORY_BUDGETS.getOrDefault(cat, CATEGORY_BUDGETS.get("OTHERS"));
            recommendations.add("Budget breach! You spent $" + Math.round(actual) + " on " + cat + " (Limit: $" + Math.round(limit) + "). Consider reducing non-essential expenses.");
        }

        // Goal tracker warnings
        for (Goal g : goals) {
            if ("ACTIVE".equalsIgnoreCase(g.getStatus())) {
                double diff = g.getTargetAmount() - g.getCurrentAmount();
                double progress = (g.getCurrentAmount() / g.getTargetAmount()) * 100.0;
                if (progress >= 80.0 && diff > 0) {
                    recommendations.add("Goal close! You are " + Math.round(progress) + "% of the way to your '" + g.getGoalName() + "' goal. Deposit another $" + Math.round(diff) + " to complete it!");
                }
            }
        }

        // General wellness status message
        if (finalScore >= 80) {
            recommendations.add("Fantastic work! Your financial habits are healthy. Keep up the disciplined budget tracking and goal deposits.");
        } else if (finalScore < 50) {
            recommendations.add("Action needed: Try setting up active savings goals, capping category expenditures, and maintaining a positive monthly savings rate to boost your wellness score.");
        }

        return FinancialProfileDto.builder()
                .financialScore(finalScore)
                .riskPercentage(portfolio.getPortfolioRisk())
                .savings(Math.round(savingsAmount * 100.0) / 100.0)
                .currentStatus(currentStatus)
                .recommendations(recommendations)
                .build();
    }
}
