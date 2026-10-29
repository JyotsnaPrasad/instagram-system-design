package com.example.insta.follow;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.transaction.annotation.Transactional;

interface FollowRepository extends JpaRepository<Follow, FollowId> {

    List<Follow> findByFollowerId(String followerId);

    List<Follow> findByFolloweeId(String followeeId);

    long countByFollowerId(String followerId);

    long countByFolloweeId(String followeeId);

    @Transactional
    @Modifying
    @Query("delete from Follow f where f.followerId = :followerId and f.followeeId = :followeeId")
    int deleteFollow(String followerId, String followeeId);
}
