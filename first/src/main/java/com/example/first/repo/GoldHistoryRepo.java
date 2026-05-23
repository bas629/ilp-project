package com.example.first.repo;

import com.example.first.entity.GoldHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface GoldHistoryRepo extends JpaRepository<GoldHistory, Long> {
    List<GoldHistory> findAllByOrderByUpdatedAtAsc();
    List<GoldHistory> findTop30ByOrderByUpdatedAtDesc();
}
