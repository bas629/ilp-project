package com.example.first.repo;

import com.example.first.entity.Goal;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface GoalRepo extends JpaRepository<Goal, Long> {
    List<Goal> findByUser_UserId(Long userId);
}
