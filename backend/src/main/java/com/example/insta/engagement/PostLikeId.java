package com.example.insta.engagement;

import java.io.Serializable;
import java.util.Objects;

public class PostLikeId implements Serializable {

    private Long postId;
    private String userId;

    protected PostLikeId() {
    }

    public PostLikeId(Long postId, String userId) {
        this.postId = postId;
        this.userId = userId;
    }

    @Override
    public boolean equals(Object o) {
        return o instanceof PostLikeId other && postId.equals(other.postId) && userId.equals(other.userId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(postId, userId);
    }
}
