package com.cohort.api.service;

import com.cohort.api.dto.ChangePasswordRequest;
import com.cohort.api.dto.UpdateProfileRequest;
import com.cohort.api.dto.UserProfileResponse;
import com.cohort.api.entity.User;
import com.cohort.api.exception.EmailAlreadyInUseException;
import com.cohort.api.exception.InvalidAccountRequestException;
import com.cohort.api.repository.RefreshTokenRepository;
import com.cohort.api.repository.UserRepository;
import com.cohort.api.security.PasswordPolicyValidator;
import java.time.Instant;
import java.util.UUID;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserService {
    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final PasswordPolicyValidator passwordPolicyValidator;

    public UserService(UserRepository userRepository, RefreshTokenRepository refreshTokenRepository,
                       PasswordEncoder passwordEncoder, PasswordPolicyValidator passwordPolicyValidator) {
        this.userRepository = userRepository;
        this.refreshTokenRepository = refreshTokenRepository;
        this.passwordEncoder = passwordEncoder;
        this.passwordPolicyValidator = passwordPolicyValidator;
    }

    @Transactional(readOnly = true)
    public UserProfileResponse getProfile(UUID userId) {
        return UserProfileResponse.from(requireUser(userId));
    }

    @Transactional
    public UserProfileResponse updateProfile(UUID userId, UpdateProfileRequest request) {
        User user = requireUser(userId);

        if (request.email() != null && !request.email().equalsIgnoreCase(user.getEmail())) {
            if (userRepository.existsByEmail(request.email())) {
                throw new EmailAlreadyInUseException();
            }
            user.setEmail(request.email());
        }
        if (request.displayName() != null) {
            user.setDisplayName(request.displayName());
        }
        if (request.targetRole() != null) {
            user.setTargetRole(request.targetRole());
        }
        if (request.graduationYear() != null) {
            user.setGraduationYear(request.graduationYear());
        }
        if (request.timezone() != null) {
            user.setTimezone(request.timezone());
        }

        return UserProfileResponse.from(user);
    }

    /** Checks the current password, applies the password policy, and signs the user out everywhere else. */
    @Transactional
    public void changePassword(UUID userId, ChangePasswordRequest request) {
        User user = requireUser(userId);
        if (!passwordEncoder.matches(request.currentPassword(), user.getPasswordHash())) {
            throw new InvalidAccountRequestException("current_password", "The current password is incorrect.");
        }
        passwordPolicyValidator.validate(request.newPassword());
        user.setPasswordHash(passwordEncoder.encode(request.newPassword()));
        refreshTokenRepository.revokeAllForUser(userId, Instant.now());
    }

    private User requireUser(UUID userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new IllegalStateException("Authenticated user " + userId + " no longer exists"));
    }
}
