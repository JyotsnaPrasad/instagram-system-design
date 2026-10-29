package com.example.insta.user;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Binds a {@code String} controller parameter to the acting user's id, taken from the
 * {@value ActingUserArgumentResolver#HEADER} header. Missing or unknown ids are rejected with 400.
 * This stands in for authentication, which is out of scope.
 */
@Target(ElementType.PARAMETER)
@Retention(RetentionPolicy.RUNTIME)
public @interface ActingUser {
}
