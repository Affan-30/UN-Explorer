package com.un.explorer.service;

import com.un.explorer.repository.CountryRepository;
import com.un.explorer.repository.SimilarityCacheRepository;
import com.un.explorer.repository.VoteRepository;
import com.un.explorer.dto.*;
import com.un.explorer.model.*;
import com.un.explorer.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class SimilarityService {

    private final CountryRepository countryRepo;
    private final VoteRepository voteRepo;
    private final SimilarityCacheRepository cacheRepo;

    // ── Core Algorithm ────────────────────────────────────────────────────────

    /**
     * Compute voting similarity between two countries.
     *
     * Formula:
     *   score = (matching_votes / total_compared_votes) × 100
     *
     * Only non-absent votes are compared.
     * Result is stored in similarity_cache for future fast lookups.
     */
    @Transactional
    public SimilarityDto computeSimilarity(Long aId, Long bId) {
        Country a = countryRepo.findById(aId)
                .orElseThrow(() -> new RuntimeException("Country not found: " + aId));
        Country b = countryRepo.findById(bId)
                .orElseThrow(() -> new RuntimeException("Country not found: " + bId));

        List<Object[]> result = voteRepo.computeSharedVotes(aId, bId);

        Long matchingVotes = 0L;
        Long totalCompared = 0L;

        if (!result.isEmpty()) {
            Object[] row = result.get(0);
            matchingVotes = row[0] != null ? ((Number) row[0]).longValue() : 0L;
            totalCompared = row[1] != null ? ((Number) row[1]).longValue() : 0L;
        }

        if (totalCompared == 0) {
            return SimilarityDto.builder()
                    .countryA(CountryDto.from(a))
                    .countryB(CountryDto.from(b))
                    .score(null)
                    .matchingVotes(0L)
                    .totalCompared(0L)
                    .interpretation("Not enough shared votes to compute a score")
                    .build();
        }

        BigDecimal score = BigDecimal.valueOf(matchingVotes)
                .multiply(BigDecimal.valueOf(100))
                .divide(BigDecimal.valueOf(totalCompared), 2, RoundingMode.HALF_UP);

        String interpretation = interpretScore(score.doubleValue());

        return SimilarityDto.builder()
                .countryA(CountryDto.from(a))
                .countryB(CountryDto.from(b))
                .score(score)
                .matchingVotes(matchingVotes)
                .totalCompared(totalCompared)
                .interpretation(interpretation)
                .build();
    }

    /**
     * Get all countries ranked by similarity to one country.
     * Uses the pre-computed cache if available; falls back to live computation.
     */
    @Transactional(readOnly = true)
    public List<SimilarityRankingDto> getSimilarityRanking(Long countryId, int limit) {
        List<SimilarityCache> cached = cacheRepo.findAllForCountry(countryId);

        if (!cached.isEmpty()) {
            return cached.stream()
                    .map(sc -> {
                        Country other = sc.getCountryA().getId().equals(countryId)
                                ? sc.getCountryB() : sc.getCountryA();
                        return SimilarityRankingDto.builder()
                                .id(other.getId())
                                .name(other.getName())
                                .iso2Code(other.getIso2Code())
                                .region(other.getRegion() != null
                                        ? other.getRegion().name().replace("_", " ") : null)
                                .score(sc.getSimilarityScore())
                                .resolutionsCompared(sc.getResolutionsCompared())
                                .build();
                    })
                    .sorted(Comparator.comparing(SimilarityRankingDto::getScore).reversed())
                    .limit(limit)
                    .collect(Collectors.toList());
        }

        // Cache miss — compute live
        log.info("Cache miss for country {}. Computing live similarity ranking.", countryId);
        List<Country> others = countryRepo.findAllByOrderByNameAsc()
                .stream().filter(c -> !c.getId().equals(countryId)).collect(Collectors.toList());

        List<SimilarityRankingDto> results = new ArrayList<>();
        for (Country other : others) {
            List<Object[]> result = voteRepo.computeSharedVotes(countryId, other.getId());

            Long matching = 0L;
            Long total = 0L;

            if (!result.isEmpty()) {
                Object[] row = result.get(0);
                matching = row[0] != null ? ((Number) row[0]).longValue() : 0L;
                total = row[1] != null ? ((Number) row[1]).longValue() : 0L;
            }
            if (total == 0) continue;

            BigDecimal score = BigDecimal.valueOf(matching)
                    .multiply(BigDecimal.valueOf(100))
                    .divide(BigDecimal.valueOf(total), 2, RoundingMode.HALF_UP);

            results.add(SimilarityRankingDto.builder()
                    .id(other.getId())
                    .name(other.getName())
                    .iso2Code(other.getIso2Code())
                    .region(other.getRegion() != null
                            ? other.getRegion().name().replace("_", " ") : null)
                    .score(score)
                    .resolutionsCompared(total.intValue())
                    .build());
        }

        return results.stream()
                .sorted(Comparator.comparing(SimilarityRankingDto::getScore).reversed())
                .limit(limit)
                .collect(Collectors.toList());
    }

    /**
     * Compute and persist similarity scores for ALL country pairs.
     * Call once after seeding data (or nightly via @Scheduled).
     */
    @Transactional
    public void rebuildCache() {
        log.info("Rebuilding similarity cache for all country pairs...");
        List<Country> countries = countryRepo.findAll();
        int computed = 0;

        for (int i = 0; i < countries.size(); i++) {
            for (int j = i + 1; j < countries.size(); j++) {
                Country a = countries.get(i);
                Country b = countries.get(j);

                List<Object[]> result = voteRepo.computeSharedVotes(a.getId(), b.getId());

                Long matching = 0L;
                Long total = 0L;

                if (!result.isEmpty()) {
                    Object[] row = result.get(0);
                    matching = row[0] != null ? ((Number) row[0]).longValue() : 0L;
                    total = row[1] != null ? ((Number) row[1]).longValue() : 0L;
                }
                if (total == 0) continue;

                BigDecimal score = BigDecimal.valueOf(matching)
                        .multiply(BigDecimal.valueOf(100))
                        .divide(BigDecimal.valueOf(total), 2, RoundingMode.HALF_UP);

                // Upsert
                SimilarityCache entry = cacheRepo
                        .findByCountryAIdAndCountryBId(a.getId(), b.getId())
                        .orElse(SimilarityCache.builder().countryA(a).countryB(b).build());

                entry.setSimilarityScore(score);
                entry.setResolutionsCompared(total.intValue());
                cacheRepo.save(entry);
                computed++;
            }
        }
        log.info("Cache rebuilt. {} country pairs computed.", computed);
    }

    // ── Voting Blocs ──────────────────────────────────────────────────────────

    /**
     * Group countries into blocs by region and show their vote distribution.
     * Optionally filtered by topic slug.
     */
//    @Transactional(readOnly = true)
//    public List<BlocDto> getBlocs(String topicSlug) {
//        // Fetch all votes (optionally by topic) via JPQL
//        List<Vote> votes = voteRepo.findAllVotes(topicSlug); // reuse with null countryId means all
//        log.info("The total votes for calculating voting Blocs : "+votes.size());
//        // Group by region
//        Map<String, Set<String>>       regionCountries = new LinkedHashMap<>();
//        Map<String, Map<String, Long>> regionVoteDist  = new LinkedHashMap<>();
//
//        for (Vote v : votes) {
//            String region = v.getCountry().getRegion() != null
//                    ? v.getCountry().getRegion().name().replace("_", " ") : "Unknown";
//
//            regionCountries.computeIfAbsent(region, k -> new TreeSet<>())
//                    .add(v.getCountry().getName());
//
//            regionVoteDist.computeIfAbsent(region, k -> new HashMap<>())
//                    .merge(v.getVoteType().name(), 1L, Long::sum);
//        }
//
//        return regionCountries.entrySet().stream()
//                .map(e -> BlocDto.builder()
//                        .region(e.getKey())
//                        .countryCount(e.getValue().size())
//                        .countries(new ArrayList<>(e.getValue()))
//                        .voteDistribution(regionVoteDist.getOrDefault(e.getKey(), Map.of()))
//                        .build())
//                .collect(Collectors.toList());
//    }
    @Transactional(readOnly = true)
    public List<BlocDto> getBlocs(String topicSlug) {

        List<Object[]> rows =
                voteRepo.findBlocData(topicSlug);

        Map<String, Set<String>> regionCountries =
                new LinkedHashMap<>();

        Map<String, Map<String, Long>> regionVoteDist =
                new LinkedHashMap<>();

        for (Object[] row : rows) {

            String region =
                    String.valueOf(row[0]);

            String countryName =
                    String.valueOf(row[1]);

            String voteType =
                    String.valueOf(row[2]);

            Long count =
                    ((Number) row[3]).longValue();

            regionCountries
                    .computeIfAbsent(region,
                            k -> new TreeSet<>())
                    .add(countryName);

            regionVoteDist
                    .computeIfAbsent(region,
                            k -> new HashMap<>())
                    .merge(voteType, count, Long::sum);
        }

        return regionCountries.entrySet()
                .stream()
                .map(e -> BlocDto.builder()
                        .region(e.getKey())
                        .countryCount(e.getValue().size())
                        .countries(
                                e.getValue()
                                        .stream()
                                        .limit(10)
                                        .toList()
                        )
                        .voteDistribution(
                                regionVoteDist.getOrDefault(
                                        e.getKey(),
                                        Map.of()
                                )
                        )
                        .build())
                .toList();
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private String interpretScore(double score) {
        if (score >= 90) return "Very close diplomatic allies";
        if (score >= 70) return "Generally aligned, occasional divergence";
        if (score >= 50) return "Mixed alignment — agree on some issues, split on others";
        if (score >= 30) return "Frequently opposed";
        return "Diplomatic rivals on most issues";
    }
}