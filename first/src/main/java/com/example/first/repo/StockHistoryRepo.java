package com.example.first.repo;

import com.example.first.entity.StockHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface StockHistoryRepo extends JpaRepository<StockHistory, Long> {
    List<StockHistory> findByStock_StockIdOrderByUpdatedAtAsc(Long stockId);
    List<StockHistory> findTop30ByStock_StockIdOrderByUpdatedAtDesc(Long stockId);
}
