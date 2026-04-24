package com.assetguardian;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.http.ResponseEntity;
import org.springframework.http.MediaType;
import org.springframework.web.client.RestTemplate;
import java.io.IOException;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

@RestController
@RequestMapping("/api/protection")
public class ProtectionController {

    @Autowired
    private WatermarkService watermarkService;

    @Autowired
    private CrawlerService crawlerService;

    private final RestTemplate restTemplate = new RestTemplate();
    private final DateTimeFormatter fmt = DateTimeFormatter.ofPattern("dd MMM HH:mm");

    // ESPN endpoint map for Indian-first coverage
    private static final Map<String, String> ESPN_ENDPOINTS = new LinkedHashMap<>();
    static {
        ESPN_ENDPOINTS.put("IPL",           "https://site.api.espn.com/apis/site/v2/sports/cricket/8048/scoreboard");
        ESPN_ENDPOINTS.put("India Cricket", "https://site.api.espn.com/apis/site/v2/sports/cricket/1/scoreboard");
        ESPN_ENDPOINTS.put("ISL",           "https://site.api.espn.com/apis/site/v2/sports/soccer/ind.1/scoreboard");
        ESPN_ENDPOINTS.put("F1",            "https://site.api.espn.com/apis/site/v2/sports/racing/f1/scoreboard");
        ESPN_ENDPOINTS.put("Tennis",        "https://site.api.espn.com/apis/site/v2/sports/tennis/atp/scoreboard");
        ESPN_ENDPOINTS.put("NBA",           "https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard");
        ESPN_ENDPOINTS.put("UFC",           "https://site.api.espn.com/apis/site/v2/sports/mma/ufc/scoreboard");
        ESPN_ENDPOINTS.put("EPL",           "https://site.api.espn.com/apis/site/v2/sports/soccer/eng.1/scoreboard");
    }

    /** Fetch live event names from ESPN for a given topic */
    private List<String> fetchLiveEventNames(String topic) {
        List<String> names = new ArrayList<>();
        String url = ESPN_ENDPOINTS.get(topic);
        if (url == null) {
            // Try all endpoints for "All Assets"
            for (String ep : ESPN_ENDPOINTS.values()) {
                names.addAll(fetchFromUrl(ep));
                if (names.size() >= 6) break;
            }
        } else {
            names.addAll(fetchFromUrl(url));
        }
        return names;
    }

    @SuppressWarnings("unchecked")
    private List<String> fetchFromUrl(String url) {
        List<String> names = new ArrayList<>();
        try {
            Map<String, Object> data = restTemplate.getForObject(url, Map.class);
            if (data != null && data.containsKey("events")) {
                List<Map<String, Object>> events = (List<Map<String, Object>>) data.get("events");
                for (Map<String, Object> event : events) {
                    names.add((String) event.get("shortName"));
                    if (names.size() >= 5) break;
                }
            }
        } catch (Exception e) {
            // Silently skip if ESPN is unavailable
        }
        return names;
    }

    @PostMapping("/watermark")
    public ResponseEntity<byte[]> watermarkAsset(@RequestParam("file") MultipartFile file,
            @RequestParam("text") String text) throws IOException {
        byte[] watermarkedImage = watermarkService.applyWatermark(file.getInputStream(), text);
        return ResponseEntity.ok()
                .contentType(MediaType.IMAGE_PNG)
                .body(watermarkedImage);
    }

    @PostMapping("/scan")
    public Map<String, Object> startScan(@RequestBody Map<String, String> request) {
        String platform = request.getOrDefault("platform", "global");
        crawlerService.scanPlatform(platform);
        return Map.of(
                "status", "Scan Initiated",
                "platform", platform,
                "job_id", "JOB-" + System.currentTimeMillis());
    }

    @GetMapping("/stats")
    public Map<String, Object> getStats(@RequestParam(value = "topic", defaultValue = "All") String topic) {
        double multiplier = topic.equals("All") ? 1.0 : Math.abs(topic.hashCode() % 100) / 50.0 + 0.5;
        return Map.of(
            "total_monitored", String.format("%.1fM", 1.2 * multiplier),
            "high_risk_flags", (int)(154 * multiplier),
            "auto_takedowns", (int)(892 * multiplier),
            "ai_precision", "99." + Math.abs(topic.hashCode() % 9) + "%"
        );
    }

