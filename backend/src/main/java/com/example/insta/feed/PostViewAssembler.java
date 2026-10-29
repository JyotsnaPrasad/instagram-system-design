package com.example.insta.feed;

import com.example.insta.common.api.CommentView;
import com.example.insta.common.api.PostView;
import com.example.insta.common.api.UserSummary;
import com.example.insta.engagement.EngagementService;
import com.example.insta.engagement.PostStats;
import com.example.insta.post.Post;
import com.example.insta.user.UserService;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.springframework.stereotype.Component;

/** Combines posts with their authors and engagement using a fixed number of batch queries. */
@Component
class PostViewAssembler {

    static final int PREVIEW_COMMENTS = 2;

    private final UserService userService;
    private final EngagementService engagementService;

    PostViewAssembler(UserService userService, EngagementService engagementService) {
        this.userService = userService;
        this.engagementService = engagementService;
    }

    /** Views with the {@value #PREVIEW_COMMENTS} most recent comments each; keeps the order of {@code posts}. */
    List<PostView> withPreviewComments(List<Post> posts, String actingUserId) {
        List<Long> postIds = posts.stream().map(Post::getId).toList();
        Map<Long, List<CommentView>> comments = engagementService.recentComments(postIds, PREVIEW_COMMENTS);
        return assemble(posts, actingUserId, comments::get);
    }

    /** A single view with every comment, for the post detail page. */
    PostView withAllComments(Post post, String actingUserId) {
        List<CommentView> comments = engagementService.allComments(post.getId());
        return assemble(List.of(post), actingUserId, id -> comments).get(0);
    }

    private List<PostView> assemble(List<Post> posts, String actingUserId,
                                    Function<Long, List<CommentView>> commentsFor) {
        if (posts.isEmpty()) {
            return List.of();
        }
        List<Long> postIds = posts.stream().map(Post::getId).toList();
        Map<Long, PostStats> stats = engagementService.statsFor(postIds, actingUserId);
        Map<String, UserSummary> authors = userService.summariesById(
                posts.stream().map(Post::getAuthorId).collect(Collectors.toSet()));
        return posts.stream().map(p -> {
            PostStats s = stats.getOrDefault(p.getId(), PostStats.EMPTY);
            List<CommentView> comments = commentsFor.apply(p.getId());
            return new PostView(p.getId(), authors.get(p.getAuthorId()), p.getText(), p.getCreatedAt(),
                    s.likeCount(), s.likedByMe(), s.commentCount(), comments == null ? List.of() : comments);
        }).toList();
    }
}
