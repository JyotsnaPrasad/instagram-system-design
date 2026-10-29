package com.example.insta.user;

import com.example.insta.common.ApiException;
import org.springframework.core.MethodParameter;
import org.springframework.stereotype.Component;
import org.springframework.web.bind.support.WebDataBinderFactory;
import org.springframework.web.context.request.NativeWebRequest;
import org.springframework.web.method.support.HandlerMethodArgumentResolver;
import org.springframework.web.method.support.ModelAndViewContainer;

@Component
class ActingUserArgumentResolver implements HandlerMethodArgumentResolver {

    static final String HEADER = "X-Acting-User";

    private final UserService userService;

    ActingUserArgumentResolver(UserService userService) {
        this.userService = userService;
    }

    @Override
    public boolean supportsParameter(MethodParameter parameter) {
        return parameter.hasParameterAnnotation(ActingUser.class)
                && parameter.getParameterType().equals(String.class);
    }

    @Override
    public String resolveArgument(MethodParameter parameter, ModelAndViewContainer mavContainer,
                                  NativeWebRequest webRequest, WebDataBinderFactory binderFactory) {
        String userId = webRequest.getHeader(HEADER);
        if (userId == null || userId.isBlank()) {
            throw ApiException.invalidActingUser("Missing " + HEADER + " header.");
        }
        if (!userService.exists(userId)) {
            throw ApiException.invalidActingUser("Unknown acting user '" + userId + "'.");
        }
        return userId;
    }
}
