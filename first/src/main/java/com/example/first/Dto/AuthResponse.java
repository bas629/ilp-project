package com.example.first.Dto;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuthResponse {
    private boolean success;
    private String token;
    private Long userId;
    private String name;
    private String email;
    private String message;
}
