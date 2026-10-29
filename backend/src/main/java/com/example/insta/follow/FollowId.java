package com.example.insta.follow;

import java.io.Serializable;
import java.util.Objects;

public class FollowId implements Serializable {

    private String followerId;
    private String followeeId;

    protected FollowId() {
    }

    public FollowId(String followerId, String followeeId) {
        this.followerId = followerId;
        this.followeeId = followeeId;
    }

    @Override
    public boolean equals(Object o) {
        return o instanceof FollowId other
                && followerId.equals(other.followerId)
                && followeeId.equals(other.followeeId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(followerId, followeeId);
    }
}
