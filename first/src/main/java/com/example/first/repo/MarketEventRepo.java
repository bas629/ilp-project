package com.example.first.repo;

import com.example.first.entity.MarketEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MarketEventRepo extends JpaRepository<MarketEvent, Long> {
    List<MarketEvent> findAllByOrderByCreatedAtDesc();
}
