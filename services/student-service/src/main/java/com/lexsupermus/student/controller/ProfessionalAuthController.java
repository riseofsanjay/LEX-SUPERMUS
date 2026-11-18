package com.lexsupermus.student.controller;

import com.lexsupermus.student.dto.auth.ApiResponse;
import com.lexsupermus.student.dto.auth.AuthResponse;
import com.lexsupermus.student.dto.auth.LoginRequest;
import com.lexsupermus.student.dto.auth.RegisterRequest;
import com.lexsupermus.student.service.auth.JwtTokenService;
import com.lexsupermus.student.service.auth.ProfessionalAuthService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/auth")
public class ProfessionalAuthController {

    private final ProfessionalAuthService authService;

    public ProfessionalAuthController(ProfessionalAuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        return new ApiResponse<>(true, authService.register(request), "Registration successful");
    }

    @PostMapping("/login")
    public ApiResponse<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        return new ApiResponse<>(true, authService.login(request), "Login successful");
    }

    @GetMapping("/me")
    public ApiResponse<AuthResponse> currentAccount(Authentication authentication) {
        UUID accountId = UUID.fromString(authentication.getName());
        return new ApiResponse<>(
                true, authService.getAccount(accountId), "Account profile loaded");
    }

    @PatchMapping("/me/profile")
    public ApiResponse<AuthResponse> updateProfile(
            Authentication authentication,
            @RequestBody Map<String, String> updates) {
        UUID accountId = UUID.fromString(authentication.getName());
        return new ApiResponse<>(
                true, authService.updateProfile(accountId, updates), "Profile updated");
    }
}
