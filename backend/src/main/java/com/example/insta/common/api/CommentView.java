package com.example.insta.common.api;

import java.time.Instant;

public record CommentView(long id, long postId, UserSummary author, String text, Instant createdAt) {
}
