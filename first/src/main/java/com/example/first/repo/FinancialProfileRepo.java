package com.example.first.repo;

import com.example.first.entity.FinancialProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface FinancialProfileRepo extends JpaRepository<FinancialProfile, Long> {
    Optional<FinancialProfile> findByUser_UserId(Long userId);
}
