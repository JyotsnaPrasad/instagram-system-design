package com.example.insta;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;

import com.example.insta.demo.DemoDataService;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import org.junit.jupiter.api.BeforeEach;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.context.annotation.Primary;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;

/**
 * Full-stack API tests against an in-memory H2 database. Every test starts from a fresh
 * demo reset at a fixed time T0, so the seed matches REQUIREMENTS.md section 4.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Import(ApiTestBase.TestClockConfig.class)
public abstract class ApiTestBase {

    protected static final Instant T0 = Instant.parse("2026-01-15T12:00:00Z");

    protected static final String ALICE = "u1";
    protected static final String BOB = "u2";
    protected static final String CAROL = "u3";

    /** Seed post ids: p1 (carol), p2 (alice), p3 (bob). */
    protected static final long P1 = 1;
    protected static final long P2 = 2;
    protected static final long P3 = 3;

    @TestConfiguration
    static class TestClockConfig {
        @Bean
        @Primary
        MutableClock testClock() {
            return new MutableClock(T0);
        }
    }

    @Autowired
    protected MockMvc mvc;
    @Autowired
    protected ObjectMapper json;
    @Autowired
    protected MutableClock clock;
    @Autowired
    protected DemoDataService demoData;
    @Autowired
    protected JdbcTemplate jdbc;

    @BeforeEach
    void resetDemoData() {
        clock.set(T0);
        demoData.reset();
    }

    protected ResultActions getAs(String userId, String path) throws Exception {
        return mvc.perform(get(path).header("X-Acting-User", userId));
    }

    protected ResultActions putAs(String userId, String path) throws Exception {
        return mvc.perform(put(path).header("X-Acting-User", userId));
    }

    protected ResultActions deleteAs(String userId, String path) throws Exception {
        return mvc.perform(delete(path).header("X-Acting-User", userId));
    }

    protected ResultActions postJsonAs(String userId, String path, String body) throws Exception {
        return mvc.perform(post(path).header("X-Acting-User", userId)
                .contentType(MediaType.APPLICATION_JSON).content(body));
    }

    protected ResultActions postTextAs(String userId, String path, String text) throws Exception {
        return postJsonAs(userId, path, json.writeValueAsString(Map.of("text", text)));
    }

    /** Creates a post and returns its id. */
    protected long createPost(String userId, String text) throws Exception {
        String body = postTextAs(userId, "/api/posts", text).andReturn().getResponse().getContentAsString();
        return json.readTree(body).get("id").asLong();
    }

    protected void tick() {
        clock.advance(Duration.ofSeconds(1));
    }
}
