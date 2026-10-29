package com.example.insta.follow;

import com.example.insta.common.ApiException;
import com.example.insta.common.TimeConfig;
import com.example.insta.common.api.UserSummary;
import com.example.insta.user.User;
import com.example.insta.user.UserService;
import java.time.Clock;
import java.util.List;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;

@Service
public class FollowService {

    private final FollowRepository follows;
    private final UserService userService;
    private final Clock clock;

    FollowService(FollowRepository follows, UserService userService, Clock clock) {
        this.follows = follows;
        this.userService = userService;
        this.clock = clock;
    }

    /** Idempotent: following someone already followed changes nothing. */
    public FollowState follow(String actingUserId, String targetUsername) {
        User target = requireOtherUser(actingUserId, targetUsername, "follow");
        FollowId id = new FollowId(actingUserId, target.getId());
        if (!follows.existsById(id)) {
            try {
                follows.saveAndFlush(new Follow(actingUserId, target.getId(), TimeConfig.now(clock)));
            } catch (DataIntegrityViolationException e) {
                // A concurrent identical request won the race; anything else is a real error.
                if (!follows.existsById(id)) {
                    throw e;
                }
            }
        }
        return state(actingUserId, target.getId());
    }

    /** Idempotent: unfollowing someone not followed changes nothing. */
    public FollowState unfollow(String actingUserId, String targetUsername) {
        User target = requireOtherUser(actingUserId, targetUsername, "unfollow");
        follows.deleteFollow(actingUserId, target.getId());
        return state(actingUserId, target.getId());
    }

    public List<String> followeeIds(String userId) {
        return follows.findByFollowerId(userId).stream().map(Follow::getFolloweeId).toList();
    }

    public List<UserSummary> followers(String username) {
        User user = userService.requireByUsername(username);
        return userService.summariesSortedByUsername(
                follows.findByFolloweeId(user.getId()).stream().map(Follow::getFollowerId).toList());
    }

    public List<UserSummary> following(String username) {
        User user = userService.requireByUsername(username);
        return userService.summariesSortedByUsername(followeeIds(user.getId()));
    }

    public boolean isFollowing(String followerId, String followeeId) {
        return follows.existsById(new FollowId(followerId, followeeId));
    }

    public long followerCount(String userId) {
        return follows.countByFolloweeId(userId);
    }

    public long followingCount(String userId) {
        return follows.countByFollowerId(userId);
    }

    private User requireOtherUser(String actingUserId, String targetUsername, String verb) {
        User target = userService.requireByUsername(targetUsername);
        if (target.getId().equals(actingUserId)) {
            throw ApiException.validation("You cannot " + verb + " yourself.", "username");
        }
        return target;
    }

    private FollowState state(String actingUserId, String targetId) {
        return new FollowState(isFollowing(actingUserId, targetId), followerCount(targetId), followingCount(targetId));
    }
}
