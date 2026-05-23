package com.example.first.repo;

import com.example.first.entity.GoldInvestment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface GoldInvestmentRepo extends JpaRepository<GoldInvestment, Long> {
    List<GoldInvestment> findByUser_UserId(Long userId);
}
