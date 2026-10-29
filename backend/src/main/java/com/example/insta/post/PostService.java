package com.example.insta.post;

import com.example.insta.common.ApiException;
import com.example.insta.common.TextRules;
import com.example.insta.common.TimeConfig;
import com.example.insta.common.api.PostView;
import com.example.insta.user.UserService;
import java.time.Clock;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PostService {

    private final PostRepository posts;
    private final UserService userService;
    private final Clock clock;

    PostService(PostRepository posts, UserService userService, Clock clock) {
        this.posts = posts;
        this.userService = userService;
        this.clock = clock;
    }

    /** Author and time are always set by the server, never by the client (FR-1.4). */
    @Transactional
    public PostView create(String actingUserId, String rawText) {
        String text = TextRules.requireValid(rawText, TextRules.MAX_POST_LENGTH, "Post");
        Post post = posts.save(new Post(actingUserId, text, TimeConfig.now(clock)));
        // A new post has no likes or comments yet.
        return new PostView(post.getId(), userService.summary(actingUserId), post.getText(),
                post.getCreatedAt(), 0, false, 0, List.of());
    }

    @Transactional(readOnly = true)
    public List<Post> findByAuthors(Collection<String> authorIds) {
        if (authorIds.isEmpty()) {
            return List.of();
        }
        return posts.findByAuthorIdInOrderByCreatedAtDescIdDesc(authorIds);
    }

    @Transactional(readOnly = true)
    public Optional<Post> findById(long postId) {
        return posts.findById(postId);
    }

    /** @throws ApiException 404 if the post does not exist */
    @Transactional(readOnly = true)
    public Post requireById(long postId) {
        return posts.findById(postId).orElseThrow(() -> ApiException.notFound("Post " + postId + " not found."));
    }

    @Transactional(readOnly = true)
    public long countByAuthor(String authorId) {
        return posts.countByAuthorId(authorId);
    }
}
