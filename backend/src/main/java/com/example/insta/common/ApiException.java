package com.example.insta.common;

import org.springframework.http.HttpStatus;

/** A failure that maps directly to an {@link ApiError} response. */
public class ApiException extends RuntimeException {

    public static final String VALIDATION_ERROR = "VALIDATION_ERROR";
    public static final String INVALID_ACTING_USER = "INVALID_ACTING_USER";
    public static final String NOT_FOUND = "NOT_FOUND";

    private final HttpStatus status;
    private final String code;
    private final String field;

    public ApiException(HttpStatus status, String code, String message, String field) {
        super(message);
        this.status = status;
        this.code = code;
        this.field = field;
    }

    public static ApiException validation(String message, String field) {
        return new ApiException(HttpStatus.BAD_REQUEST, VALIDATION_ERROR, message, field);
    }

    public static ApiException invalidActingUser(String message) {
        return new ApiException(HttpStatus.BAD_REQUEST, INVALID_ACTING_USER, message, null);
    }

    public static ApiException notFound(String message) {
        return new ApiException(HttpStatus.NOT_FOUND, NOT_FOUND, message, null);
    }

    public HttpStatus getStatus() {
        return status;
    }

    public String getCode() {
        return code;
    }

    public String getField() {
        return field;
    }

    public ApiError toApiError() {
        return new ApiError(status.value(), code, getMessage(), field);
    }
}
