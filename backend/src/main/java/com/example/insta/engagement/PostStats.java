package com.example.insta.engagement;

/** Engagement numbers for one post, from the acting user's point of view. */
public record PostStats(long likeCount, long commentCount, boolean likedByMe) {

    public static final PostStats EMPTY = new PostStats(0, 0, false);
}
