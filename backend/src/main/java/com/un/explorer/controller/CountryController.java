package com.un.explorer.controller;

import com.un.explorer.dto.*;
import com.un.explorer.service.CountryService;
import com.un.explorer.service.WorldBankApiService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@Slf4j
@RestController
@RequestMapping("/api/countries")
@RequiredArgsConstructor
public class CountryController {

    private final CountryService countryService;
    private final WorldBankApiService worldBankService;

    /**
     * GET /api/countries
     */
    @GetMapping
    public ResponseEntity<List<CountryDto>> listAll() {
        return ResponseEntity.ok(countryService.getAllCountries());
    }

    /**
     * GET /api/countries/{id}
     * Full profile + World Bank data
     */
    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> getProfile(@PathVariable Long id) {

        CountryProfileDto profile = countryService.getProfile(id);
        String iso2 = profile.getCountry().getIso2Code();

        // World Bank Data
        Map<Integer, Double> gdp       = worldBankService.getGdpGrowth(iso2, 2015, 2025);
        Map<Integer, Double> exports   = worldBankService.getExports(iso2, 2015, 2025);
        Map<Integer, Double> imports   = worldBankService.getImports(iso2, 2015, 2025);
        Map<String, String> metadata   = worldBankService.getCountryMetadata(iso2);

        // Combine everything
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("profile", profile);
        response.put("worldBank", Map.of(
                "gdpGrowth", gdp,
                "exports", exports,
                "imports", imports,
                "metadata", metadata
        ));

        return ResponseEntity.ok(response);
    }

    /**
     * GET /api/countries/{id}/votes
     */
//    @GetMapping("/{id}/votes")
//    public ResponseEntity<List<CountryVoteHistoryDto>> getVoteHistory(
//            @PathVariable Long id,
//            @RequestParam(required = false) String topic,
//            @RequestParam(required = false) Integer year) {
//
//        return ResponseEntity.ok(countryService.getVoteHistory(id, topic, year));
//    }
    @GetMapping("/{id}/votes")
    public ResponseEntity<Page<CountryVoteHistoryDto>> getVoteHistory(
            @PathVariable Long id,
            @RequestParam(required = false) String topic,
            @RequestParam(required = false) Integer year,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        log.info("Controller getting params from frontend : ID-"+id+" Page : "+page+ " Size "+ size);

        return ResponseEntity.ok(
                countryService.getVoteHistory(id, topic, year, page, size)
        );
    }
}