package com.grocery.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

@RestController
@RequestMapping("/api/sync")
@CrossOrigin(origins = {"http://localhost:4200", "http://localhost:4205", "https://lasignare.abdoudiallo.fr"})
public class SyncController {

    @Value("${google.sheets.url}")
    private String sheetsUrl;

    @Value("${google.sheets.api-key}")
    private String apiKey;

    @PostMapping
    public ResponseEntity<?> syncToGoogleSheets(@RequestBody Map<String, String> payload) {
        RestTemplate restTemplate = new RestTemplate();
        
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

        MultiValueMap<String, String> map = new LinkedMultiValueMap<>();
        map.add("key", apiKey);
        map.add("route", payload.get("route"));
        map.add("action", payload.get("action"));
        map.add("data", payload.get("data"));

        HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(map, headers);

        try {
            restTemplate.postForEntity(sheetsUrl, request, String.class);
            return ResponseEntity.ok(Map.of("message", "Sync successful"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                                 .body(Map.of("error", "Failed to sync with Google Sheets"));
        }
    }
}