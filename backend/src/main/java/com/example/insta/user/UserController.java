package com.example.insta.user;

import com.example.insta.common.api.UserSummary;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/users")
class UserController {

    private final UserService userService;

    UserController(UserService userService) {
        this.userService = userService;
    }

    /** The only endpoint that does not need an acting user: the switcher uses it to pick one. */
    @GetMapping
    List<UserSummary> list() {
        return userService.listSummaries();
    }
}
