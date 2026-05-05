package com.un.explorer.controller;

import com.un.explorer.dto.*;
import com.un.explorer.service.ResolutionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/resolutions")
@RequiredArgsConstructor
public class ResolutionController {

    private final ResolutionService resolutionService;

    /**
     * GET /api/resolutions
     * Query params: search, topic, year, page (1-based), limit
     */
    @GetMapping
    public ResponseEntity<PageDto<ResolutionSummaryDto>> list(
            @RequestParam(required = false)              String  search,
            @RequestParam(required = false)              String  topic,
            @RequestParam(required = false)              Integer year,
            @RequestParam(defaultValue = "1")            int     page,
            @RequestParam(defaultValue = "20")           int     limit) {

        return ResponseEntity.ok(resolutionService.search(search, topic, year, page, limit));
    }

    /**
     * GET /api/resolutions/{id}
     */
    @GetMapping("/{id}")
    public ResponseEntity<ResolutionSummaryDto> getOne(@PathVariable Long id) {
        return ResponseEntity.ok(resolutionService.getById(id));
    }

    /**
     * GET /api/resolutions/{id}/votes
     * Returns all country votes on this resolution, grouped by vote type.
     */
    @GetMapping("/{id}/votes")
    public ResponseEntity<ResolutionVotesDto> getVotes(@PathVariable Long id) {
        return ResponseEntity.ok(resolutionService.getVotes(id));
    }
}