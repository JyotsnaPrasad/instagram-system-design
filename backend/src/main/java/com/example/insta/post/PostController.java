package com.example.insta.post;

import com.example.insta.common.api.PostView;
import com.example.insta.common.api.TextRequest;
import com.example.insta.user.ActingUser;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

/** Write side for posts. Reads (feed, profile posts, detail) are served by the feed module. */
@RestController
@RequestMapping("/api/posts")
class PostController {

    private final PostService postService;

    PostController(PostService postService) {
        this.postService = postService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    PostView create(@ActingUser String me, @RequestBody TextRequest request) {
        return postService.create(me, request.text());
    }
}
