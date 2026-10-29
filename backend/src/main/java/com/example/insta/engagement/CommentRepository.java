package com.example.insta.engagement;

import java.util.Collection;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

interface CommentRepository extends JpaRepository<Comment, Long> {

    List<Comment> findByPostIdOrderByCreatedAtAscIdAsc(Long postId);

    @Query("select new com.example.insta.engagement.PostCount(c.postId, count(c)) "
            + "from Comment c where c.postId in :postIds group by c.postId")
    List<PostCount> countByPostIds(Collection<Long> postIds);

    /** The {@code limit} most recent comments of each post, in one query. */
    @Query(nativeQuery = true, value = """
            SELECT id, post_id, author_id, text, created_at FROM (
              SELECT c.*, ROW_NUMBER() OVER (PARTITION BY c.post_id ORDER BY c.created_at DESC, c.id DESC) AS rn
              FROM comments c WHERE c.post_id IN (:postIds)
            ) ranked WHERE rn <= :limit
            """)
    List<Comment> findRecentByPostIds(Collection<Long> postIds, int limit);
}