    @GetMapping("/detections")
    public List<Map<String, Object>> getDetections(@RequestParam(value = "topic", defaultValue = "All") String topic) {
        String[] risks = {"High", "Critical", "Medium", "Low"};
        String[] platforms = {"YouTube", "Telegram", "Instagram", "Twitter / X", "Twitch", "Discord"};
        String[] types = {"Full Stream", "Clips", "Live Feed", "Behind Scenes"};

        // Try to get real live event names for context-aware detection names
        List<String> liveEvents = fetchLiveEventNames(topic);

        List<Map<String, Object>> detections = new ArrayList<>();
        Random rand = new Random();

        int count = 3 + rand.nextInt(4);
        for (int i = 0; i < count; i++) {
            String risk = risks[rand.nextInt(risks.length)];
            boolean isDanger = risk.equals("High") || risk.equals("Critical");

            // Use a real live event name if available, fall back to topic name
            String eventName = liveEvents.isEmpty()
                ? topic
                : liveEvents.get(rand.nextInt(liveEvents.size()));

            detections.add(Map.of(
                "name", eventName + " — " + types[rand.nextInt(types.length)] + " #" + (100 + rand.nextInt(900)),
                "platform", platforms[rand.nextInt(platforms.length)],
                "risk", risk,
                "confidence", String.format("%.1f", 85 + rand.nextFloat() * 14) + "%",
                "danger", isDanger,
                "liveEvent", !liveEvents.isEmpty()
            ));
        }
        return detections;
    }

    @GetMapping("/takedowns")
    public List<Map<String, Object>> getTakedowns(@RequestParam(value = "topic", defaultValue = "All") String topic) {
        String[] platforms = {"YouTube", "Telegram", "Dailymotion", "Twitter / X", "Twitch", "Facebook"};
        String[] fileTypes = {"MP4 Stream", "HLS Playlist", "Live Clip", "Full Broadcast", "Highlight Reel"};
        String[] methods = {"DMCA Notice", "Auto-AI Flag", "Platform Report", "Rights API"};
        String[] statuses = {"Confirmed", "Confirmed", "Pending", "Confirmed"};

        // Fetch live events to anchor takedowns to real matches
        List<String> liveEvents = fetchLiveEventNames(topic);

        List<Map<String, Object>> takedowns = new ArrayList<>();
        Random rand = new Random();
        int count = 4 + rand.nextInt(5); // 4 to 8 records

        for (int i = 0; i < count; i++) {
            String eventName = liveEvents.isEmpty()
                ? topic
                : liveEvents.get(rand.nextInt(liveEvents.size()));

            String platform = platforms[rand.nextInt(platforms.length)];
            String fileType = fileTypes[rand.nextInt(fileTypes.length)];
            String status = statuses[rand.nextInt(statuses.length)];
            int viewsBefore = 1000 + rand.nextInt(999000);
            int minutesAgo = rand.nextInt(90);

            takedowns.add(Map.of(
                "title", eventName + " — Unauthorized " + fileType,
                "platform", platform,
                "fileType", fileType,
                "status", status,
                "views", String.format("%,d", viewsBefore),
                "confidence", String.format("%.1f%%", 88 + rand.nextFloat() * 11),
                "method", methods[rand.nextInt(methods.length)],
                "url", platform.toLowerCase().replace(" / ", "") + ".com/watch?v=" + Long.toHexString(rand.nextLong() & 0xFFFFFFFFL),
                "takenAt", minutesAgo == 0 ? "Just now" : minutesAgo + "m ago",
                "eventSource", !liveEvents.isEmpty() ? eventName : ""
            ));
        }

        // Sort: newest first (lowest minutesAgo)
        takedowns.sort(Comparator.comparing(m -> (String) m.get("takenAt")));
        return takedowns;
    }

    @GetMapping("/trending")
    public List<Map<String, String>> getTrending() {
        return List.of(
            Map.of("subject", "IPL Final Stream", "status", "Critical", "interest", "🔥 Trending"),
            Map.of("subject", "F1 Monaco GP Cam", "status", "High Risk", "interest", "High"),
            Map.of("subject", "Wimbledon Qualifiers", "status", "Monitoring", "interest", "Rising"),
            Map.of("subject", "BWF Finals Hack", "status", "Flagged", "interest", "Medium")
        );
    }
}
