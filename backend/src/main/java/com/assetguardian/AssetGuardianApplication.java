package com.assetguardian;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.web.bind.annotation.*;
import java.util.*;

@SpringBootApplication
@RestController
@RequestMapping("/api")
public class AssetGuardianApplication {

    public static void main(String[] args) {
        SpringApplication.run(AssetGuardianApplication.class, args);
    }

    @GetMapping("/status")
    public Map<String, String> getStatus() {
        Map<String, String> status = new HashMap<>();
        status.put("status", "System Online");
        status.put("version", "1.0.0");
        status.put("crawlers", "Active");
        return status;
    }
}
