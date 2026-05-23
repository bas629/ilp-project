package com.example.first.repo;

import com.example.first.entity.PortfolioHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PortfolioHistoryRepo extends JpaRepository<PortfolioHistory, Long> {
    List<PortfolioHistory> findByUser_UserId(Long userId);
}
