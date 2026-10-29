package com.example.insta.post;

import java.util.Collection;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

interface PostRepository extends JpaRepository<Post, Long> {

    /** Chronological order with a stable tie-break on id (FR-5.2). */
    List<Post> findByAuthorIdInOrderByCreatedAtDescIdDesc(Collection<String> authorIds);

    long countByAuthorId(String authorId);
}
