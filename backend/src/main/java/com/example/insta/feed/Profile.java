package com.example.insta.feed;

public record Profile(
        String id,
        String username,
        String displayName,
        String bio,
        long postCount,
        long followerCount,
        long followingCount,
        boolean followedByMe) {
}
