package com.example.insta.engagement;

public record LikeState(long postId, boolean likedByMe, long likeCount) {
}
