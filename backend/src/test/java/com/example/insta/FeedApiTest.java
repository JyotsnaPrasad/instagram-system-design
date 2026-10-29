package com.example.insta;

import static org.hamcrest.Matchers.contains;
import static org.hamcrest.Matchers.empty;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;

class FeedApiTest extends ApiTestBase {

    @Test
    void seededFeedsMatchTheRequirements() throws Exception {
        // AC-5.1 to AC-5.3
        getAs(ALICE, "/api/feed").andExpect(status().isOk()).andExpect(jsonPath("$[*].id").value(contains(3, 2)));
        getAs(BOB, "/api/feed").andExpect(jsonPath("$[*].id").value(contains(3, 2, 1)));
        getAs(CAROL, "/api/feed").andExpect(jsonPath("$[*].id").value(contains(1)));
    }

    @Test
    void feedItemsCarryAuthorStatsAndPreviewComments() throws Exception {
        // FR-5.3, using p2 from the seed.
        getAs(ALICE, "/api/feed")
                .andExpect(jsonPath("$[1].author.username").value("alice"))
                .andExpect(jsonPath("$[1].author.displayName").value("Alice Anderson"))
                .andExpect(jsonPath("$[1].text").value("Hello world! First post."))
                .andExpect(jsonPath("$[1].createdAt").value("2026-01-15T10:00:00Z"))
                .andExpect(jsonPath("$[1].likeCount").value(1))
                .andExpect(jsonPath("$[1].likedByMe").value(false))
                .andExpect(jsonPath("$[1].commentCount").value(1))
                .andExpect(jsonPath("$[1].comments[0].author.username").value("bob"))
                .andExpect(jsonPath("$[1].comments[0].text").value("Welcome!"));
    }

    @Test
    void equalTimestampsAreOrderedByIdDescendingAndStable() throws Exception {
        // AC-5.5 / E20: the clock is not advanced, so both posts share a timestamp.
        long first = createPost(BOB, "same time A");
        long second = createPost(BOB, "same time B");
        for (int i = 0; i < 2; i++) {
            getAs(BOB, "/api/feed")
                    .andExpect(jsonPath("$[*].id").value(contains((int) second, (int) first, 3, 2, 1)));
        }
    }

    @Test
    void emptyFeedReturnsAnEmptyList() throws Exception {
        // AC-5.4: custom seed without carol's post (p1 has no likes or comments).
        jdbc.update("DELETE FROM posts WHERE id = 1");
        getAs(CAROL, "/api/feed").andExpect(status().isOk()).andExpect(jsonPath("$", empty()));
    }

    @Test
    void feedReflectsActionsImmediately() throws Exception {
        // AC-5.6: each write is visible on the next read.
        tick();
        long id = createPost(CAROL, "Library day");
        putAs(BOB, "/api/posts/" + id + "/like");
        postTextAs(BOB, "/api/posts/" + id + "/comments", "Enjoy!");
        getAs(BOB, "/api/feed")
                .andExpect(jsonPath("$[0].id").value((int) id))
                .andExpect(jsonPath("$[0].likeCount").value(1))
                .andExpect(jsonPath("$[0].likedByMe").value(true))
                .andExpect(jsonPath("$[0].commentCount").value(1));
    }
}
