package com.example.insta.user;

import com.example.insta.common.ApiException;
import com.example.insta.common.api.UserSummary;
import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class UserService {

    private final UserRepository users;

    UserService(UserRepository users) {
        this.users = users;
    }

    public List<UserSummary> listSummaries() {
        return users.findAll(Sort.by("id")).stream().map(User::toSummary).toList();
    }

    /** @throws ApiException 404 if no user has this username */
    public User requireByUsername(String username) {
        return users.findByUsername(username)
                .orElseThrow(() -> ApiException.notFound("User '" + username + "' not found."));
    }

    public boolean exists(String userId) {
        return users.existsById(userId);
    }

    public Map<String, UserSummary> summariesById(Collection<String> userIds) {
        return users.findAllById(userIds).stream()
                .map(User::toSummary)
                .collect(Collectors.toMap(UserSummary::id, Function.identity()));
    }

    public List<UserSummary> summariesSortedByUsername(Collection<String> userIds) {
        return users.findAllById(userIds).stream()
                .map(User::toSummary)
                .sorted((a, b) -> a.username().compareTo(b.username()))
                .toList();
    }

    public UserSummary summary(String userId) {
        return users.findById(userId)
                .map(User::toSummary)
                .orElseThrow(() -> ApiException.notFound("User '" + userId + "' not found."));
    }
}
