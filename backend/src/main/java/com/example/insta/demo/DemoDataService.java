package com.example.insta.demo;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.time.temporal.ChronoUnit;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionTemplate;

/**
 * Seeds the demo data from REQUIREMENTS.md section 4 on first start, and restores it on reset.
 * Works in plain SQL across all tables because it owns the whole dataset.
 */
@Service
public class DemoDataService implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(DemoDataService.class);

    private final JdbcTemplate jdbc;
    private final TransactionTemplate tx;
    private final Clock clock;

    DemoDataService(JdbcTemplate jdbc, TransactionTemplate tx, Clock clock) {
        this.jdbc = jdbc;
        this.tx = tx;
        this.clock = clock;
    }

    /** Seeds only an empty database, so data survives restarts (NFR-1). */
    @Override
    public void run(ApplicationArguments args) {
        Integer users = jdbc.queryForObject("SELECT COUNT(*) FROM users", Integer.class);
        if (users != null && users == 0) {
            log.info("Empty database: loading demo data");
            reset();
        }
    }

    /** Deletes everything and inserts the seed, with timestamps relative to now. */
    public void reset() {
        // H2 commits implicitly on DDL, so restart the id counters before the transactional part.
        // Seed posts then get ids 1-3, matching p1-p3 in the requirements.
        jdbc.execute("ALTER TABLE comments ALTER COLUMN id RESTART WITH 1");
        jdbc.execute("ALTER TABLE posts ALTER COLUMN id RESTART WITH 1");
        tx.executeWithoutResult(status -> {
            jdbc.update("DELETE FROM comments");
            jdbc.update("DELETE FROM likes");
            jdbc.update("DELETE FROM follows");
            jdbc.update("DELETE FROM posts");
            jdbc.update("DELETE FROM users");
            insertSeed(clock.instant().truncatedTo(ChronoUnit.MICROS));
        });
    }

    private void insertSeed(Instant t) {
        user("u1", "alice", "Alice Anderson", "Coffee and code.");
        user("u2", "bob", "Bob Brown", "Weekend hiker.");
        user("u3", "carol", "Carol Chen", "Reads too many books.");

        follow("u1", "u2", t.minus(Duration.ofHours(5)));
        follow("u2", "u1", t.minus(Duration.ofHours(5)));
        follow("u2", "u3", t.minus(Duration.ofHours(5)));

        // Inserted oldest first so ids 1, 2, 3 are p1, p2, p3.
        post("u3", "Just finished a great novel.", t.minus(Duration.ofHours(3)));
        post("u1", "Hello world! First post.", t.minus(Duration.ofHours(2)));
        post("u2", "Sunrise hike this morning.", t.minus(Duration.ofHours(1)));

        like(3, "u1", t.minus(Duration.ofMinutes(50)));
        like(2, "u3", t.minus(Duration.ofMinutes(100)));

        jdbc.update("INSERT INTO comments (post_id, author_id, text, created_at) VALUES (?, ?, ?, ?)",
                2, "u2", "Welcome!", ts(t.minus(Duration.ofMinutes(90))));
    }

    private void user(String id, String username, String displayName, String bio) {
        jdbc.update("INSERT INTO users (id, username, display_name, bio) VALUES (?, ?, ?, ?)",
                id, username, displayName, bio);
    }

    private void follow(String followerId, String followeeId, Instant at) {
        jdbc.update("INSERT INTO follows (follower_id, followee_id, created_at) VALUES (?, ?, ?)",
                followerId, followeeId, ts(at));
    }

    private void post(String authorId, String text, Instant at) {
        jdbc.update("INSERT INTO posts (author_id, text, created_at) VALUES (?, ?, ?)", authorId, text, ts(at));
    }

    private void like(long postId, String userId, Instant at) {
        jdbc.update("INSERT INTO likes (post_id, user_id, created_at) VALUES (?, ?, ?)", postId, userId, ts(at));
    }

    private static OffsetDateTime ts(Instant instant) {
        return OffsetDateTime.ofInstant(instant, ZoneOffset.UTC);
    }
}
