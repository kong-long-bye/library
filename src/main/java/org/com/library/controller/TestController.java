package org.com.library.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class TestController {
    
    @GetMapping("/test/api")
    public String apiTest() {
        return "test/api-test";
    }
} 