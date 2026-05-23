package com.example.first.repo;

import com.example.first.entity.Stock;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;
import java.util.List;

@Repository
public interface StockRepo extends JpaRepository<Stock, Long> {
    Optional<Stock> findByCompanyName(String companyName);
    List<Stock> findByVolatility(String volatility);
}
