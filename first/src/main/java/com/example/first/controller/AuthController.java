package com.example.first.controller;

import com.example.first.Dto.AuthResponse;
import com.example.first.Dto.LoginRequest;
import com.example.first.Dto.RegisterRequest;
import com.example.first.Dto.ChangePasswordRequest;
import com.example.first.entity.User;
import com.example.first.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        AuthResponse response = authService.register(request);
        if (response.isSuccess()) {
            return ResponseEntity.ok(response);
        }
        return ResponseEntity.badRequest().body(response);
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@RequestBody LoginRequest request) {
        try {
            AuthResponse response = authService.login(request);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(401).body(AuthResponse.builder()
                    .success(false)
                    .message("Authentication failed: " + e.getMessage())
                    .build());
        }
    }

    @PostMapping("/change-password")
    public ResponseEntity<AuthResponse> changePassword(
            @AuthenticationPrincipal User user,
            @Valid @RequestBody ChangePasswordRequest request) {
        if (user == null) {
            return ResponseEntity.status(401).body(AuthResponse.builder()
                    .success(false)
                    .message("User not authenticated")
                    .build());
        }
        AuthResponse response = authService.changePassword(user.getUserId(), request);
        if (response.isSuccess()) {
            return ResponseEntity.ok(response);
        }
        return ResponseEntity.badRequest().body(response);
    }
}
