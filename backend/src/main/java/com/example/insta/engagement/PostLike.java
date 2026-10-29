package com.example.insta.engagement;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.IdClass;
import jakarta.persistence.Table;
import java.time.Instant;
import org.springframework.data.domain.Persistable;

/** One user's like of one post. Named PostLike because LIKE is a JPQL keyword. */
@Entity
@Table(name = "likes")
@IdClass(PostLikeId.class)
class PostLike implements Persistable<PostLikeId> {

    @Id
    private Long postId;
    @Id
    private String userId;
    private Instant createdAt;

    protected PostLike() {
    }

    PostLike(Long postId, String userId, Instant createdAt) {
        this.postId = postId;
        this.userId = userId;
        this.createdAt = createdAt;
    }

    @Override
    public PostLikeId getId() {
        return new PostLikeId(postId, userId);
    }

    /** Always new when saved, so save() inserts instead of merging. */
    @Override
    public boolean isNew() {
        return true;
    }
}
