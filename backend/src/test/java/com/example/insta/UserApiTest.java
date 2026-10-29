package com.example.insta;

import static org.hamcrest.Matchers.contains;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;

class UserApiTest extends ApiTestBase {

    @Test
    void listsTheThreeDemoUsersWithoutAnActingUser() throws Exception {
        mvc.perform(get("/api/users"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[*].username").value(contains("alice", "bob", "carol")))
                .andExpect(jsonPath("$[0].displayName").value("Alice Anderson"));
    }

    @Test
    void profileShowsCountsAndFollowState() throws Exception {
        // AC-4.1: carol has 1 follower (bob); alice does not follow her.
        getAs(ALICE, "/api/users/carol")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.bio").value("Reads too many books."))
                .andExpect(jsonPath("$.postCount").value(1))
                .andExpect(jsonPath("$.followerCount").value(1))
                .andExpect(jsonPath("$.followingCount").value(0))
                .andExpect(jsonPath("$.followedByMe").value(false));

        getAs(ALICE, "/api/users/bob").andExpect(jsonPath("$.followedByMe").value(true));
    }

    @Test
    void ownProfileIsNeverFollowedByMe() throws Exception {
        getAs(ALICE, "/api/users/alice")
                .andExpect(jsonPath("$.followedByMe").value(false))
                .andExpect(jsonPath("$.followingCount").value(1))
                .andExpect(jsonPath("$.followerCount").value(1));
    }

    @Test
    void profilePostsAreNewestFirst() throws Exception {
        tick();
        long newer = createPost(ALICE, "Second post");
        getAs(BOB, "/api/users/alice/posts")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[*].id").value(contains((int) newer, (int) P2)));
    }

    @Test
    void unknownProfileIs404() throws Exception {
        getAs(ALICE, "/api/users/nobody")
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404))
                .andExpect(jsonPath("$.code").value("NOT_FOUND"));
        getAs(ALICE, "/api/users/nobody/posts").andExpect(status().isNotFound());
        getAs(ALICE, "/api/users/nobody/followers").andExpect(status().isNotFound());
    }

    @Test
    void missingActingUserHeaderIs400() throws Exception {
        mvc.perform(get("/api/feed"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("INVALID_ACTING_USER"));
    }

    @Test
    void unknownActingUserIs400EvenWhenTheTargetIsAlsoMissing() throws Exception {
        // E21/E23: the acting user is checked before the target.
        getAs("u9", "/api/posts/999")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("INVALID_ACTING_USER"));
    }

    @Test
    void unknownRouteAndWrongMethodUseTheErrorShape() throws Exception {
        getAs(ALICE, "/api/nope")
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("NOT_FOUND"));
        mvc.perform(patch("/api/feed").header("X-Acting-User", ALICE))
                .andExpect(status().isMethodNotAllowed())
                .andExpect(jsonPath("$.code").value("METHOD_NOT_ALLOWED"));
    }
}
