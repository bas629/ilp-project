package com.example.first.repo;

import com.example.first.entity.Expense;
import com.example.first.entity.Expense;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ExpenseRepo extends JpaRepository<Expense, Long> {
    @Query(value = "SELECT SUM(amount) FROM expenses WHERE user_id = :id AND category LIKE %:category%", nativeQuery = true)
    Optional<Double> getTotalByCategory(@Param("id") Long id,
                                        @Param("category") String category);


}