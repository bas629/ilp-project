package com.example.first.repo;

import com.example.first.entity.Investment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface InvestmentRepo extends JpaRepository<Investment, Long> {
    List<Investment> findByUser_UserId(Long userId);
}
