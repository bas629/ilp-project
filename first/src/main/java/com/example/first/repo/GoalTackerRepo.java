package com.example.first.repo;

import com.example.first.entity.GoalTacker;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.Optional;

public interface GoalTackerRepo extends JpaRepository<GoalTacker, Long> {
    @Query(value = "SELECT * FROM goal_tacker WHERE user_id = :userId",
            nativeQuery = true)
    Optional<GoalTacker> findByUsertemp_Id(Long userId);

}
