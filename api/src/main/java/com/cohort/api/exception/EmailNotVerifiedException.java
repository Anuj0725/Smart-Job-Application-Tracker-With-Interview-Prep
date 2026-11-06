package com.cohort.api.exception;

public class EmailNotVerifiedException extends RuntimeException {
    public EmailNotVerifiedException() {
        super("Confirm your email first. Use the link we sent you, or ask for a new one.");
    }
}
