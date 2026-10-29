package com.example.insta;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.example.insta.engagement.EngagementService;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

class LikeApiTest extends ApiTestBase {

    @Autowired
    EngagementService engagementService;

    @Test
    void likeThenUnlikeTogglesStateAndCount() throws Exception {
        // AC-2.1: p2 starts with carol's like.
        putAs(BOB, "/api/posts/2/like")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.postId").value(2))
                .andExpect(jsonPath("$.likedByMe").value(true))
                .andExpect(jsonPath("$.likeCount").value(2));
        // AC-2.2
        deleteAs(BOB, "/api/posts/2/like")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.likedByMe").value(false))
                .andExpect(jsonPath("$.likeCount").value(1));
    }

    @Test
    void likingTwiceIsANoOp() throws Exception {
        // AC-2.3 / E11: alice already likes p3.
        putAs(ALICE, "/api/posts/3/like").andExpect(jsonPath("$.likeCount").value(1));
        putAs(ALICE, "/api/posts/3/like").andExpect(jsonPath("$.likeCount").value(1));
        getAs(ALICE, "/api/posts/3").andExpect(jsonPath("$.likeCount").value(1));
    }

    @Test
    void unlikingAPostNotLikedIsANoOp() throws Exception {
        // E12
        deleteAs(BOB, "/api/posts/1/like")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.likedByMe").value(false))
                .andExpect(jsonPath("$.likeCount").value(0));
    }

    @Test
    void canLikeOwnPost() throws Exception {
        // AC-2.4 / E13
        putAs(ALICE, "/api/posts/2/like")
                .andExpect(jsonPath("$.likedByMe").value(true))
                .andExpect(jsonPath("$.likeCount").value(2));
    }

    @Test
    void likedByMeIsPerUser() throws Exception {
        // AC-2.5
        getAs(ALICE, "/api/feed").andExpect(jsonPath("$[0].likedByMe").value(true));
        getAs(BOB, "/api/feed")
                .andExpect(jsonPath("$[0].id").value(3))
                .andExpect(jsonPath("$[0].likeCount").value(1))
                .andExpect(jsonPath("$[0].likedByMe").value(false));
    }

    @Test
    void likeOrUnlikeOfMissingPostIs404() throws Exception {
        putAs(ALICE, "/api/posts/999/like").andExpect(status().isNotFound());
        deleteAs(ALICE, "/api/posts/999/like").andExpect(status().isNotFound());
    }

    @Test
    void concurrentDuplicateLikesCreateOneRecord() throws Exception {
        // NFR-2 / E10: the primary key, not a pre-check, guarantees uniqueness.
        int threads = 8;
        ExecutorService pool = Executors.newFixedThreadPool(threads);
        CountDownLatch start = new CountDownLatch(1);
        List<Future<?>> results = new ArrayList<>();
        for (int i = 0; i < threads; i++) {
            results.add(pool.submit(() -> {
                start.await();
                return engagementService.like(BOB, P1);
            }));
        }
        start.countDown();
        for (Future<?> f : results) {
            f.get();
        }
        pool.shutdown();

        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM likes WHERE post_id = 1", Integer.class)).isEqualTo(1);
    }
}
