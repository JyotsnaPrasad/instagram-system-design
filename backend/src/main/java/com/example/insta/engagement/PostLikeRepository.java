package com.example.insta.engagement;

import java.util.Collection;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.transaction.annotation.Transactional;

interface PostLikeRepository extends JpaRepository<PostLike, PostLikeId> {

    long countByPostId(Long postId);

    @Query("select new com.example.insta.engagement.PostCount(l.postId, count(l)) "
            + "from PostLike l where l.postId in :postIds group by l.postId")
    List<PostCount> countByPostIds(Collection<Long> postIds);

    @Query("select l.postId from PostLike l where l.userId = :userId and l.postId in :postIds")
    List<Long> findPostIdsLikedBy(String userId, Collection<Long> postIds);

    @Transactional
    @Modifying
    @Query("delete from PostLike l where l.postId = :postId and l.userId = :userId")
    int deleteLike(Long postId, String userId);
}
