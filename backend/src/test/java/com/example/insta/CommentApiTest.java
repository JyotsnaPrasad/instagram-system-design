package com.example.insta;

import static org.hamcrest.Matchers.contains;
import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;

class CommentApiTest extends ApiTestBase {

    @Test
    void addedCommentAppearsUnderThePost() throws Exception {
        // AC-3.1
        postTextAs(ALICE, "/api/posts/3/comments", "  Nice!  ")
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.postId").value(3))
                .andExpect(jsonPath("$.author.username").value("alice"))
                .andExpect(jsonPath("$.text").value("Nice!"))
                .andExpect(jsonPath("$.createdAt").value(T0.toString()));

        getAs(ALICE, "/api/feed")
                .andExpect(jsonPath("$[0].id").value(3))
                .andExpect(jsonPath("$[0].commentCount").value(1))
                .andExpect(jsonPath("$[0].comments[0].text").value("Nice!"));
    }

    @Test
    void emptyCommentIsRejected() throws Exception {
        // AC-3.2
        postTextAs(ALICE, "/api/posts/3/comments", "  \n ")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Comment cannot be empty."))
                .andExpect(jsonPath("$.field").value("text"));
        getAs(ALICE, "/api/posts/3").andExpect(jsonPath("$.commentCount").value(0));
    }

    @Test
    void commentLimitIs300() throws Exception {
        // AC-3.4
        postTextAs(ALICE, "/api/posts/3/comments", "c".repeat(300)).andExpect(status().isCreated());
        postTextAs(ALICE, "/api/posts/3/comments", "c".repeat(301)).andExpect(status().isBadRequest());
    }

    @Test
    void commentOnMissingPostIs404() throws Exception {
        postTextAs(ALICE, "/api/posts/999/comments", "hello").andExpect(status().isNotFound());
    }

    @Test
    void sameUserCanPostIdenticalCommentsIncludingOnOwnPost() throws Exception {
        // FR-3.1, FR-3.6
        postTextAs(ALICE, "/api/posts/2/comments", "Thanks").andExpect(status().isCreated());
        postTextAs(ALICE, "/api/posts/2/comments", "Thanks").andExpect(status().isCreated());
        getAs(ALICE, "/api/posts/2").andExpect(jsonPath("$.commentCount").value(3));
    }

    @Test
    void feedShowsTwoMostRecentCommentsAndDetailShowsAllOldestFirst() throws Exception {
        // AC-3.3 / E25: p2 already has bob's "Welcome!".
        for (String text : new String[] {"c1", "c2", "c3"}) {
            tick();
            postTextAs(CAROL, "/api/posts/2/comments", text).andExpect(status().isCreated());
        }

        getAs(ALICE, "/api/feed")
                .andExpect(jsonPath("$[1].id").value(2))
                .andExpect(jsonPath("$[1].commentCount").value(4))
                .andExpect(jsonPath("$[1].comments[*].text").value(contains("c2", "c3")));

        getAs(ALICE, "/api/posts/2")
                .andExpect(jsonPath("$.comments", hasSize(4)))
                .andExpect(jsonPath("$.comments[*].text").value(contains("Welcome!", "c1", "c2", "c3")));
    }

    @Test
    void commentsWithTheSameTimestampAreOrderedById() throws Exception {
        postTextAs(BOB, "/api/posts/1/comments", "first").andExpect(status().isCreated());
        postTextAs(BOB, "/api/posts/1/comments", "second").andExpect(status().isCreated());
        postTextAs(BOB, "/api/posts/1/comments", "third").andExpect(status().isCreated());
        getAs(BOB, "/api/feed")
                .andExpect(jsonPath("$[2].id").value(1))
                .andExpect(jsonPath("$[2].comments[*].text").value(contains("second", "third")));
        getAs(BOB, "/api/posts/1")
                .andExpect(jsonPath("$.comments[*].text").value(contains("first", "second", "third")));
    }
}
