package com.example.insta.follow;

/** Result of follow/unfollow. Counts are the target user's. */
public record FollowState(boolean followedByMe, long followerCount, long followingCount) {
}
