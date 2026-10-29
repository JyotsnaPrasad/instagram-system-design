package com.example.insta.demo;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

/** Backs the visible "Reset Demo Data" button. Needs no acting user. */
@RestController
@RequestMapping("/api/demo")
class DemoController {

    private final DemoDataService demoDataService;

    DemoController(DemoDataService demoDataService) {
        this.demoDataService = demoDataService;
    }

    @PostMapping("/reset")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    void reset() {
        demoDataService.reset();
    }
}
