package com.example.insta.feed;

import com.example.insta.common.api.PostView;
import com.example.insta.user.ActingUser;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
class FeedController {

    private final FeedService feedService;

    FeedController(FeedService feedService) {
        this.feedService = feedService;
    }

    @GetMapping("/feed")
    List<PostView> feed(@ActingUser String me) {
        return feedService.feed(me);
    }

    @GetMapping("/users/{username}")
    Profile profile(@ActingUser String me, @PathVariable String username) {
        return feedService.profile(username, me);
    }

    @GetMapping("/users/{username}/posts")
    List<PostView> postsByUser(@ActingUser String me, @PathVariable String username) {
        return feedService.postsByUser(username, me);
    }

    @GetMapping("/posts/{postId}")
    PostView postDetail(@ActingUser String me, @PathVariable long postId) {
        return feedService.postDetail(postId, me);
    }
}
