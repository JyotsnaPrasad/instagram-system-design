package com.example.insta.feed;

import com.example.insta.common.api.PostView;
import com.example.insta.follow.FollowService;
import com.example.insta.post.PostService;
import com.example.insta.user.User;
import com.example.insta.user.UserService;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import org.springframework.stereotype.Service;

/** Read side: the feed, a user's posts, post detail and profiles. Writes nothing. */
@Service
public class FeedService {

    private final UserService userService;
    private final FollowService followService;
    private final PostService postService;
    private final PostViewAssembler assembler;

    FeedService(UserService userService, FollowService followService, PostService postService,
                PostViewAssembler assembler) {
        this.userService = userService;
        this.followService = followService;
        this.postService = postService;
        this.assembler = assembler;
    }

    /**
     * Posts by the acting user and everyone they currently follow, newest first, ties by id
     * descending (FR-5.1, FR-5.2). Follows are read now, so a new follow includes that user's
     * older posts and an unfollow removes them (FR-5.4).
     */
    public List<PostView> feed(String actingUserId) {
        Set<String> authorIds = new LinkedHashSet<>();
        authorIds.add(actingUserId);
        authorIds.addAll(followService.followeeIds(actingUserId));
        return assembler.withPreviewComments(postService.findByAuthors(authorIds), actingUserId);
    }

    public List<PostView> postsByUser(String username, String actingUserId) {
        User user = userService.requireByUsername(username);
        return assembler.withPreviewComments(postService.findByAuthors(List.of(user.getId())), actingUserId);
    }

    public PostView postDetail(long postId, String actingUserId) {
        return assembler.withAllComments(postService.requireById(postId), actingUserId);
    }

    public Profile profile(String username, String actingUserId) {
        User user = userService.requireByUsername(username);
        String id = user.getId();
        return new Profile(id, user.getUsername(), user.getDisplayName(), user.getBio(),
                postService.countByAuthor(id),
                followService.followerCount(id),
                followService.followingCount(id),
                !id.equals(actingUserId) && followService.isFollowing(actingUserId, id));
    }
}
