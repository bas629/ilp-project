package com.example.first.repo;

import com.example.first.entity.BuyStock;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BuyStockRepo extends JpaRepository<BuyStock, Long> {
    List<BuyStock> findByUser_UserId(Long userId);
    Optional<BuyStock> findByUser_UserIdAndStock_StockId(Long userId, Long stockId);
}
