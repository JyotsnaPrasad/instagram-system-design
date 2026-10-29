package com.example.insta.follow;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.IdClass;
import jakarta.persistence.Table;
import java.time.Instant;
import org.springframework.data.domain.Persistable;

/** follower → followee. Always new when saved, so save() inserts instead of merging. */
@Entity
@Table(name = "follows")
@IdClass(FollowId.class)
class Follow implements Persistable<FollowId> {

    @Id
    private String followerId;
    @Id
    private String followeeId;
    private Instant createdAt;

    protected Follow() {
    }

    Follow(String followerId, String followeeId, Instant createdAt) {
        this.followerId = followerId;
        this.followeeId = followeeId;
        this.createdAt = createdAt;
    }

    String getFollowerId() {
        return followerId;
    }

    String getFolloweeId() {
        return followeeId;
    }

    @Override
    public FollowId getId() {
        return new FollowId(followerId, followeeId);
    }

    @Override
    public boolean isNew() {
        return true;
    }
}
