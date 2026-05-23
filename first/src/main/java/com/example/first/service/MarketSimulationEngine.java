package com.example.first.service;

import com.example.first.Dto.StockDto;
import com.example.first.entity.*;
import com.example.first.repo.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class MarketSimulationEngine {

    private final StockRepo stockRepo;
    private final StockHistoryRepo stockHistoryRepo;
    private final GoldHistoryRepo goldHistoryRepo;
    private final MarketEventRepo marketEventRepo;
    private final UserRepo userRepo;
    private final ExpenseRepo expenseRepo;
    private final PasswordEncoder passwordEncoder;
    private final SimpMessagingTemplate messagingTemplate;

    private String currentMarketCycle = "NORMAL"; // NORMAL, BULL, BEAR, CRASH, BOOM
    private int cycleTickCount = 0;
    private double currentGoldPrice = 75.0; // Starting price per gram

    private final Random random = new Random();

    @EventListener(ApplicationReadyEvent.class)
    @Transactional
    public void seedInitialData() {
        // 1. Seed User
        if (!userRepo.existsByEmail("test@example.com")) {
            User user = User.builder()
                    .name("Test User")
                    .email("test@example.com")
                    .password(passwordEncoder.encode("password"))
                    .mobileNo("9876543210")
                    .role("ROLE_USER")
                    .build();
            User savedUser = userRepo.save(user);

            // Seed initial wallet deposit of $50,000
            Expense welcomeCredit = Expense.builder()
                    .title("Signup Welcoming Credit")
                    .amount(50000.0)
                    .category("CREDIT")
                    .transactionType("CREDIT")
                    .expenseDate(LocalDate.now())
                    .user(savedUser)
                    .build();
            expenseRepo.save(welcomeCredit);
            log.info("Default user test@example.com seeded with $50,000 cash.");
        }

        // 2. Seed 10 Stocks
        if (stockRepo.count() == 0) {
            List<Stock> defaultStocks = List.of(
                    Stock.builder().companyName("TCS").currentPrice(42.0).previousPrice(42.0).riskPercent(2.0).expectedReturn(8.0).marketCap(150000L).sector("IT").volatility("LOW").stockStatus("STABLE").lastUpdated(LocalDateTime.now()).build(),
                    Stock.builder().companyName("Reliance Industries").currentPrice(30.0).previousPrice(30.0).riskPercent(6.0).expectedReturn(12.0).marketCap(200000L).sector("ENERGY").volatility("MEDIUM").stockStatus("STABLE").lastUpdated(LocalDateTime.now()).build(),
                    Stock.builder().companyName("HDFC Bank").currentPrice(20.0).previousPrice(20.0).riskPercent(3.0).expectedReturn(9.0).marketCap(120000L).sector("BANKING").volatility("LOW").stockStatus("STABLE").lastUpdated(LocalDateTime.now()).build(),
                    Stock.builder().companyName("Zomato").currentPrice(15.0).previousPrice(15.0).riskPercent(14.0).expectedReturn(22.0).marketCap(60000L).sector("TECH").volatility("HIGH").stockStatus("STABLE").lastUpdated(LocalDateTime.now()).build(),
                    Stock.builder().companyName("Tata Motors").currentPrice(8.0).previousPrice(8.0).riskPercent(9.0).expectedReturn(15.0).marketCap(80000L).sector("AUTOMOBILE").volatility("MEDIUM").stockStatus("STABLE").lastUpdated(LocalDateTime.now()).build(),
                    Stock.builder().companyName("Infosys").currentPrice(18.0).previousPrice(18.0).riskPercent(4.5).expectedReturn(10.0).marketCap(90000L).sector("IT").volatility("LOW").stockStatus("STABLE").lastUpdated(LocalDateTime.now()).build(),
                    Stock.builder().companyName("Adani Enterprises").currentPrice(35.0).previousPrice(35.0).riskPercent(18.0).expectedReturn(25.0).marketCap(75000L).sector("INFRASTRUCTURE").volatility("HIGH").stockStatus("STABLE").lastUpdated(LocalDateTime.now()).build(),
                    Stock.builder().companyName("ITC").currentPrice(5.0).previousPrice(5.0).riskPercent(1.5).expectedReturn(6.0).marketCap(40000L).sector("CONSUMER_GOODS").volatility("LOW").stockStatus("STABLE").lastUpdated(LocalDateTime.now()).build(),
                    Stock.builder().companyName("L&T").currentPrice(28.0).previousPrice(28.0).riskPercent(7.0).expectedReturn(11.0).marketCap(110000L).sector("CONSTRUCTION").volatility("MEDIUM").stockStatus("STABLE").lastUpdated(LocalDateTime.now()).build(),
                    Stock.builder().companyName("SBI").currentPrice(12.0).previousPrice(12.0).riskPercent(8.5).expectedReturn(10.0).marketCap(95000L).sector("BANKING").volatility("MEDIUM").stockStatus("STABLE").lastUpdated(LocalDateTime.now()).build()
            );
            stockRepo.saveAll(defaultStocks);

            // Pre-seed some history for each stock
            for (Stock s : defaultStocks) {
                for (int i = 5; i > 0; i--) {
                    double offset = (random.nextDouble() - 0.5) * 2;
                    stockHistoryRepo.save(StockHistory.builder()
                            .stock(s)
                            .oldPrice(s.getCurrentPrice() - offset)
                            .newPrice(s.getCurrentPrice())
                            .updatedAt(LocalDateTime.now().minusSeconds(i * 30))
                            .build());
                }
            }
            log.info("10 default stocks seeded.");
        }

        // 3. Seed Gold History
        if (goldHistoryRepo.count() == 0) {
            goldHistoryRepo.save(GoldHistory.builder()
                    .oldPrice(75.0)
                    .newPrice(75.0)
                    .updatedAt(LocalDateTime.now())
                    .build());
            log.info("Initial Gold price set to $75/gram.");
        } else {
            List<GoldHistory> histories = goldHistoryRepo.findTop30ByOrderByUpdatedAtDesc();
            if (!histories.isEmpty()) {
                currentGoldPrice = histories.get(0).getNewPrice();
            }
        }
    }

    @Scheduled(fixedRate = 10000)
    @Transactional
    public void executeSimulationTick() {
        cycleTickCount++;
        // Cycle change logic: every 10 ticks (5 minutes), change economic cycle
        if (cycleTickCount >= 10) {
            cycleTickCount = 0;
            triggerCycleChange();
        }

        // 1. Update stock prices
        List<Stock> stocks = stockRepo.findAll();
        for (Stock stock : stocks) {
            double volatilityFactor = getVolatilityFactor(stock.getVolatility());
            double r = random.nextGaussian(); // Normal distribution N(0, 1)
            double changePercent = r * volatilityFactor;

            // Apply cycle impacts
            double cycleImpact = getCycleImpact(stock);
            double totalChange = changePercent + cycleImpact;

            // Cap the change to protect user experience from crazy spikes/drops
            double maxCap = volatilityFactor * 2.5;
            if (totalChange > maxCap) totalChange = maxCap;
            if (totalChange < -maxCap) totalChange = -maxCap;

            double oldPrice = stock.getCurrentPrice();
            double newPrice = oldPrice * (1.0 + totalChange);

            // Maintain boundaries
            if (newPrice < 1.0) newPrice = 1.0;
            newPrice = Math.round(newPrice * 100.0) / 100.0;

            stock.setPreviousPrice(oldPrice);
            stock.setCurrentPrice(newPrice);
            stock.setStockStatus(newPrice > oldPrice ? "UP" : (newPrice < oldPrice ? "DOWN" : "STABLE"));
            stock.setLastUpdated(LocalDateTime.now());
            stockRepo.save(stock);

            // Log history
            stockHistoryRepo.save(StockHistory.builder()
                    .stock(stock)
                    .oldPrice(oldPrice)
                    .newPrice(newPrice)
                    .updatedAt(LocalDateTime.now())
                    .build());
        }

        // 2. Update digital gold price (safe-haven assets fluctuate between +- 0.5% to +- 2.0%)
        double oldGoldPrice = currentGoldPrice;
        double goldVolatility = 0.005 + (random.nextDouble() * 0.015); // 0.5% to 2%
        double goldChangePercent = (random.nextDouble() - 0.5) * 2 * goldVolatility;

        // In a CRASH cycle, gold acts as a safe haven (positive bias)
        if ("CRASH".equals(currentMarketCycle)) {
            goldChangePercent += 0.015; // Positive bias of +1.5%
        } else if ("BEAR".equals(currentMarketCycle)) {
            goldChangePercent += 0.005; // Positive bias of +0.5%
        }

        double newGoldPrice = oldGoldPrice * (1.0 + goldChangePercent);
        newGoldPrice = Math.round(newGoldPrice * 100.0) / 100.0;
        if (newGoldPrice < 20.0) newGoldPrice = 20.0;
        currentGoldPrice = newGoldPrice;

        goldHistoryRepo.save(GoldHistory.builder()
                .oldPrice(oldGoldPrice)
                .newPrice(newGoldPrice)
                .updatedAt(LocalDateTime.now())
                .build());

        // 3. Broadcast ticks via WebSockets
        broadcastMarketUpdates();
    }

    private double getVolatilityFactor(String volatility) {
        switch (volatility.toUpperCase()) {
            case "LOW":
                return 0.01;  // max 1%
            case "MEDIUM":
                return 0.03;  // max 3%
            case "HIGH":
                return 0.07;  // max 7%
            default:
                return 0.02;
        }
    }

    private double getCycleImpact(Stock stock) {
        switch (currentMarketCycle) {
            case "BULL":
                return 0.01; // Positive shift +1.0%
            case "BEAR":
                return -0.01; // Negative shift -1.0%
            case "CRASH":
                if ("HIGH".equalsIgnoreCase(stock.getVolatility())) {
                    return -0.05; // High volatility crash -5%
                }
                return -0.02; // General crash -2%
            case "BOOM":
                if ("IT".equalsIgnoreCase(stock.getSector()) || "TECH".equalsIgnoreCase(stock.getSector())) {
                    return 0.045; // Tech boom +4.5%
                }
                return 0.015; // General boom +1.5%
            default:
                return 0.0;
        }
    }

    private void triggerCycleChange() {
        String[] cycles = {"NORMAL", "BULL", "BEAR", "CRASH", "BOOM"};
        String nextCycle = cycles[random.nextInt(cycles.length)];
        currentMarketCycle = nextCycle;

        String eventName = "";
        String effectDescription = "";

        switch (nextCycle) {
            case "BULL":
                eventName = "Positive Economic Indicators Drive Bull Market Run";
                effectDescription = "All sectors are seeing steady upward pressure. Favorable inflation data boosts stock prices.";
                break;
            case "BEAR":
                eventName = "Concerns Over Interest Rate Hikes Trigger Bear Cycle";
                effectDescription = "Investors pull back cash; expect minor downward pressure across all sectors.";
                break;
            case "CRASH":
                eventName = "Sudden Global Supply Chain Disruption Causes Market Panics";
                effectDescription = "Sharp corrections! High volatility and high-risk speculative stocks are suffering major drops. Gold prices are surging.";
                break;
            case "BOOM":
                eventName = "AI Developments & IT Revolution Boost Productivity Outlook";
                effectDescription = "IT and technology stocks are soaring. Strong corporate earnings reports support heavy buying.";
                break;
            default:
                eventName = "Market Reaches Equilibrium and Consolidates";
                effectDescription = "Stable trading ranges. Price changes are purely driven by individual stock volatility.";
                break;
        }

        MarketEvent event = MarketEvent.builder()
                .eventName(eventName)
                .marketEffect(nextCycle)
                .createdAt(LocalDateTime.now())
                .build();
        marketEventRepo.save(event);

        log.info("Market Cycle changed to {}: {}", nextCycle, eventName);

        // Broadcast news event
        Map<String, String> eventMsg = new HashMap<>();
        eventMsg.put("eventName", eventName);
        eventMsg.put("marketEffect", nextCycle);
        eventMsg.put("description", effectDescription);
        eventMsg.put("createdAt", LocalDateTime.now().toString());
        messagingTemplate.convertAndSend("/topic/market/events", eventMsg);
    }

    public void broadcastMarketUpdates() {
        // Broadcast Stocks
        List<StockDto> stockDtos = getStocksList();
        messagingTemplate.convertAndSend("/topic/market/stocks", stockDtos);

        // Broadcast Gold Price
        Map<String, Object> goldMsg = new HashMap<>();
        goldMsg.put("price", currentGoldPrice);
        goldMsg.put("currentPrice", currentGoldPrice);
        goldMsg.put("marketCycle", currentMarketCycle);
        goldMsg.put("updatedAt", LocalDateTime.now().toString());
        messagingTemplate.convertAndSend("/topic/market/gold", goldMsg);
    }

    public List<StockDto> getStocksList() {
        return stockRepo.findAll().stream().map(stock -> {
            // Find recent 10 price records
            List<Double> history = stockHistoryRepo.findByStock_StockIdOrderByUpdatedAtAsc(stock.getStockId())
                    .stream()
                    .map(StockHistory::getNewPrice)
                    .collect(Collectors.toList());

            // Limit to last 15 elements to avoid bulky message loads
            if (history.size() > 15) {
                history = history.subList(history.size() - 15, history.size());
            }

            return StockDto.builder()
                    .stockId(stock.getStockId())
                    .companyName(stock.getCompanyName())
                    .currentPrice(stock.getCurrentPrice())
                    .previousPrice(stock.getPreviousPrice())
                    .riskPercent(stock.getRiskPercent())
                    .expectedReturn(stock.getExpectedReturn())
                    .marketCap(stock.getMarketCap())
                    .sector(stock.getSector())
                    .volatility(stock.getVolatility())
                    .stockStatus(stock.getStockStatus())
                    .lastUpdated(stock.getLastUpdated())
                    .priceHistory(history)
                    .build();
        }).collect(Collectors.toList());
    }

    public double getCurrentGoldPrice() {
        return currentGoldPrice;
    }

    public String getCurrentMarketCycle() {
        return currentMarketCycle;
    }
}
