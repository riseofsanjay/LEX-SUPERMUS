package com.lexsupermus.student.dto.auth;

import java.util.Map;
import java.util.UUID;

public record AuthResponse(
        UUID id,
        String email,
        String role,
        String token,
        long expiresIn,
        String fullName,
        String phone,
        String city,
        String verificationStatus,
        Map<String, String> profile) {
}
