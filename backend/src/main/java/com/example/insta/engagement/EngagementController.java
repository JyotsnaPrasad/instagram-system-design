package com.example.insta.engagement;

import com.example.insta.common.api.CommentView;
import com.example.insta.common.api.TextRequest;
import com.example.insta.user.ActingUser;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/posts/{postId}")
class EngagementController {

    private final EngagementService engagementService;

    EngagementController(EngagementService engagementService) {
        this.engagementService = engagementService;
    }

    @PutMapping("/like")
    LikeState like(@ActingUser String me, @PathVariable long postId) {
        return engagementService.like(me, postId);
    }

    @DeleteMapping("/like")
    LikeState unlike(@ActingUser String me, @PathVariable long postId) {
        return engagementService.unlike(me, postId);
    }

    @PostMapping("/comments")
    @ResponseStatus(HttpStatus.CREATED)
    CommentView comment(@ActingUser String me, @PathVariable long postId, @RequestBody TextRequest request) {
        return engagementService.addComment(me, postId, request.text());
    }
}
