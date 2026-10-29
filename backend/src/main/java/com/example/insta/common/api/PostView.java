package com.example.insta.common.api;

import java.time.Instant;
import java.util.List;

/**
 * A post as shown to the acting user. In feed and profile lists {@code comments} holds the
 * most recent comments (oldest first); on the post detail it holds all of them.
 */
public record PostView(
        long id,
        UserSummary author,
        String text,
        Instant createdAt,
        long likeCount,
        boolean likedByMe,
        long commentCount,
        List<CommentView> comments) {
}
