package com.cohort.api.service;

import com.cohort.api.entity.AuthToken;
import com.cohort.api.entity.AuthToken.Purpose;
import com.cohort.api.entity.User;
import com.cohort.api.exception.InvalidAuthTokenException;
import com.cohort.api.repository.AuthTokenRepository;
import com.cohort.api.repository.RefreshTokenRepository;
import com.cohort.api.repository.UserRepository;
import com.cohort.api.security.PasswordPolicyValidator;
import com.cohort.api.service.mail.MailSender;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;
import java.util.HexFormat;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Emailed single-use links for confirming an address and for resetting a password.
 * Only the SHA-256 hash of a token is stored, so a database read never gives anyone a usable link.
 */
@Service
public class AccountRecoveryService {
    private final UserRepository userRepository;
    private final AuthTokenRepository authTokenRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final PasswordPolicyValidator passwordPolicyValidator;
    private final MailSender mailSender;
    private final String frontendBaseUrl;
    private final Duration resetTtl;
    private final Duration verificationTtl;
    private final SecureRandom secureRandom = new SecureRandom();

    public AccountRecoveryService(
            UserRepository userRepository,
            AuthTokenRepository authTokenRepository,
            RefreshTokenRepository refreshTokenRepository,
            PasswordEncoder passwordEncoder,
            PasswordPolicyValidator passwordPolicyValidator,
            MailSender mailSender,
            @Value("${app.frontend-base-url}") String frontendBaseUrl,
            @Value("${app.auth.reset-token-ttl-minutes}") long resetTtlMinutes,
            @Value("${app.auth.verification-token-ttl-hours}") long verificationTtlHours) {
        this.userRepository = userRepository;
        this.authTokenRepository = authTokenRepository;
        this.refreshTokenRepository = refreshTokenRepository;
        this.passwordEncoder = passwordEncoder;
        this.passwordPolicyValidator = passwordPolicyValidator;
        this.mailSender = mailSender;
        this.frontendBaseUrl = frontendBaseUrl;
        this.resetTtl = Duration.ofMinutes(resetTtlMinutes);
        this.verificationTtl = Duration.ofHours(verificationTtlHours);
    }

    // Silent for unknown emails so the response never reveals whether an account exists.
    @Transactional
    public void requestPasswordReset(String email) {
        userRepository.findByEmail(email).ifPresent(user -> sendLink(user, Purpose.password_reset));
    }

    @Transactional(noRollbackFor = InvalidAuthTokenException.class)
    public void confirmPasswordReset(String token, String newPassword) {
        passwordPolicyValidator.validate(newPassword);
        User user = consume(token, Purpose.password_reset);
        user.setPasswordHash(passwordEncoder.encode(newPassword));
        // Getting the link in the inbox proves the user owns the address.
        if (!user.isEmailVerified()) {
            user.markEmailVerified();
        }
        userRepository.save(user);
        refreshTokenRepository.revokeAllForUser(user.getId(), Instant.now());
    }

    @Transactional
    public void sendVerification(User user) {
        sendLink(user, Purpose.email_verification);
    }

    @Transactional
    public void requestVerification(String email) {
        userRepository.findByEmail(email)
                .filter(user -> !user.isEmailVerified())
                .ifPresent(this::sendVerification);
    }

    @Transactional(noRollbackFor = InvalidAuthTokenException.class)
    public User confirmVerification(String token) {
        User user = consume(token, Purpose.email_verification);
        user.markEmailVerified();
        return userRepository.save(user);
    }

    private void sendLink(User user, Purpose purpose) {
        Instant now = Instant.now();
        authTokenRepository.invalidateOutstanding(user.getId(), purpose, now);
        byte[] raw = new byte[32];
        secureRandom.nextBytes(raw);
        String token = Base64.getUrlEncoder().withoutPadding().encodeToString(raw);
        Duration ttl = purpose == Purpose.password_reset ? resetTtl : verificationTtl;
        authTokenRepository.save(new AuthToken(user, purpose, sha256(token), now.plus(ttl)));

        String path = purpose == Purpose.password_reset ? "/reset-password" : "/verify-email";
        String link = frontendBaseUrl + path + "?token=" + token;
        mailSender.send(user.getEmail(), subject(purpose), body(purpose, link));
    }

    private User consume(String token, Purpose purpose) {
        AuthToken stored = authTokenRepository.findByTokenHash(sha256(token == null ? "" : token))
                .filter(candidate -> candidate.getPurpose() == purpose)
                .filter(candidate -> candidate.isUsable(Instant.now()))
                .orElseThrow(InvalidAuthTokenException::new);
        stored.markUsed(Instant.now());
        authTokenRepository.save(stored);
        return stored.getUser();
    }

    private static String subject(Purpose purpose) {
        return purpose == Purpose.password_reset ? "Reset your Cohort password" : "Confirm your Cohort email";
    }

    private String body(Purpose purpose, String link) {
        boolean reset = purpose == Purpose.password_reset;
        return """
                Use this link to %s:

                %s

                It works once and expires in %s. If you did not ask for it, you can ignore this email.

                Cohort""".formatted(reset ? "reset your password" : "confirm your email", link,
                reset ? resetTtl.toMinutes() + " minutes" : verificationTtl.toHours() + " hours");
    }

    private static String sha256(String value) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            return HexFormat.of().formatHex(digest.digest(value.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 must be available on any JVM", e);
        }
    }
}
