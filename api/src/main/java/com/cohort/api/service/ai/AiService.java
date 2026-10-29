package com.cohort.api.service.ai;

import com.cohort.api.exception.AiUnavailableException;
import java.util.UUID;
import java.util.function.Consumer;
import org.springframework.stereotype.Service;

@Service
public class AiService {
    private final AiProvider provider;
    private final AiRateLimiter rateLimiter;

    public AiService(AiProvider provider, AiRateLimiter rateLimiter) {
        this.provider = provider;
        this.rateLimiter = rateLimiter;
    }

    public AiStatus status() {
        return new AiStatus(provider.id(), provider.hosted());
    }

    public String complete(UUID userId, String feature, AiPrompt prompt) {
        rateLimiter.acquire(userId);
        return provider.complete(prompt);
    }

    public void stream(UUID userId, String feature, AiPrompt prompt, Consumer<String> onToken) {
        rateLimiter.acquire(userId);
        provider.stream(prompt, onToken);
    }
}
