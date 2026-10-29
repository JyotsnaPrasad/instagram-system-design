package com.example.insta;

import static org.assertj.core.api.Assertions.assertThat;

import com.example.insta.common.api.PostView;
import com.example.insta.feed.FeedService;
import com.example.insta.post.PostService;
import java.nio.file.Path;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.boot.WebApplicationType;
import org.springframework.boot.builder.SpringApplicationBuilder;
import org.springframework.context.ConfigurableApplicationContext;

/** AC-6.1 / NFR-1: data in the H2 file survives a restart, and the seed is not re-applied. */
class PersistenceTest {

    @TempDir
    Path dataDir;

    @Test
    void postSurvivesRestartAndSeedIsNotReapplied() {
        String url = "--spring.datasource.url=jdbc:h2:file:" + dataDir.resolve("insta").toAbsolutePath();

        try (ConfigurableApplicationContext first = start(url)) {
            first.getBean(PostService.class).create("u1", "Persist me");
        }

        try (ConfigurableApplicationContext second = start(url)) {
            List<PostView> feed = second.getBean(FeedService.class).feed("u1");
            assertThat(feed).extracting(PostView::text)
                    .containsExactly("Persist me", "Sunrise hike this morning.", "Hello world! First post.");
            assertThat(feed.get(0).id()).isEqualTo(4);
        }
    }

    private static ConfigurableApplicationContext start(String datasourceUrl) {
        return new SpringApplicationBuilder(InstaApplication.class)
                .web(WebApplicationType.NONE)
                .run(datasourceUrl, "--spring.h2.console.enabled=false");
    }
}
