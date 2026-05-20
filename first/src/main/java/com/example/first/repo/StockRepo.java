package com.example.first.repo;

import com.example.first.entity.Stock;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface StockRepo extends JpaRepository<Stock, Long> {

    @Query(value = "SELECT * FROM Stock WHERE risk_percent <= :risk",
            nativeQuery = true)
    List<Stock> findStockByRisk(int risk);
}
