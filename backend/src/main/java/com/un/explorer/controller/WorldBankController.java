package com.un.explorer.controller;

import com.un.explorer.service.WorldBankApiService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * REST Controller for World Bank API data.
 *
 * Base path: /api/worldbank
 */
@RestController
@RequestMapping("/api/worldbank")
@RequiredArgsConstructor
public class WorldBankController {

    private final WorldBankApiService worldBankService;

    // ─────────────────────────────────────────────────────────────
    //  GDP Growth
    // ─────────────────────────────────────────────────────────────

    /**
     * Example:
     * GET /api/worldbank/gdp?country=IN&from=2015&to=2023
     */
    @GetMapping("/gdp")
    public Map<Integer, Double> getGdpGrowth(
            @RequestParam String country,
            @RequestParam int from,
            @RequestParam int to
    ) {
        return worldBankService.getGdpGrowth(country, from, to);
    }

    // ─────────────────────────────────────────────────────────────
    //  Exports
    // ─────────────────────────────────────────────────────────────

    /**
     * GET /api/worldbank/exports?country=IN&from=2015&to=2023
     */
    @GetMapping("/exports")
    public Map<Integer, Double> getExports(
            @RequestParam String country,
            @RequestParam int from,
            @RequestParam int to
    ) {
        return worldBankService.getExports(country, from, to);
    }

    // ─────────────────────────────────────────────────────────────
    //  Imports
    // ─────────────────────────────────────────────────────────────

    /**
     * GET /api/worldbank/imports?country=IN&from=2015&to=2023
     */
    @GetMapping("/imports")
    public Map<Integer, Double> getImports(
            @RequestParam String country,
            @RequestParam int from,
            @RequestParam int to
    ) {
        return worldBankService.getImports(country, from, to);
    }

    // ─────────────────────────────────────────────────────────────
    //  Country Metadata
    // ─────────────────────────────────────────────────────────────

    /**
     * GET /api/worldbank/country/IN
     */
    @GetMapping("/country/{iso2}")
    public Map<String, String> getCountryMetadata(
            @PathVariable String iso2
    ) {
        return worldBankService.getCountryMetadata(iso2);
    }
}