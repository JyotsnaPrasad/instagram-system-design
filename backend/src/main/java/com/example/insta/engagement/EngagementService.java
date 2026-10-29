package com.example.insta.engagement;

import com.example.insta.common.TextRules;
import com.example.insta.common.TimeConfig;
import com.example.insta.common.api.CommentView;
import com.example.insta.common.api.UserSummary;
import com.example.insta.post.PostService;
import com.example.insta.user.UserService;
import java.time.Clock;
import java.util.Collection;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class EngagementService {

    private static final Comparator<Comment> OLDEST_FIRST =
            Comparator.comparing(Comment::getCreatedAt).thenComparing(Comment::getId);

    private final PostLikeRepository likes;
    private final CommentRepository comments;
    private final PostService postService;
    private final UserService userService;
    private final Clock clock;

    EngagementService(PostLikeRepository likes, CommentRepository comments, PostService postService,
                      UserService userService, Clock clock) {
        this.likes = likes;
        this.comments = comments;
        this.postService = postService;
        this.userService = userService;
        this.clock = clock;
    }

    /** Idempotent: liking an already-liked post changes nothing. */
    public LikeState like(String actingUserId, long postId) {
        postService.requireById(postId);
        PostLikeId id = new PostLikeId(postId, actingUserId);
        if (!likes.existsById(id)) {
            try {
                likes.saveAndFlush(new PostLike(postId, actingUserId, TimeConfig.now(clock)));
            } catch (DataIntegrityViolationException e) {
                // A concurrent identical request won the race; anything else is a real error.
                if (!likes.existsById(id)) {
                    throw e;
                }
            }
        }
        return likeState(actingUserId, postId);
    }

    /** Idempotent: unliking a post that is not liked changes nothing. */
    public LikeState unlike(String actingUserId, long postId) {
        postService.requireById(postId);
        likes.deleteLike(postId, actingUserId);
        return likeState(actingUserId, postId);
    }

    @Transactional
    public CommentView addComment(String actingUserId, long postId, String rawText) {
        postService.requireById(postId);
        String text = TextRules.requireValid(rawText, TextRules.MAX_COMMENT_LENGTH, "Comment");
        Comment comment = comments.save(new Comment(postId, actingUserId, text, TimeConfig.now(clock)));
        return toView(comment, userService.summary(actingUserId));
    }

    /** Like count, comment count and the acting user's like state for each post, in three queries. */
    @Transactional(readOnly = true)
    public Map<Long, PostStats> statsFor(Collection<Long> postIds, String actingUserId) {
        if (postIds.isEmpty()) {
            return Map.of();
        }
        Map<Long, Long> likeCounts = toMap(likes.countByPostIds(postIds));
        Map<Long, Long> commentCounts = toMap(comments.countByPostIds(postIds));
        Set<Long> liked = new HashSet<>(likes.findPostIdsLikedBy(actingUserId, postIds));
        return postIds.stream().distinct().collect(Collectors.toMap(id -> id, id -> new PostStats(
                likeCounts.getOrDefault(id, 0L), commentCounts.getOrDefault(id, 0L), liked.contains(id))));
    }

    /** Up to {@code limit} most recent comments per post, each list ordered oldest first. */
    @Transactional(readOnly = true)
    public Map<Long, List<CommentView>> recentComments(Collection<Long> postIds, int limit) {
        if (postIds.isEmpty()) {
            return Map.of();
        }
        return toViewsByPost(comments.findRecentByPostIds(postIds, limit));
    }

    /** Every comment on the post, oldest first. */
    @Transactional(readOnly = true)
    public List<CommentView> allComments(long postId) {
        return toViewsByPost(comments.findByPostIdOrderByCreatedAtAscIdAsc(postId))
                .getOrDefault(postId, List.of());
    }

    private LikeState likeState(String actingUserId, long postId) {
        return new LikeState(postId, likes.existsById(new PostLikeId(postId, actingUserId)), likes.countByPostId(postId));
    }

    private Map<Long, List<CommentView>> toViewsByPost(List<Comment> found) {
        Map<String, UserSummary> authors = userService.summariesById(
                found.stream().map(Comment::getAuthorId).collect(Collectors.toSet()));
        return found.stream()
                .sorted(OLDEST_FIRST)
                .collect(Collectors.groupingBy(Comment::getPostId,
                        Collectors.mapping(c -> toView(c, authors.get(c.getAuthorId())), Collectors.toList())));
    }

    private static CommentView toView(Comment c, UserSummary author) {
        return new CommentView(c.getId(), c.getPostId(), author, c.getText(), c.getCreatedAt());
    }

    private static Map<Long, Long> toMap(List<PostCount> counts) {
        return counts.stream().collect(Collectors.toMap(PostCount::postId, PostCount::count));
    }
}
