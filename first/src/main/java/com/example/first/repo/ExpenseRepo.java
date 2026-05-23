package com.example.first.repo;

import com.example.first.entity.Expense;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@Repository
public interface ExpenseRepo extends JpaRepository<Expense, Long> {
    List<Expense> findByUser_UserIdOrderByExpenseDateDesc(Long userId);

    @Query("SELECT SUM(e.amount) FROM Expense e WHERE e.user.userId = :userId AND e.transactionType = :type")
    Optional<Double> sumAmountByUserIdAndType(@Param("userId") Long userId, @Param("type") String type);

    @Query("SELECT e.category as category, SUM(e.amount) as amount FROM Expense e WHERE e.user.userId = :userId AND e.transactionType = 'DEBIT' GROUP BY e.category")
    List<Map<String, Object>> getCategoryWiseExpenses(@Param("userId") Long userId);
}