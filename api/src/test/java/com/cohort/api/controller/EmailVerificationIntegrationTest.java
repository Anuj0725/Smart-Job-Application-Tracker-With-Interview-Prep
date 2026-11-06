package com.cohort.api.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.is;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.reset;
import static org.mockito.Mockito.verify;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.cohort.api.AbstractIntegrationTest;
import com.cohort.api.service.mail.MailSender;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@AutoConfigureMockMvc
@Import(AbstractIntegrationTest.ContainerConfig.class)
@TestPropertySource(properties = "app.auth.email-verification-required=true")
class EmailVerificationIntegrationTest extends AbstractIntegrationTest {
    private static final Pattern TOKEN = Pattern.compile("token=([A-Za-z0-9_-]+)");

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private MailSender mailSender;

    @BeforeEach
    void clearMail() {
        reset(mailSender);
    }

    @Test
    void registrationWaitsForTheEmailLinkBeforeSigningIn() throws Exception {
        register("verify-me@example.com")
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.verification_required", is(true)))
                .andExpect(jsonPath("$.access_token").doesNotExist());
        String token = lastToken("verify-me@example.com");

        login("verify-me@example.com", "a-genuinely-fine-password")
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.error.code", is("EMAIL_NOT_VERIFIED")));

        confirm(token)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.access_token").isNotEmpty());

        login("verify-me@example.com", "a-genuinely-fine-password").andExpect(status().isOk());
    }

    @Test
    void aVerificationLinkWorksOnlyOnce() throws Exception {
        register("once@example.com").andExpect(status().isCreated());
        String token = lastToken("once@example.com");

        confirm(token).andExpect(status().isOk());
        confirm(token)
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error.code", is("INVALID_TOKEN")));
    }

    @Test
    void aMadeUpTokenIsRejected() throws Exception {
        confirm("not-a-real-token")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error.code", is("INVALID_TOKEN")));
    }

    @Test
    void passwordResetChangesThePasswordAndSignsOutOldSessions() throws Exception {
        register("forgot@example.com").andExpect(status().isCreated());
        confirm(lastToken("forgot@example.com")).andExpect(status().isOk());
        reset(mailSender);

        mockMvc.perform(post("/api/v1/auth/password-reset/request")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\": \"forgot@example.com\"}"))
                .andExpect(status().isAccepted());
        String token = lastToken("forgot@example.com");

        mockMvc.perform(post("/api/v1/auth/password-reset/confirm")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"token\": \"" + token + "\", \"new_password\": \"another-solid-passphrase-9\"}"))
                .andExpect(status().isNoContent());

        login("forgot@example.com", "a-genuinely-fine-password").andExpect(status().isUnauthorized());
        login("forgot@example.com", "another-solid-passphrase-9").andExpect(status().isOk());

        mockMvc.perform(post("/api/v1/auth/password-reset/confirm")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"token\": \"" + token + "\", \"new_password\": \"yet-another-passphrase-7\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error.code", is("INVALID_TOKEN")));
    }

    @Test
    void resetRequestForAnUnknownEmailSendsNothingAndLooksTheSame() throws Exception {
        mockMvc.perform(post("/api/v1/auth/password-reset/request")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\": \"nobody@example.com\"}"))
                .andExpect(status().isAccepted());

        verify(mailSender, never()).send(eq("nobody@example.com"), anyString(), anyString());
    }

    private org.springframework.test.web.servlet.ResultActions register(String email) throws Exception {
        return mockMvc.perform(post("/api/v1/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\": \"%s\", \"password\": \"a-genuinely-fine-password\", \"display_name\": \"Test User\"}"
                        .formatted(email)));
    }

    private org.springframework.test.web.servlet.ResultActions login(String email, String password) throws Exception {
        return mockMvc.perform(post("/api/v1/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\": \"%s\", \"password\": \"%s\"}".formatted(email, password)));
    }

    private org.springframework.test.web.servlet.ResultActions confirm(String token) throws Exception {
        return mockMvc.perform(post("/api/v1/auth/email-verification/confirm")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"token\": \"" + token + "\"}"));
    }

    private String lastToken(String email) {
        ArgumentCaptor<String> body = ArgumentCaptor.forClass(String.class);
        verify(mailSender, org.mockito.Mockito.atLeastOnce()).send(eq(email), anyString(), body.capture());
        Matcher matcher = TOKEN.matcher(body.getValue());
        assertThat(matcher.find()).as("the email contains a link with a token").isTrue();
        return matcher.group(1);
    }
}
