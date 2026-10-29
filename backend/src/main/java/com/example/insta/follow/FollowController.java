package com.example.insta.follow;

import com.example.insta.common.api.UserSummary;
import com.example.insta.user.ActingUser;
import java.util.List;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/users/{username}")
class FollowController {

    private final FollowService followService;

    FollowController(FollowService followService) {
        this.followService = followService;
    }

    @GetMapping("/followers")
    List<UserSummary> followers(@ActingUser String me, @PathVariable String username) {
        return followService.followers(username);
    }

    @GetMapping("/following")
    List<UserSummary> following(@ActingUser String me, @PathVariable String username) {
        return followService.following(username);
    }

    @PutMapping("/follow")
    FollowState follow(@ActingUser String me, @PathVariable String username) {
        return followService.follow(me, username);
    }

    @DeleteMapping("/follow")
    FollowState unfollow(@ActingUser String me, @PathVariable String username) {
        return followService.unfollow(me, username);
    }
}
