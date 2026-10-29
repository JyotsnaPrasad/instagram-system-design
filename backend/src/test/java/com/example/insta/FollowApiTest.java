package com.example.insta;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.contains;
import static org.hamcrest.Matchers.empty;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;

class FollowApiTest extends ApiTestBase {

    @Test
    void followUpdatesBothProfilesAndAddsOlderPostsToTheFeed() throws Exception {
        // AC-4.2
        putAs(ALICE, "/api/users/carol/follow")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.followedByMe").value(true))
                .andExpect(jsonPath("$.followerCount").value(2))
                .andExpect(jsonPath("$.followingCount").value(0));
        getAs(ALICE, "/api/users/alice").andExpect(jsonPath("$.followingCount").value(2));
        getAs(ALICE, "/api/users/carol").andExpect(jsonPath("$.followedByMe").value(true));

        // AC-4.3 / FR-5.4: carol's older p1 slots in by time.
        getAs(ALICE, "/api/feed").andExpect(jsonPath("$[*].id").value(contains(3, 2, 1)));
    }

    @Test
    void unfollowRemovesPostsAndRestoresCounts() throws Exception {
        // AC-4.4
        putAs(ALICE, "/api/users/carol/follow");
        deleteAs(ALICE, "/api/users/carol/follow")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.followedByMe").value(false))
                .andExpect(jsonPath("$.followerCount").value(1));
        getAs(ALICE, "/api/users/alice").andExpect(jsonPath("$.followingCount").value(1));
        getAs(ALICE, "/api/feed").andExpect(jsonPath("$[*].id").value(contains(3, 2)));
    }

    @Test
    void followingTwiceIsANoOp() throws Exception {
        // E15
        putAs(ALICE, "/api/users/bob/follow")
                .andExpect(jsonPath("$.followedByMe").value(true))
                .andExpect(jsonPath("$.followerCount").value(1));
    }

    @Test
    void unfollowingSomeoneNotFollowedIsANoOp() throws Exception {
        // E16
        deleteAs(CAROL, "/api/users/alice/follow")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.followedByMe").value(false))
                .andExpect(jsonPath("$.followerCount").value(1));
    }

    @Test
    void cannotFollowOrUnfollowYourself() throws Exception {
        // AC-4.6 / E14
        putAs(ALICE, "/api/users/alice/follow")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_ERROR"))
                .andExpect(jsonPath("$.message").value("You cannot follow yourself."));
        deleteAs(ALICE, "/api/users/alice/follow").andExpect(status().isBadRequest());
        assertThat(jdbc.queryForObject(
                "SELECT COUNT(*) FROM follows WHERE follower_id = followee_id", Integer.class)).isZero();
    }

    @Test
    void followingAnUnknownUserIs404() throws Exception {
        putAs(ALICE, "/api/users/nobody/follow").andExpect(status().isNotFound());
        deleteAs(ALICE, "/api/users/nobody/follow").andExpect(status().isNotFound());
    }

    @Test
    void followsAreOneDirectional() throws Exception {
        // AC-4.7 / E17: alice and bob follow each other.
        deleteAs(ALICE, "/api/users/bob/follow").andExpect(jsonPath("$.followedByMe").value(false));
        getAs(BOB, "/api/users/alice").andExpect(jsonPath("$.followedByMe").value(true));
        getAs(BOB, "/api/feed").andExpect(jsonPath("$[*].id").value(contains(3, 2, 1)));
    }

    @Test
    void unfollowKeepsEarlierLikesAndComments() throws Exception {
        // AC-4.8 / E18 / FR-4.10: alice likes p3.
        postTextAs(ALICE, "/api/posts/3/comments", "Great view").andExpect(status().isCreated());
        deleteAs(ALICE, "/api/users/bob/follow");

        getAs(ALICE, "/api/feed").andExpect(jsonPath("$[*].id").value(contains(2)));
        getAs(ALICE, "/api/posts/3")
                .andExpect(jsonPath("$.likedByMe").value(true))
                .andExpect(jsonPath("$.likeCount").value(1))
                .andExpect(jsonPath("$.comments[0].text").value("Great view"));
        getAs(ALICE, "/api/users/bob/posts").andExpect(jsonPath("$[0].likedByMe").value(true));
    }

    @Test
    void followerAndFollowingListsAreSortedByUsername() throws Exception {
        // FR-4.9
        getAs(ALICE, "/api/users/bob/following")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[*].username").value(contains("alice", "carol")));
        getAs(ALICE, "/api/users/alice/followers").andExpect(jsonPath("$[*].username").value(contains("bob")));
        getAs(ALICE, "/api/users/carol/following").andExpect(jsonPath("$", empty()));
    }
}
