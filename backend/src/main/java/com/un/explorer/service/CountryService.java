package com.un.explorer.service;
import lombok.extern.slf4j.Slf4j;
import com.un.explorer.dto.*;
import com.un.explorer.model.*;
import com.un.explorer.repository.*;
import jakarta.persistence.Cacheable;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CountryService {

    private final CountryRepository countryRepo;
    private final VoteRepository    voteRepo;

    /**
     * All countries, sorted alphabetically.
     */
    public List<CountryDto> getAllCountries() {
        return countryRepo.findAllByOrderByNameAsc()
                .stream()
                .map(CountryDto::from)
                .collect(Collectors.toList());
    }

    /**
     * Country profile: basic info + vote breakdown stats + yearly yes% trend.
     */
    public CountryProfileDto getProfile(Long countryId) {
        Country country = countryRepo.findById(countryId)
                .orElseThrow(() -> new RuntimeException("Country not found: " + countryId));

        // Vote type counts → { "yes": 120, "no": 40, ... }
        List<Object[]> rawStats = voteRepo.countByVoteTypeForCountry(countryId);
        Map<String, Long> stats = new LinkedHashMap<>();
        for (Object[] row : rawStats) {
            Vote.VoteType type = (Vote.VoteType) row[0];
            Long count = (Long) row[1];
            stats.put(type.name(), count);
        }

        // Year-wise yes% trend
        List<Object[]> rawTrend = voteRepo.yearlyTrendForCountry(countryId);
        List<CountryProfileDto.YearTrendDto> trend = rawTrend.stream().limit(10).map(row -> {
            int year     = (Integer) row[0];
            long yesCount = (Long) row[1];
            long total    = (Long) row[2];
            int yesPct   = total > 0 ? (int) Math.round((yesCount * 100.0) / total) : 0;
            return new CountryProfileDto.YearTrendDto(year, yesPct, total);
        }).collect(Collectors.toList());

        Collections.reverse(trend);

        return CountryProfileDto.builder()
                .country(CountryDto.from(country))
                .stats(stats)
                .trend(trend)
                .build();
    }

    /**
     * Full voting history of a country, with optional topic/year filter.
     */
//    public List<CountryVoteHistoryDto> getVoteHistory(Long countryId, String topicSlug, Integer year) {
//        List<Vote> votes = voteRepo.findByCountryId(
//                countryId,
//                (topicSlug == null || topicSlug.isBlank()) ? null : topicSlug,
//                year
//        );
//
//        return votes.stream().map(v -> {
//            Resolution r = v.getResolution();
//            List<String> topics = r.getTopics().stream()
//                    .map(Topic::getName).sorted().collect(Collectors.toList());
//            return new CountryVoteHistoryDto(
//                    r.getId(), r.getResolutionNumber(), r.getTitle(),
//                    r.getSessionYear(), r.getVoteDate(),
//                    v.getVoteType().name(), topics
//            );
//        }).collect(Collectors.toList());
//    }

    public Page<CountryVoteHistoryDto> getVoteHistory(Long countryId, String topicSlug, Integer year, int page, int size) {

        log.info("getVoteHistory params getting : ID-"+countryId+" Page : "+page+ " Size "+ size);

        Pageable pageable = PageRequest.of(page, size,  Sort.by(Sort.Direction.DESC, "resolution.voteDate"));

        Page<Vote> votes = voteRepo.findByCountryId(
                countryId,
                (topicSlug == null || topicSlug.isBlank()) ? null : topicSlug,
                year,
                pageable
        );

        return votes.map(v -> {
            Resolution r = v.getResolution();
            List<String> topics = r.getTopics().stream()
                    .map(Topic::getName).sorted().toList();

            return new CountryVoteHistoryDto(
                    r.getId(), r.getResolutionNumber(), r.getTitle(),
                    r.getSessionYear(), r.getVoteDate(),
                    v.getVoteType().name(), topics
            );
        });
    }
}