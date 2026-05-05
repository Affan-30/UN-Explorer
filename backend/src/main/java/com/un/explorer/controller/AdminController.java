package com.un.explorer.controller;

import com.un.explorer.service.SimilarityService;
import com.un.explorer.service.DataSeederService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Admin-only endpoints for data management.
 *
 * In production: protect these with Spring Security (@PreAuthorize("hasRole('ADMIN')"))
 * For now: only expose locally (bind to 127.0.0.1 or use a secret header check)
 *
 * Usage:
 *   POST /api/admin/seed/countries     → seed country table
 *   POST /api/admin/seed/csv           → full CSV seed from Harvard Dataverse
 *   POST /api/admin/seed/csv?path=...  → seed from local CSV file
 *   POST /api/admin/enrich/un-api      → enrich titles from UN API
 *   POST /api/admin/rebuild-cache      → recompute all similarity scores
 */
@Slf4j
@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final DataSeederService  seederService;
    private final SimilarityService  similarityService;

    /**
     * POST /api/admin/seed/countries
     * Seeds the countries table only (fast, no external API needed).
     */
    @PostMapping("/seed/countries")
    public ResponseEntity<Map<String, String>> seedCountries() {
        seederService.seedCountries();
        return ResponseEntity.ok(Map.of("status", "Countries seeded successfully"));
    }

    /**
     * POST /api/admin/seed/csv
     * Downloads the Harvard Dataverse unvotes CSV and seeds the full database.
     *
     * Optional query param:
     *   ?path=/absolute/path/to/UNVotes.csv  → use a local file instead of downloading
     *
     * This takes several minutes for the full 1M-row dataset.
     * Run once after first deployment.
     */
    @PostMapping("/seed/csv")
    public ResponseEntity<Map<String, String>> seedFromCsv(
            @RequestParam(required = false) String path) {
        // Run in background thread so the HTTP response returns immediately
        Thread.ofVirtual().start(() -> {
            try {
                seederService.seedFromCsv(path);
                log.info("CSV seeding completed successfully.");
            } catch (Exception e) {
                log.error("CSV seeding failed: {}", e.getMessage(), e);
            }
        });

        return ResponseEntity.accepted().body(Map.of(
                "status",  "Seeding started in background",
                "message", "Check server logs for progress. This takes ~5-10 minutes for the full dataset."
        ));
    }

    /**
     * POST /api/admin/enrich/un-api?from=2015&to=2023
     * Enriches resolution titles from the UN Digital Library API.
     * Run AFTER seed/csv.
     */
//    @PostMapping("/enrich/un-api")
//    public ResponseEntity<Map<String, String>> enrichFromUnApi(
//            @RequestParam(defaultValue = "2015") int from,
//            @RequestParam(defaultValue = "2023") int to) {
//
//        Thread.ofVirtual().start(() -> {
//            seederService.enrichFromUnApi(from, to);
//            log.info("UN API enrichment completed.");
//        });
//
//        return ResponseEntity.accepted().body(Map.of(
//                "status",  "Enrichment started in background",
//                "range",   from + " to " + to,
//                "message", "Check server logs for progress."
//        ));
//    }

    /**
     * POST /api/admin/rebuild-cache
     * Recomputes all 193×193 country-pair similarity scores.
     * Run after seeding. Takes a few minutes.
     */
    @PostMapping("/rebuild-cache")
    public ResponseEntity<Map<String, String>> rebuildCache() {
        Thread.ofVirtual().start(() -> {
            similarityService.rebuildCache();
            log.info("Similarity cache rebuild complete.");
        });

        return ResponseEntity.accepted().body(Map.of(
                "status",  "Cache rebuild started in background",
                "message", "Check server logs for progress."
        ));
    }
}