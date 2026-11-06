package com.cohort.api.exception;

public class InvalidAuthTokenException extends RuntimeException {
    public InvalidAuthTokenException() {
        super("That link is invalid or has expired.");
    }
}
