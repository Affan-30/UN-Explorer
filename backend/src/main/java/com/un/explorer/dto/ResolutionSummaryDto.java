package com.un.explorer.dto;

import com.un.explorer.model.*;
import lombok.*;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Data
@Builder
public class ResolutionSummaryDto {
    private Long id;
    private String resolutionNumber;
    private String title;
    private Integer sessionYear;
    private LocalDate voteDate;
    private Integer totalYes;
    private Integer totalNo;
    private Integer totalAbstain;
    private Integer totalAbsent;
    private List<String> topics;

    public static ResolutionSummaryDto from(Resolution r) {
        return ResolutionSummaryDto.builder()
                .id(r.getId())
                .resolutionNumber(r.getResolutionNumber())
                .title(r.getTitle())
                .sessionYear(r.getSessionYear())
                .voteDate(r.getVoteDate())
                .totalYes(r.getTotalYes())
                .totalNo(r.getTotalNo())
                .totalAbstain(r.getTotalAbstain())
                .totalAbsent(r.getTotalAbsent())
                .topics(r.getTopics().stream()
                        .map(Topic::getName)
                        .sorted()
                        .collect(Collectors.toList()))
                .build();
    }
}