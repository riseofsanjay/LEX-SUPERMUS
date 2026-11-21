package com.lexsupermus.student.service.auth;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.lexsupermus.student.dto.auth.AuthResponse;
import com.lexsupermus.student.dto.auth.LoginRequest;
import com.lexsupermus.student.dto.auth.RegisterRequest;
import com.lexsupermus.student.model.ProfessionalAccount;
import com.lexsupermus.student.model.enums.ProfessionalVerificationStatus;
import com.lexsupermus.student.model.enums.UserRole;
import com.lexsupermus.student.repository.ProfessionalAccountRepository;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashMap;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@Service
public class ProfessionalAuthService {

    private static final Map<UserRole, Set<String>> REQUIRED_PROFILE_FIELDS = Map.of(
            UserRole.STUDENT,
            Set.of("lawSchool", "degree", "studyYear", "graduationYear", "legalInterests"),
            UserRole.ADVOCATE,
            Set.of("stateBarCouncil", "enrolmentNumber", "yearsExperience", "practiceAreas"),
            UserRole.LAW_FIRM,
            Set.of("firmName", "registrationNumber", "practiceAreas"));

    private final ProfessionalAccountRepository accounts;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenService tokens;
    private final ObjectMapper objectMapper;

    public ProfessionalAuthService(
            ProfessionalAccountRepository accounts,
            PasswordEncoder passwordEncoder,
            JwtTokenService tokens,
            ObjectMapper objectMapper) {
        this.accounts = accounts;
        this.passwordEncoder = passwordEncoder;
        this.tokens = tokens;
        this.objectMapper = objectMapper;
    }

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        String email = normalizeEmail(request.email());
        UserRole role = parseRole(request.role());
        String fullName = resolveFullName(request);
        Map<String, String> profile = normalizedProfile(request.profile());
        validateRequiredProfile(role, profile);

        if (accounts.existsByEmail(email)) {
            throw new AuthException(HttpStatus.CONFLICT, "An account with this email already exists.");
        }

        ProfessionalAccount account = new ProfessionalAccount();
        account.setEmail(email);
        account.setPasswordHash(passwordEncoder.encode(request.password()));
        account.setFullName(fullName);
        account.setPhone(request.phone().trim());
        account.setCity(request.city() == null ? "" : request.city().trim());
        account.setRole(role);
        account.setVerificationStatus(role == UserRole.ADVOCATE
                ? ProfessionalVerificationStatus.PENDING
                : ProfessionalVerificationStatus.NOT_REQUIRED);
        account.setProfileData(serializeProfile(profile));

        try {
            return createResponse(accounts.saveAndFlush(account));
        } catch (DataIntegrityViolationException exception) {
            throw new AuthException(
                    HttpStatus.CONFLICT, "An account with this email already exists.");
        }
    }

    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest request) {
        String email = normalizeEmail(request.email());
        ProfessionalAccount account = accounts.findByEmail(email)
                .orElseThrow(() -> invalidCredentials());

        if (!passwordEncoder.matches(request.password(), account.getPasswordHash())) {
            throw invalidCredentials();
        }

        if (request.role() != null && !request.role().isBlank()
                && !account.getRole().name().equalsIgnoreCase(request.role().trim())) {
            throw invalidCredentials();
        }
        return createResponse(account);
    }

    @Transactional(readOnly = true)
    public AuthResponse getAccount(UUID accountId) {
        ProfessionalAccount account = accounts.findById(accountId)
                .orElseThrow(() -> new AuthException(
                        HttpStatus.UNAUTHORIZED, "Account is no longer available."));
        return createResponse(account);
    }

    @Transactional
    public AuthResponse updateProfile(UUID accountId, Map<String, String> updates) {
        ProfessionalAccount account = accounts.findById(accountId)
                .orElseThrow(() -> new AuthException(
                        HttpStatus.UNAUTHORIZED, "Account is no longer available."));
        Map<String, String> profile = deserializeProfile(account.getProfileData());
        updates.forEach((key, value) -> {
            if (key != null && value != null) {
                profile.put(key, value.trim());
            }
        });
        account.setProfileData(serializeProfile(profile));
        return createResponse(accounts.save(account));
    }

    private AuthResponse createResponse(ProfessionalAccount account) {
        return new AuthResponse(
                account.getId(),
                account.getEmail(),
                account.getRole().name(),
                tokens.issue(account),
                tokens.getExpirationMillis(),
                account.getFullName(),
                account.getPhone(),
                account.getCity(),
                account.getVerificationStatus().name(),
                deserializeProfile(account.getProfileData()));
    }

    private String resolveFullName(RegisterRequest request) {
        if (request.fullName() != null && !request.fullName().isBlank()) {
            return request.fullName().trim();
        }
        String name = ((request.firstName() == null ? "" : request.firstName().trim()) + " "
                + (request.lastName() == null ? "" : request.lastName().trim())).trim();
        if (name.isBlank()) {
            throw new AuthException(HttpStatus.BAD_REQUEST, "Full name is required.");
        }
        return name;
    }

    private UserRole parseRole(String role) {
        if (role == null || role.isBlank()) {
            return UserRole.STUDENT;
        }
        try {
            UserRole parsed = UserRole.valueOf(role.trim().toUpperCase(Locale.ROOT));
            if (!REQUIRED_PROFILE_FIELDS.containsKey(parsed)) {
                throw new AuthException(HttpStatus.BAD_REQUEST, "Only student, advocate, and law firm accounts can register.");
            }
            return parsed;
        } catch (IllegalArgumentException exception) {
            throw new AuthException(HttpStatus.BAD_REQUEST, "Choose a valid professional role.");
        }
    }

    private void validateRequiredProfile(UserRole role, Map<String, String> profile) {
        Set<String> missing = REQUIRED_PROFILE_FIELDS.get(role).stream()
                .filter(key -> profile.get(key) == null || profile.get(key).isBlank())
                .collect(java.util.stream.Collectors.toSet());
        if (!missing.isEmpty()) {
            throw new AuthException(HttpStatus.BAD_REQUEST,
                    "Complete the required " + role.name().toLowerCase(Locale.ROOT) + " profile fields.");
        }
    }

    private Map<String, String> normalizedProfile(Map<String, String> profile) {
        Map<String, String> normalized = new LinkedHashMap<>();
        if (profile != null) {
            profile.forEach((key, value) -> {
                if (key != null && value != null) {
                    normalized.put(key, value.trim());
                }
            });
        }
        return normalized;
    }

    private Map<String, String> deserializeProfile(String profileData) {
        try {
            return objectMapper.readValue(profileData, new TypeReference<>() {});
        } catch (JsonProcessingException exception) {
            throw new IllegalStateException("Stored account profile is invalid.", exception);
        }
    }

    private String serializeProfile(Map<String, String> profile) {
        try {
            return objectMapper.writeValueAsString(profile);
        } catch (JsonProcessingException exception) {
            throw new IllegalStateException("Unable to serialize account profile.", exception);
        }
    }

    private String normalizeEmail(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }

    private AuthException invalidCredentials() {
        return new AuthException(HttpStatus.UNAUTHORIZED, "Invalid email, password, or account type.");
    }
}
