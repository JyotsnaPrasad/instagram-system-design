package com.example.insta.common;

import com.fasterxml.jackson.annotation.JsonInclude;

/** The single error body returned by every endpoint. {@code field} is omitted when not applicable. */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record ApiError(int status, String code, String message, String field) {
}
