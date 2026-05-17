package com.example.first.repo;



import com.example.first.entity.Expense;
import com.example.first.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface UserRepo extends JpaRepository<User, Long> {
    User findByEmail(String email);



}
