package com.example.insta;

import static org.hamcrest.Matchers.contains;
import static org.hamcrest.Matchers.hasItem;
import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.not;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;

class PostApiTest extends ApiTestBase {

    @Test
    void createdPostAppearsFirstInOwnFeed() throws Exception {
        // AC-1.1
        postTextAs(ALICE, "/api/posts", "My new post")
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(4))
                .andExpect(jsonPath("$.author.username").value("alice"))
                .andExpect(jsonPath("$.text").value("My new post"))
                .andExpect(jsonPath("$.createdAt").value(T0.toString()))
                .andExpect(jsonPath("$.likeCount").value(0))
                .andExpect(jsonPath("$.likedByMe").value(false))
                .andExpect(jsonPath("$.commentCount").value(0))
                .andExpect(jsonPath("$.comments", hasSize(0)));

        getAs(ALICE, "/api/feed").andExpect(jsonPath("$[0].id").value(4));
    }

    @Test
    void followersSeeTheNewPostAndOthersDoNot() throws Exception {
        long id = createPost(ALICE, "News");
        // AC-1.6: bob follows alice.
        getAs(BOB, "/api/feed").andExpect(jsonPath("$[0].id").value((int) id));
        // AC-1.7: carol does not.
        getAs(CAROL, "/api/feed").andExpect(jsonPath("$[*].id", not(hasItem((int) id))));
    }

    @Test
    void emptyOrWhitespaceTextIsRejectedAndNothingSaved() throws Exception {
        // AC-1.2 / E1
        for (String text : new String[] {"", "   ", "\n\n\t"}) {
            postTextAs(ALICE, "/api/posts", text)
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.code").value("VALIDATION_ERROR"))
                    .andExpect(jsonPath("$.message").value("Post cannot be empty."))
                    .andExpect(jsonPath("$.field").value("text"));
        }
        postJsonAs(ALICE, "/api/posts", "{}").andExpect(status().isBadRequest());
        getAs(ALICE, "/api/users/alice").andExpect(jsonPath("$.postCount").value(1));
    }

    @Test
    void lengthLimitIs500AfterTrimming() throws Exception {
        // AC-1.3, AC-1.4, E2-E4
        postTextAs(ALICE, "/api/posts", "a".repeat(500)).andExpect(status().isCreated());
        postTextAs(ALICE, "/api/posts", "a".repeat(501))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_ERROR"));
        postTextAs(ALICE, "/api/posts", "   " + "b".repeat(500) + "  \n")
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.text").value("b".repeat(500)));
        getAs(ALICE, "/api/users/alice").andExpect(jsonPath("$.postCount").value(3));
    }

    @Test
    void emojiAndNonLatinTextCountByCharacterAndRoundTrip() throws Exception {
        // E5: 500 emoji are 1000 UTF-16 units but 500 characters.
        String emoji = "🌄";
        postTextAs(ALICE, "/api/posts", emoji.repeat(500)).andExpect(status().isCreated());
        postTextAs(ALICE, "/api/posts", emoji.repeat(501)).andExpect(status().isBadRequest());

        String mixed = "Café ☕ 東京 שלום";
        long id = createPost(ALICE, mixed);
        getAs(ALICE, "/api/posts/" + id).andExpect(jsonPath("$.text").value(mixed));
    }

    @Test
    void htmlAndLineBreaksAreStoredLiterally() throws Exception {
        // AC-1.5 / E6 / E7: the API returns the exact text; escaping is the client's job.
        String text = "<script>alert(1)</script>\n<b>hi</b>\n\nbye";
        long id = createPost(ALICE, text);
        getAs(ALICE, "/api/posts/" + id).andExpect(jsonPath("$.text").value(text));
    }

    @Test
    void clientCannotSetAuthorOrTimestamp() throws Exception {
        // FR-1.4: extra fields are ignored.
        postJsonAs(ALICE, "/api/posts",
                "{\"text\":\"mine\",\"authorId\":\"u2\",\"createdAt\":\"2000-01-01T00:00:00Z\",\"id\":99}")
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.author.id").value(ALICE))
                .andExpect(jsonPath("$.createdAt").value(T0.toString()))
                .andExpect(jsonPath("$.id").value(4));
    }

    @Test
    void malformedBodyIs400() throws Exception {
        postJsonAs(ALICE, "/api/posts", "{not json")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_ERROR"));
    }

    @Test
    void postDetailIncludesStatsForTheActingUser() throws Exception {
        getAs(ALICE, "/api/posts/" + P3)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.author.username").value("bob"))
                .andExpect(jsonPath("$.likeCount").value(1))
                .andExpect(jsonPath("$.likedByMe").value(true));
        getAs(BOB, "/api/posts/" + P3).andExpect(jsonPath("$.likedByMe").value(false));
    }

    @Test
    void unknownOrNonNumericPostIs404() throws Exception {
        // E27
        getAs(ALICE, "/api/posts/999").andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("NOT_FOUND"));
        getAs(ALICE, "/api/posts/abc").andExpect(status().isNotFound());
    }

    @Test
    void feedListsAuthorsPostsInOrder() throws Exception {
        tick();
        long a = createPost(ALICE, "one");
        tick();
        long b = createPost(ALICE, "two");
        getAs(ALICE, "/api/feed").andExpect(jsonPath("$[*].id").value(contains((int) b, (int) a, 3, 2)));
    }
}
