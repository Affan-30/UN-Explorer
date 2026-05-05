package com.un.explorer.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

import java.util.*;

/**
 * Fetches economic indicator data from the World Bank Open Data API.
 *
 * Base URL  : https://api.worldbank.org/v2/
 * Docs      : https://datahelpdesk.worldbank.org/knowledgebase/articles/898581
 * Auth      : No API key required — completely free
 * Format    : JSON (add ?format=json to every call)
 * Rate limit: Generous — no strict limit, but add delays in batch jobs
 *
 * Key indicators used in this project:
 *   NY.GDP.MKTP.KD.ZG  → GDP growth rate (annual %)
 *   NE.EXP.GNFS.CD      → Exports of goods and services (USD)
 *   NE.IMP.GNFS.CD      → Imports of goods and services (USD)
 *   FP.CPI.TOTL.ZG      → Inflation, consumer prices (annual %)
 *
 * Example URL:
 *   https://api.worldbank.org/v2/country/IN/indicator/NY.GDP.MKTP.KD.ZG
 *   ?format=json&date=2015:2023&per_page=10
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class WorldBankApiService {

    private static final String WB_BASE = "https://api.worldbank.org/v2";

    // Standard indicator codes
    public static final String GDP_GROWTH  = "NY.GDP.MKTP.KD.ZG";
    public static final String EXPORTS     = "NE.EXP.GNFS.CD";
    public static final String IMPORTS     = "NE.IMP.GNFS.CD";
    public static final String INFLATION   = "FP.CPI.TOTL.ZG";

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    // ─────────────────────────────────────────────────────────────────────────
    //  GDP Growth
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Get annual GDP growth rate for a country over a date range.
     *
     * @param iso2Code  Country ISO2 code (e.g. "IN", "US", "CN")
     * @param fromYear  e.g. 2015
     * @param toYear    e.g. 2023
     * @return Map of year → GDP growth % (e.g. {2022: 7.2, 2021: 8.7})
     */
    @Cacheable("worldbank-gdp")
    public Map<Integer, Double> getGdpGrowth(String iso2Code, int fromYear, int toYear) {
        return fetchIndicator(iso2Code, GDP_GROWTH, fromYear, toYear);
    }

    // ─────────────────────────────────────────────────────────────────────────
    //  Trade Data
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Get total exports (USD) for a country over a date range.
     */
    @Cacheable("worldbank-exports")
    public Map<Integer, Double> getExports(String iso2Code, int fromYear, int toYear) {
        return fetchIndicator(iso2Code, EXPORTS, fromYear, toYear);
    }

    /**
     * Get total imports (USD) for a country over a date range.
     */
    @Cacheable("worldbank-imports")
    public Map<Integer, Double> getImports(String iso2Code, int fromYear, int toYear) {
        return fetchIndicator(iso2Code, IMPORTS, fromYear, toYear);
    }

    // ─────────────────────────────────────────────────────────────────────────
    //  Country metadata (name, region, income level)
    //  Useful for enriching our countries table on first run
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Fetch basic country metadata from World Bank.
     * Returns a map with keys: name, region, incomeLevel, capitalCity
     */
    public Map<String, String> getCountryMetadata(String iso2Code) {
        String url = String.format("%s/country/%s?format=json", WB_BASE, iso2Code);
        log.info("Fetching WB country metadata: {}", iso2Code);

        try {
            String   raw  = restTemplate.getForObject(url, String.class);
            JsonNode root = objectMapper.readTree(raw);

            // World Bank wraps responses in a 2-element array:
            // [0] = pagination info, [1] = data array
            JsonNode data = root.get(1);
            if (data == null || !data.isArray() || data.size() == 0) {
                return Collections.emptyMap();
            }

            JsonNode country = data.get(0);
            Map<String, String> result = new LinkedHashMap<>();
            result.put("name",        country.path("name").asText());
            result.put("region",      country.path("region").path("value").asText());
            result.put("incomeLevel", country.path("incomeLevel").path("value").asText());
            result.put("capitalCity", country.path("capitalCity").asText());
            result.put("iso3Code",    country.path("id").asText());

            return result;

        } catch (Exception e) {
            log.error("Failed to fetch WB metadata for {}: {}", iso2Code, e.getMessage());
            return Collections.emptyMap();
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    //  Core fetch method
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Generic indicator fetch.
     * World Bank API response structure:
     *   [
     *     { page, pages, per_page, total },   ← index 0: pagination
     *     [                                    ← index 1: data array
     *       { date: "2022", value: 7.23, country: { id: "IN", value: "India" } },
     *       { date: "2021", value: 8.74, ... },
     *       ...
     *     ]
     *   ]
     *
     * @param iso2Code   Country ISO2 code
     * @param indicator  World Bank indicator code
     * @param fromYear   Start year
     * @param toYear     End year
     * @return Map of year (int) → indicator value (double)
     */
    private Map<Integer, Double> fetchIndicator(
            String iso2Code, String indicator, int fromYear, int toYear) {

        String url = String.format(
                "%s/country/%s/indicator/%s?format=json&date=%d:%d&per_page=100",
                WB_BASE, iso2Code.toLowerCase(), indicator, fromYear, toYear
        );
        log.info("Fetching WB indicator: {} for {} ({}-{})", indicator, iso2Code, fromYear, toYear);

        try {
            String   raw  = restTemplate.getForObject(url, String.class);
            JsonNode root = objectMapper.readTree(raw);

            // World Bank wraps in 2-element array
            JsonNode dataArray = root.get(1);
            if (dataArray == null || !dataArray.isArray()) {
                log.warn("No data array in WB response for {}", indicator);
                return Collections.emptyMap();
            }

            Map<Integer, Double> result = new TreeMap<>();
            for (JsonNode entry : dataArray) {
                String  yearStr = entry.path("date").asText();
                JsonNode valNode = entry.path("value");
                if (!valNode.isNull() && !yearStr.isEmpty()) {
                    try {
                        result.put(Integer.parseInt(yearStr), valNode.asDouble());
                    } catch (NumberFormatException ignored) {}
                }
            }

            log.info("Got {} data points for {} {}", result.size(), iso2Code, indicator);
            return result;

        } catch (Exception e) {
            log.error("Failed to fetch WB indicator {} for {}: {}", indicator, iso2Code, e.getMessage());
            return Collections.emptyMap();
        }
    }
}