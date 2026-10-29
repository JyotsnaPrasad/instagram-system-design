package com.example.insta;

import static org.hamcrest.Matchers.contains;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;

class DemoResetApiTest extends ApiTestBase {

    @Test
    void resetRestoresTheSeedExactly() throws Exception {
        // AC-6.2 / E28
        createPost(CAROL, "temporary");
        putAs(ALICE, "/api/users/carol/follow");
        putAs(BOB, "/api/posts/1/like");
        deleteAs(ALICE, "/api/posts/3/like");
        postTextAs(CAROL, "/api/posts/3/comments", "temporary comment");

        mvc.perform(post("/api/demo/reset")).andExpect(status().isNoContent());

        getAs(ALICE, "/api/feed").andExpect(jsonPath("$[*].id").value(contains(3, 2)));
        getAs(BOB, "/api/feed").andExpect(jsonPath("$[*].id").value(contains(3, 2, 1)));
        getAs(CAROL, "/api/feed").andExpect(jsonPath("$[*].id").value(contains(1)));
        getAs(ALICE, "/api/posts/3")
                .andExpect(jsonPath("$.likedByMe").value(true))
                .andExpect(jsonPath("$.commentCount").value(0));
        getAs(ALICE, "/api/posts/1").andExpect(jsonPath("$.likeCount").value(0));
        getAs(ALICE, "/api/users/carol")
                .andExpect(jsonPath("$.followerCount").value(1))
                .andExpect(jsonPath("$.postCount").value(1));
    }

    @Test
    void idsRestartAfterReset() throws Exception {
        createPost(ALICE, "a");
        createPost(ALICE, "b");
        mvc.perform(post("/api/demo/reset")).andExpect(status().isNoContent());

        postTextAs(ALICE, "/api/posts", "after reset").andExpect(jsonPath("$.id").value(4));
        postTextAs(ALICE, "/api/posts/2/comments", "hi").andExpect(jsonPath("$.id").value(2));
    }
}
