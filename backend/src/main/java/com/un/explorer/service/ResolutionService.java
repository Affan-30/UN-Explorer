package com.un.explorer.service;

import com.un.explorer.dto.*;
import com.un.explorer.model.*;
import com.un.explorer.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ResolutionService {

    private final ResolutionRepository resolutionRepo;
    private final VoteRepository       voteRepo;

    /**
     * Search/filter resolutions with pagination.
     */
    public PageDto<ResolutionSummaryDto> search(
            String search, String topicSlug, Integer year, int page, int limit) {

        Pageable pageable = PageRequest.of(page - 1, limit);
        Page<Resolution> result = resolutionRepo.search(
                search == null || search.isBlank() ? null : search,
                topicSlug == null || topicSlug.isBlank() ? null : topicSlug,
                year,
                pageable
        );

        List<ResolutionSummaryDto> dtos = result.getContent()
                .stream()
                .map(ResolutionSummaryDto::from)
                .collect(Collectors.toList());

        return new PageDto<>(dtos, page, limit, result.getTotalElements());
    }

    /**
     * Get a single resolution by id.
     */
//    public ResolutionSummaryDto getById(Long id) {
//        Optional<Resolution> r = null;
//        try {
//
//           r = resolutionRepo.findById(id);
//
//        } catch (Exception e) {
//            new RuntimeException("Resolution not found: " + id);
//        }
//        return ResolutionSummaryDto.from(r);
//    }
    public ResolutionSummaryDto getById(Long id) {
        Resolution r = resolutionRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Resolution not found: " + id));

        return ResolutionSummaryDto.from(r);
    }

    /**
     * Get all country votes for a resolution, grouped by vote type.
     */
    public ResolutionVotesDto getVotes(Long resolutionId) {
        List<Vote> votes = voteRepo.findByResolutionId(resolutionId);

        // Group into { "yes": [...], "no": [...], "abstain": [...], "absent": [...] }
        Map<String, List<VoteDto>> grouped = new LinkedHashMap<>();
        grouped.put("yes",     new ArrayList<>());
        grouped.put("no",      new ArrayList<>());
        grouped.put("abstain", new ArrayList<>());
        grouped.put("absent",  new ArrayList<>());

        for (Vote v : votes) {
            grouped.get(v.getVoteType().name()).add(VoteDto.from(v));
        }

        return ResolutionVotesDto.builder()
                .resolutionId(resolutionId)
                .votes(grouped)
                .total(votes.size())
                .build();
    }
}