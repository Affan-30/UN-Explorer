package com.un.explorer.controller;

import com.un.explorer.dto.*;
import com.un.explorer.service.SimilarityService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/similarity")
@RequiredArgsConstructor
public class SimilarityController {

    private final SimilarityService similarityService;

    /**
     * GET /api/similarity?c1=1&c2=2
     * Voting similarity score between exactly two countries.
     */
    @GetMapping
    public ResponseEntity<?> getSimilarity(
            @RequestParam Long c1,
            @RequestParam Long c2) {

        if (c1.equals(c2)) {
            return ResponseEntity.badRequest()
                    .body("c1 and c2 must be different countries");
        }
        return ResponseEntity.ok(similarityService.computeSimilarity(c1, c2));
    }

    /**
     * GET /api/similarity/ranking/{countryId}?limit=15
     * All countries ranked by similarity to one country.
     */
    @GetMapping("/ranking/{countryId}")
    public ResponseEntity<List<SimilarityRankingDto>> getRanking(
            @PathVariable              Long countryId,
            @RequestParam(defaultValue="15") int limit) {

        return ResponseEntity.ok(similarityService.getSimilarityRanking(countryId, limit));
    }

    /**
     * GET /api/similarity/blocs?topic=nuclear
     * Countries grouped into regional voting blocs.
     */
    @GetMapping("/blocs")
    public ResponseEntity<List<BlocDto>> getBlocs(
            @RequestParam(required = false) String topic) {

        return ResponseEntity.ok(similarityService.getBlocs(topic));
    }

    /**
     * POST /api/similarity/rebuild-cache
     * Trigger a full recompute of all country-pair similarity scores.
     * In production, protect this with an admin role.
     */
    @PostMapping("/rebuild-cache")
    public ResponseEntity<String> rebuildCache() {
        similarityService.rebuildCache();
        return ResponseEntity.ok("Similarity cache rebuilt successfully.");
    }
}