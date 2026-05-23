package com.example.first.service;

import com.example.first.Dto.AuthResponse;
import com.example.first.Dto.RegisterRequest;
import com.example.first.Dto.LoginRequest;
import com.example.first.entity.User;
import com.example.first.entity.Expense;
import com.example.first.repo.UserRepo;
import com.example.first.repo.ExpenseRepo;
import com.example.first.config.JwtUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDate;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepo userRepo;
    private final ExpenseRepo expenseRepo;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtils jwtUtils;
    private final AuthenticationManager authenticationManager;

    public AuthResponse register(RegisterRequest request) {
        if (userRepo.existsByEmail(request.getEmail())) {
            return AuthResponse.builder()
                    .success(false)
                    .message("Email is already registered")
                    .build();
        }

        User user = User.builder()
                .name(request.getName())
                .email(request.getEmail())
                .mobileNo(request.getMobileNo())
                .password(passwordEncoder.encode(request.getPassword()))
                .role("ROLE_USER")
                .build();

        User savedUser = userRepo.save(user);

        // Seed ₹50,000 welcome balance ONLY for the demo account
        if ("test@example.com".equals(request.getEmail())) {
            Expense initialDeposit = Expense.builder()
                    .title("Initial Welcoming Balance")
                    .amount(50000.0)
                    .category("CREDIT")
                    .transactionType("CREDIT")
                    .expenseDate(LocalDate.now())
                    .user(savedUser)
                    .build();
            expenseRepo.save(initialDeposit);
        }

        String token = jwtUtils.generateToken(savedUser);

        return AuthResponse.builder()
                .success(true)
                .token(token)
                .userId(savedUser.getUserId())
                .name(savedUser.getName())
                .email(savedUser.getEmail())
                .message("User registered successfully")
                .build();
    }

    public AuthResponse login(LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );

        User user = userRepo.findByEmail(request.getEmail())
                .orElseThrow(() -> new UsernameNotFoundException("User not found with email: " + request.getEmail()));

        String token = jwtUtils.generateToken(user);

        return AuthResponse.builder()
                .success(true)
                .token(token)
                .userId(user.getUserId())
                .name(user.getName())
                .email(user.getEmail())
                .message("Login successful")
                .build();
    }

    public AuthResponse changePassword(Long userId, com.example.first.Dto.ChangePasswordRequest request) {
        User user = userRepo.findById(userId)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with ID: " + userId));

        if (!passwordEncoder.matches(request.getOldPassword(), user.getPassword())) {
            return AuthResponse.builder()
                    .success(false)
                    .message("Incorrect old password")
                    .build();
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepo.save(user);

        return AuthResponse.builder()
                .success(true)
                .message("Password changed successfully")
                .build();
    }
}
