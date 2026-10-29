package com.example.insta.engagement;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;

@Entity
@Table(name = "comments")
class Comment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private Long postId;
    private String authorId;
    private String text;
    private Instant createdAt;

    protected Comment() {
    }

    Comment(Long postId, String authorId, String text, Instant createdAt) {
        this.postId = postId;
        this.authorId = authorId;
        this.text = text;
        this.createdAt = createdAt;
    }

    Long getId() {
        return id;
    }

    Long getPostId() {
        return postId;
    }

    String getAuthorId() {
        return authorId;
    }

    String getText() {
        return text;
    }

    Instant getCreatedAt() {
        return createdAt;
    }
}
